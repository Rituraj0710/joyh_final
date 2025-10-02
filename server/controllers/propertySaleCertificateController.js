import PropertySaleCertificate from "../models/PropertySaleCertificate.js";
import logger from "../config/logger.js";
import DOMPurify from 'isomorphic-dompurify';

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input.trim());
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

class PropertySaleCertificateController {
  static create = async (req, res) => {
    try {
      // Sanitize all input data
      const sanitizedData = sanitizeInput(req.body);
      
      const {
        bank_select,
        bank_other,
        bank_reg_off,
        bank_head_off,
        bank_pan,
        bank_post,
        bank_rep_title,
        bank_rep_name,
        bank_rep_rel,
        bank_rep_father_name,
        bank_rep_occ,
        bank_rep_mobile,
        bank_rep_email,
        bank_rep_addr,
        ack_amount,
        ack_amount_words,
        previous_owner,
        acquisition_mode,
        bank_power,
        prop_category,
        prop_subtype,
        construction_type,
        prop_state,
        prop_tehsil,
        prop_ward,
        prop_khasra,
        prop_plot,
        prop_flat_floor,
        covered_area,
        super_area,
        plot_area_val,
        plot_area_unit,
        plot_area_sqm,
        road_size_val,
        road_size_unit,
        road_size_m,
        road_double,
        park_facing,
        corner_plot,
        prop_address,
        purchasers = [],
        witnesses = [],
        payments = [],
        floors = []
      } = sanitizedData;

      // Validation
      if (!bank_select || !bank_rep_name || !bank_rep_father_name || !bank_rep_mobile || !ack_amount) {
        logger.warn('Property sale certificate creation failed: Missing required fields', { 
          userId: req.user?.id,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: "Missing required fields: bank_select, bank_rep_name, bank_rep_father_name, bank_rep_mobile, ack_amount"
        });
      }

      // Validate purchasers
      if (!purchasers || purchasers.length === 0) {
        logger.warn('Property sale certificate creation failed: No purchasers provided', { 
          userId: req.user?.id,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: "At least one purchaser is required"
        });
      }

      // Validate each purchaser
      for (const purchaser of purchasers) {
        if (!purchaser.name || !purchaser.father_name || !purchaser.addr || !purchaser.mobile) {
          logger.warn('Property sale certificate creation failed: Invalid purchaser data', { 
            userId: req.user?.id,
            purchaser: purchaser
          });
          return res.status(400).json({
            success: false,
            message: "Each purchaser must have name, father_name, address, and mobile number"
          });
        }
      }

      // Create property sale certificate
      const propertySaleCertificateData = {
        bank: {
          select: bank_select,
          other: bank_other,
          reg_off: bank_reg_off,
          head_off: bank_head_off,
          pan: bank_pan,
          post: bank_post
        },
        bank_representative: {
          title: bank_rep_title || 'श्री',
          name: bank_rep_name,
          relation: bank_rep_rel || 'पुत्र',
          father_name: bank_rep_father_name,
          occupation: bank_rep_occ,
          mobile: bank_rep_mobile,
          email: bank_rep_email,
          address: bank_rep_addr
        },
        acknowledgment: {
          amount: parseFloat(ack_amount) || 0,
          amount_words: ack_amount_words
        },
        property: {
          previous_owner,
          acquisition_mode,
          bank_power,
          category: prop_category,
          subtype: prop_subtype,
          construction_type,
          state: prop_state || 'Uttar Pradesh',
          tehsil: prop_tehsil,
          ward: prop_ward,
          khasra: prop_khasra,
          plot: prop_plot,
          flat_floor: prop_flat_floor,
          covered_area: parseFloat(covered_area) || 0,
          super_area: parseFloat(super_area) || 0,
          plot_area: {
            value: parseFloat(plot_area_val) || 0,
            unit: plot_area_unit || 'sqm',
            sqm: parseFloat(plot_area_sqm) || 0
          },
          road_size: {
            value: parseFloat(road_size_val) || 0,
            unit: road_size_unit || 'sqm',
            meters: parseFloat(road_size_m) || 0
          },
          features: {
            road_double: road_double === 'true' || road_double === true,
            park_facing: park_facing === 'true' || park_facing === true,
            corner_plot: corner_plot === 'true' || corner_plot === true
          },
          address: prop_address
        },
        purchasers,
        witnesses,
        payments,
        floors,
        createdBy: req.user?.id || null,
        status: 'draft',
        amount: 2000 // Base amount for property sale certificate
      };

      const propertySaleCertificate = new PropertySaleCertificate(propertySaleCertificateData);
      await propertySaleCertificate.save();

      logger.info('Property sale certificate created successfully', { 
        propertySaleCertificateId: propertySaleCertificate._id,
        userId: req.user?.id,
        bank_select,
        prop_category
      });

      res.status(201).json({
        success: true,
        message: "Property sale certificate created successfully",
        data: {
          id: propertySaleCertificate._id,
          bank_select: propertySaleCertificate.bank.select,
          prop_category: propertySaleCertificate.property.category,
          status: propertySaleCertificate.status,
          amount: propertySaleCertificate.amount
        }
      });

    } catch (error) {
      logger.error('Property sale certificate creation error', { 
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        ip: req.ip
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  };

  static getAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const filter = {};
      
      if (req.user?.id) {
        filter.createdBy = req.user.id;
      }
      if (status) {
        filter.status = status;
      }
      
      const propertySaleCertificates = await PropertySaleCertificate.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await PropertySaleCertificate.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          propertySaleCertificates,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        }
      });

    } catch (error) {
      logger.error('Get all property sale certificates error', { 
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  static getById = async (req, res) => {
    try {
      const { id } = req.params;
      
      const filter = { _id: id };
      if (req.user?.id) {
        filter.createdBy = req.user.id;
      }
      
      const propertySaleCertificate = await PropertySaleCertificate.findOne(filter)
        .populate('createdBy', 'name email');

      if (!propertySaleCertificate) {
        return res.status(404).json({
          success: false,
          message: "Property sale certificate not found"
        });
      }

      res.status(200).json({
        success: true,
        data: { propertySaleCertificate }
      });

    } catch (error) {
      logger.error('Get property sale certificate by ID error', { 
        error: error.message,
        propertySaleCertificateId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  static updateStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['draft', 'submitted', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: draft, submitted, approved, rejected"
        });
      }

      const filter = { _id: id };
      if (req.user?.id) {
        filter.createdBy = req.user.id;
      }

      const propertySaleCertificate = await PropertySaleCertificate.findOneAndUpdate(
        filter,
        { status },
        { new: true }
      );

      if (!propertySaleCertificate) {
        return res.status(404).json({
          success: false,
          message: "Property sale certificate not found"
        });
      }

      logger.info('Property sale certificate status updated', { 
        propertySaleCertificateId: id,
        newStatus: status,
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: "Property sale certificate status updated successfully",
        data: { propertySaleCertificate }
      });

    } catch (error) {
      logger.error('Update property sale certificate status error', { 
        error: error.message,
        propertySaleCertificateId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  static delete = async (req, res) => {
    try {
      const { id } = req.params;
      
      const filter = { _id: id };
      if (req.user?.id) {
        filter.createdBy = req.user.id;
      }
      
      const propertySaleCertificate = await PropertySaleCertificate.findOneAndDelete(filter);

      if (!propertySaleCertificate) {
        return res.status(404).json({
          success: false,
          message: "Property sale certificate not found"
        });
      }

      logger.info('Property sale certificate deleted', { 
        propertySaleCertificateId: id,
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: "Property sale certificate deleted successfully"
      });

    } catch (error) {
      logger.error('Delete property sale certificate error', { 
        error: error.message,
        propertySaleCertificateId: req.params.id,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };

  static getStats = async (req, res) => {
    try {
      const matchFilter = {};
      if (req.user?.id) {
        matchFilter.createdBy = req.user.id;
      }
      
      const stats = await PropertySaleCertificate.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const formattedStats = {
        total: 0,
        draft: 0,
        submitted: 0,
        approved: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });

      res.status(200).json({
        success: true,
        data: { stats: formattedStats }
      });

    } catch (error) {
      logger.error('Get property sale certificate stats error', { 
        error: error.message,
        userId: req.user?.id
      });
      
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
}

export default PropertySaleCertificateController;