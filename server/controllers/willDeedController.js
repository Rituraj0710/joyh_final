import WillDeed from "../models/WillDeed.js";
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

class WillDeedController {
  static create = async (req, res) => {
    try {
      // Sanitize all input data
      const sanitizedData = sanitizeInput(req.body);
      
      const {
        testator,
        beneficiaries = [],
        executors = [],
        witnesses = [],
        immovables = [],
        movables = [],
        rules = [],
        conditions = [],
        meta = {}
      } = sanitizedData;

      // Validation
      if (!testator || !testator.name) {
        logger.warn('Will deed creation failed: Missing testator information', { 
          userId: req.user?.id,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: "Testator information is required"
        });
      }

      // Validate beneficiaries
      if (!beneficiaries || beneficiaries.length === 0) {
        logger.warn('Will deed creation failed: No beneficiaries provided', { 
          userId: req.user?.id,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: "At least one beneficiary is required"
        });
      }

      // Validate witnesses (minimum 2 required)
      if (!witnesses || witnesses.length < 2) {
        logger.warn('Will deed creation failed: Insufficient witnesses', { 
          userId: req.user?.id,
          ip: req.ip
        });
        return res.status(400).json({
          success: false,
          message: "At least two witnesses are required"
        });
      }

      // Create will deed
      const willDeedData = {
        meta: {
          draftBy: meta.draftBy || 'Jyoh Services Pvt. Ltd.',
          propertyType: meta.propertyType || 'both',
          status: 'draft',
          createdAt: new Date()
        },
        testator,
        beneficiaries,
        executors,
        witnesses,
        immovables,
        movables,
        rules,
        conditions,
        createdBy: req.user?.id || null
      };

      const willDeed = new WillDeed(willDeedData);
      await willDeed.save();

      logger.info('Will deed created successfully', { 
        willDeedId: willDeed._id,
        userId: req.user?.id,
        testatorName: testator.name
      });

      res.status(201).json({
        success: true,
        message: "Will deed created successfully",
        data: {
          id: willDeed._id,
          testatorName: willDeed.testator.name,
          status: willDeed.meta.status,
          createdAt: willDeed.meta.createdAt
        }
      });

    } catch (error) {
      logger.error('Will deed creation error', { 
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

  static submit = async (req, res) => {
    try {
      const jsonPart = req.body?.data ? JSON.parse(req.body.data) : req.body;
      if (!jsonPart) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing form data' 
        });
      }

      const sanitizedData = sanitizeInput(jsonPart);

      const willDeedData = {
        meta: sanitizedData.meta || { status: 'submitted' },
        testator: sanitizedData.testator || {},
        beneficiaries: sanitizedData.beneficiaries || [],
        executors: sanitizedData.executors || [],
        witnesses: sanitizedData.witnesses || [],
        immovables: sanitizedData.immovables || [],
        movables: sanitizedData.movables || [],
        rules: sanitizedData.rules || [],
        conditions: sanitizedData.conditions || [],
        createdBy: req.user?._id || null
      };

      // Handle file uploads
      const uploads = { testatorId: '', testatorPhoto: '', personIds: [], personPhotos: [] };
      (req.files || []).forEach((f) => {
        if (f.fieldname === 'testator_id') uploads.testatorId = f.path;
        else if (f.fieldname === 'testator_photo') uploads.testatorPhoto = f.path;
        else if (f.fieldname.startsWith('person_id_')) uploads.personIds.push(f.path);
        else if (f.fieldname.startsWith('person_photo_')) uploads.personPhotos.push(f.path);
      });
      willDeedData.uploads = uploads;

      const willDeed = new WillDeed(willDeedData);
      await willDeed.save();

      logger.info('Will deed submitted successfully', { 
        willDeedId: willDeed._id,
        userId: req.user?._id
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Will deed submitted successfully', 
        data: { id: willDeed._id } 
      });
    } catch (error) {
      logger.error('Will deed submit error', { 
        error: error.message, 
        stack: error.stack, 
        userId: req.user?._id
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  };

  static getAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const filter = {};
      
      if (req.user?._id) {
        filter.createdBy = req.user._id;
      }
      if (status && status !== '') {
        filter['meta.status'] = status;
      }
      
      const willDeeds = await WillDeed.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await WillDeed.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          willDeeds,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        }
      });

    } catch (error) {
      logger.error('Get all will deeds error', { 
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
      if (req.user?._id) {
        filter.createdBy = req.user._id;
      }
      
      const willDeed = await WillDeed.findOne(filter)
        .populate('createdBy', 'name email');

      if (!willDeed) {
        return res.status(404).json({
          success: false,
          message: "Will deed not found"
        });
      }

      res.status(200).json({
        success: true,
        data: { willDeed }
      });

    } catch (error) {
      logger.error('Get will deed by ID error', { 
        error: error.message,
        willDeedId: req.params.id,
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
      if (req.user?._id) {
        filter.createdBy = req.user._id;
      }
      
      const willDeed = await WillDeed.findOneAndUpdate(
        filter,
        { 'meta.status': status },
        { new: true }
      );

      if (!willDeed) {
        return res.status(404).json({
          success: false,
          message: "Will deed not found"
        });
      }

      logger.info('Will deed status updated', { 
        willDeedId: id,
        newStatus: status,
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: "Will deed status updated successfully",
        data: { willDeed }
      });

    } catch (error) {
      logger.error('Update will deed status error', { 
        error: error.message,
        willDeedId: req.params.id,
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
      if (req.user?._id) {
        filter.createdBy = req.user._id;
      }
      
      const willDeed = await WillDeed.findOneAndDelete(filter);

      if (!willDeed) {
        return res.status(404).json({
          success: false,
          message: "Will deed not found"
        });
      }

      logger.info('Will deed deleted', { 
        willDeedId: id,
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: "Will deed deleted successfully"
      });

    } catch (error) {
      logger.error('Delete will deed error', { 
        error: error.message,
        willDeedId: req.params.id,
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
      if (req.user?._id) {
        matchFilter.createdBy = req.user._id;
      }
      
      const stats = await WillDeed.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$meta.status',
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
      logger.error('Get will deed stats error', { 
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

export default WillDeedController;