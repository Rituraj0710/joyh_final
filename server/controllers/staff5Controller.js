import FormsData from '../models/FormsData.js';
import StaffReport from '../models/StaffReport.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class Staff5Controller {
  /**
   * Get Staff5 dashboard statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get forms ready for final approval (all staff levels complete)
      const pendingFinalApproval = await FormsData.countDocuments({
        'approvals.staff1.approved': true,
        'approvals.staff2.approved': true,
        'approvals.staff3.approved': true,
        'approvals.staff4.approved': true,
        'approvals.staff5.locked': false,
        status: 'cross_verified'
      });

      const formsLocked = await FormsData.countDocuments({
        'approvals.staff5.locked': true,
        'approvals.staff5.lockedBy': userId,
        updatedAt: { $gte: today, $lt: tomorrow }
      });

      const formsApproved = await FormsData.countDocuments({
        'approvals.staff5.locked': true,
        'approvals.staff5.finalDecision': 'approved',
        'approvals.staff5.lockedBy': userId,
        updatedAt: { $gte: today, $lt: tomorrow }
      });

      const formsRejected = await FormsData.countDocuments({
        'approvals.staff5.locked': true,
        'approvals.staff5.finalDecision': 'rejected',
        'approvals.staff5.lockedBy': userId,
        updatedAt: { $gte: today, $lt: tomorrow }
      });

      const finalReportsGenerated = await StaffReport.countDocuments({
        staffId: userId,
        role: 'staff5',
        reportType: 'final_report',
        date: { $gte: today, $lt: tomorrow }
      });

      const todayTasks = pendingFinalApproval;

      // Calculate weekly progress (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weeklyCompleted = await FormsData.countDocuments({
        'approvals.staff5.locked': true,
        'approvals.staff5.lockedBy': userId,
        updatedAt: { $gte: weekAgo }
      });

      const stats = {
        pendingFinalApproval,
        formsLocked,
        formsApproved,
        formsRejected,
        finalReportsGenerated,
        todayTasks,
        weeklyProgress: weeklyCompleted
      };

      // Log the action
      await AuditLog.logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'dashboard_view',
        resource: 'staff5_dashboard',
        details: 'Viewed Staff5 dashboard statistics',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        status: 'success',
        data: stats
      });

    } catch (error) {
      logger.error('Error getting Staff5 dashboard stats:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error retrieving dashboard statistics'
      });
    }
  }

  /**
   * Get forms for Staff5 final review
   */
  static async getForms(req, res) {
    try {
      const { page = 1, limit = 10, status, formType, search, verificationStage } = req.query;
      const userId = req.user.id;
      
      // Build query for Staff5 forms - can see all forms
      let query = {};

      // Add verification stage filter
      if (verificationStage === 'staff4_complete') {
        query = {
          'approvals.staff1.approved': true,
          'approvals.staff2.approved': true,
          'approvals.staff3.approved': true,
          'approvals.staff4.approved': true,
          'approvals.staff5.locked': false
        };
      } else if (verificationStage === 'ready_for_final') {
        query = {
          'approvals.staff1.approved': true,
          'approvals.staff2.approved': true,
          'approvals.staff3.approved': true,
          'approvals.staff4.approved': true,
          'approvals.staff5.locked': false,
          status: 'cross_verified'
        };
      } else if (verificationStage === 'locked') {
        query = {
          'approvals.staff5.locked': true
        };
      }

      // Add other filters
      if (status) query.status = status;
      if (formType) query.formType = formType;
      if (search) {
        query.$or = [
          { _id: { $regex: search, $options: 'i' } },
          { 'data.applicantName': { $regex: search, $options: 'i' } },
          { 'data.trusteeName': { $regex: search, $options: 'i' } },
          { 'data.landOwner': { $regex: search, $options: 'i' } },
          { 'data.plotNumber': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const forms = await FormsData.find(query)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await FormsData.countDocuments(query);

      // Staff5 can see ALL form data and verification history
      const processedForms = forms.map(form => ({
        ...form.toObject(),
        data: form.data || {},
        verificationHistory: form.verificationHistory || []
      }));

      // Log the action
      await AuditLog.logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'forms_view',
        resource: 'staff5_forms',
        details: `Viewed forms for Staff5 final review`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        status: 'success',
        data: {
          forms: processedForms,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting Staff5 forms:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error retrieving forms'
      });
    }
  }

  /**
   * Get specific form for Staff5 final review
   */
  static async getFormById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const form = await FormsData.findById(id)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email role');

      if (!form) {
        return res.status(404).json({
          status: 'failed',
          message: 'Form not found'
        });
      }

      // Staff5 can see ALL form data and verification history
      const processedForm = {
        ...form.toObject(),
        data: form.data || {},
        verificationHistory: form.verificationHistory || []
      };

      // Log the action
      await AuditLog.logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'form_view',
        resource: 'staff5_form',
        resourceId: form._id,
        details: `Viewed form ${id} for Staff5 final review`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        status: 'success',
        data: {
          form: processedForm
        }
      });

    } catch (error) {
      logger.error('Error getting Staff5 form by ID:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error retrieving form'
      });
    }
  }

  /**
   * Final approval and lock by Staff5
   */
  static async finalApproval(req, res) {
    try {
      const { id } = req.params;
      const { decision, finalRemarks, lockForm } = req.body;
      const userId = req.user.id;

      const form = await FormsData.findById(id);
      if (!form) {
        return res.status(404).json({
          status: 'failed',
          message: 'Form not found'
        });
      }

      // Check if form is ready for final approval
      if (!form.approvals?.staff1?.approved || !form.approvals?.staff2?.approved || 
          !form.approvals?.staff3?.approved || !form.approvals?.staff4?.approved) {
        return res.status(403).json({
          status: 'failed',
          message: 'Form is not ready for final approval. All previous staff levels must be complete.'
        });
      }

      // Check if form is already locked
      if (form.approvals?.staff5?.locked) {
        return res.status(403).json({
          status: 'failed',
          message: 'Form is already locked and cannot be modified'
        });
      }

      const updateData = {
        'approvals.staff5': {
          locked: lockForm,
          lockedBy: userId,
          lockedAt: new Date(),
          finalDecision: decision,
          finalRemarks: finalRemarks,
          status: decision === 'approved' ? 'approved' : 'rejected'
        }
      };

      // Update form status based on decision
      if (decision === 'approved') {
        updateData.status = 'approved';
      } else {
        updateData.status = 'rejected';
      }

      // Add verification history entry
      const verificationEntry = {
        staffLevel: 'staff5',
        action: `Final ${decision}`,
        timestamp: new Date(),
        notes: finalRemarks,
        verifiedBy: userId
      };

      updateData.$push = {
        verificationHistory: verificationEntry
      };

      const updatedForm = await FormsData.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      // Generate final report if form is locked
      if (lockForm) {
        try {
          await Staff5Controller.generateFinalReport(updatedForm, userId);
        } catch (reportError) {
          logger.error('Error generating final report:', reportError);
          // Don't fail the approval if report generation fails
        }
      }

      // Log the action
      await AuditLog.logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'form_final_approval',
        resource: 'staff5_form',
        resourceId: form._id,
        details: `Staff5 ${decision} and ${lockForm ? 'locked' : 'reviewed'} form`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        status: 'success',
        message: `Form ${decision} and ${lockForm ? 'locked' : 'reviewed'} successfully`,
        data: { form: updatedForm }
      });

    } catch (error) {
      logger.error('Error processing Staff5 final approval:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error processing final approval'
      });
    }
  }

  /**
   * Generate final report for a form
   */
  static async generateFinalReport(form, staffId) {
    try {
      const reportData = {
        formId: form._id,
        formType: form.formType,
        finalDecision: form.approvals?.staff5?.finalDecision,
        finalRemarks: form.approvals?.staff5?.finalRemarks,
        lockedAt: form.approvals?.staff5?.lockedAt,
        verificationSummary: {
          staff1: form.approvals?.staff1?.approved || false,
          staff2: form.approvals?.staff2?.approved || false,
          staff3: form.approvals?.staff3?.approved || false,
          staff4: form.approvals?.staff4?.approved || false
        },
        formData: form.data,
        verificationHistory: form.verificationHistory || []
      };

      // Create report record
      const report = new StaffReport({
        staffId: staffId,
        role: 'staff5',
        formId: form._id,
        reportType: 'final_report',
        reportData: reportData,
        status: 'generated',
        generatedAt: new Date()
      });

      await report.save();

      return report;
    } catch (error) {
      logger.error('Error generating final report:', error);
      throw error;
    }
  }

  /**
   * Get final reports
   */
  static async getFinalReports(req, res) {
    try {
      const { page = 1, limit = 10, status, formType, dateFrom, dateTo } = req.query;
      const userId = req.user.id;
      
      let query = {
        staffId: userId,
        role: 'staff5',
        reportType: 'final_report'
      };

      if (status) query.status = status;
      if (formType) query['reportData.formType'] = formType;
      
      if (dateFrom || dateTo) {
        query.generatedAt = {};
        if (dateFrom) query.generatedAt.$gte = new Date(dateFrom);
        if (dateTo) query.generatedAt.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;
      
      const reports = await StaffReport.find(query)
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await StaffReport.countDocuments(query);

      res.json({
        status: 'success',
        data: {
          reports,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting final reports:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error retrieving final reports'
      });
    }
  }

  /**
   * Generate PDF for final report
   */
  static async generateFinalReportPDF(req, res) {
    try {
      const { formId } = req.params;
      const userId = req.user.id;

      // Get the form and report data
      const form = await FormsData.findById(formId)
        .populate('userId', 'name email')
        .populate('assignedTo', 'name email role');

      if (!form) {
        return res.status(404).json({
          status: 'failed',
          message: 'Form not found'
        });
      }

      // Check if form is locked by Staff5
      if (!form.approvals?.staff5?.locked) {
        return res.status(403).json({
          status: 'failed',
          message: 'Form must be locked before generating final report'
        });
      }

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Create HTML content for the report
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Final Report - ${form.formType}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .form-data { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .verification-status { display: flex; justify-content: space-between; margin: 10px 0; }
            .approved { color: green; font-weight: bold; }
            .rejected { color: red; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Final Verification Report</h1>
            <p>Form ID: ${form._id}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>Form Information</h3>
            <div class="form-data">
              <p><strong>Form Type:</strong> ${form.formType?.replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Status:</strong> ${form.status?.replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Submitted by:</strong> ${form.userId?.name || form.userId?.email || 'Unknown'}</p>
              <p><strong>Created:</strong> ${new Date(form.createdAt).toLocaleString()}</p>
              <p><strong>Final Decision:</strong> ${form.approvals?.staff5?.finalDecision?.toUpperCase()}</p>
              <p><strong>Locked at:</strong> ${new Date(form.approvals?.staff5?.lockedAt).toLocaleString()}</p>
            </div>
          </div>

          <div class="section">
            <h3>Verification Status</h3>
            <div class="verification-status">
              <span>Staff1 (Primary Details):</span>
              <span class="${form.approvals?.staff1?.approved ? 'approved' : 'rejected'}">
                ${form.approvals?.staff1?.approved ? 'APPROVED' : 'PENDING'}
              </span>
            </div>
            <div class="verification-status">
              <span>Staff2 (Trustee Details):</span>
              <span class="${form.approvals?.staff2?.approved ? 'approved' : 'rejected'}">
                ${form.approvals?.staff2?.approved ? 'APPROVED' : 'PENDING'}
              </span>
            </div>
            <div class="verification-status">
              <span>Staff3 (Land Details):</span>
              <span class="${form.approvals?.staff3?.approved ? 'approved' : 'rejected'}">
                ${form.approvals?.staff3?.approved ? 'APPROVED' : 'PENDING'}
              </span>
            </div>
            <div class="verification-status">
              <span>Staff4 (Cross Verification):</span>
              <span class="${form.approvals?.staff4?.approved ? 'approved' : 'rejected'}">
                ${form.approvals?.staff4?.approved ? 'APPROVED' : 'PENDING'}
              </span>
            </div>
            <div class="verification-status">
              <span>Staff5 (Final Authority):</span>
              <span class="approved">LOCKED</span>
            </div>
          </div>

          <div class="section">
            <h3>Form Data</h3>
            <div class="form-data">
              ${form.data ? Object.entries(form.data).map(([key, value]) => 
                `<p><strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> ${value || 'Not provided'}</p>`
              ).join('') : '<p>No form data available</p>'}
            </div>
          </div>

          <div class="section">
            <h3>Final Remarks</h3>
            <div class="form-data">
              <p>${form.approvals?.staff5?.finalRemarks || 'No remarks provided'}</p>
            </div>
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Staff5 Final Authority System</p>
            <p>Form is now locked and no further changes are allowed</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="final-report-${formId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

    } catch (error) {
      logger.error('Error generating final report PDF:', error);
      res.status(500).json({
        status: 'failed',
        message: 'Error generating PDF report'
      });
    }
  }
}

export default Staff5Controller;
