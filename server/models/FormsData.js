import mongoose from 'mongoose';

const formsDataSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Form'
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['sale-deed', 'will-deed', 'trust-deed', 'property-registration', 'power-of-attorney', 'adoption-deed'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'verified', 'rejected', 'in-progress', 'completed'],
    default: 'draft'
  },
  fields: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  // Additional metadata
  formTitle: {
    type: String,
    trim: true
  },
  formDescription: {
    type: String,
    trim: true
  },
  // Progress tracking
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // File uploads tracking
  uploadedFiles: [{
    fieldName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Staff assignment and verification
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Admin/Staff notes
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Version control
  version: {
    type: Number,
    default: 1
  },
  // Previous versions for history
  previousVersions: [{
    fields: mongoose.Schema.Types.Mixed,
    status: String,
    savedAt: Date,
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Submission details
  submittedAt: Date,
  completedAt: Date,
  // Last activity
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  lastActivityBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  collection: 'forms_data',
  timestamps: true
});

// Indexes for better query performance
formsDataSchema.index({ userId: 1 });
formsDataSchema.index({ serviceType: 1 });
formsDataSchema.index({ status: 1 });
formsDataSchema.index({ assignedTo: 1 });
formsDataSchema.index({ verifiedBy: 1 });
formsDataSchema.index({ approvedBy: 1 });
formsDataSchema.index({ createdAt: -1 });
formsDataSchema.index({ lastActivityAt: -1 });
formsDataSchema.index({ userId: 1, serviceType: 1 });
formsDataSchema.index({ assignedTo: 1, status: 1 });
formsDataSchema.index({ status: 1, serviceType: 1 });

// Pre-save middleware to update lastActivityAt
formsDataSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Virtual for form URL
formsDataSchema.virtual('formUrl').get(function() {
  return `/${this.serviceType}`;
});

// Method to update progress
formsDataSchema.methods.updateProgress = function(filledFields, totalFields) {
  this.progressPercentage = Math.round((filledFields / totalFields) * 100);
  if (this.progressPercentage > 0 && this.progressPercentage < 100) {
    this.status = 'in-progress';
  } else if (this.progressPercentage === 100) {
    this.status = 'completed';
  }
  return this.save();
};

// Method to save as draft
formsDataSchema.methods.saveAsDraft = function(fields, userId) {
  this.fields = fields;
  this.status = 'draft';
  this.lastActivityBy = userId;
  this.progressPercentage = 0;
  return this.save();
};

// Method to submit form
formsDataSchema.methods.submitForm = function(fields, userId) {
  // Save current version to history
  this.previousVersions.push({
    fields: this.fields,
    status: this.status,
    savedAt: new Date(),
    savedBy: this.lastActivityBy
  });
  
  this.fields = fields;
  this.status = 'completed';
  this.submittedAt = new Date();
  this.completedAt = new Date();
  this.lastActivityBy = userId;
  this.progressPercentage = 100;
  this.version += 1;
  return this.save();
};

// Static method to get forms by user
formsDataSchema.statics.getUserForms = function(userId, options = {}) {
  const query = { userId };
  if (options.serviceType) query.serviceType = options.serviceType;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ lastActivityAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get admin forms with filters
formsDataSchema.statics.getAdminForms = function(filters = {}) {
  const query = {};
  
  // Apply role-based filters first
  if (filters.roleFilters) {
    Object.assign(query, filters.roleFilters);
  }
  
  if (filters.serviceType) query.serviceType = filters.serviceType;
  if (filters.status) query.status = filters.status;
  if (filters.userId) query.userId = filters.userId;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.search) {
    query.$or = [
      { formTitle: { $regex: filters.search, $options: 'i' } },
      { formDescription: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .populate('userId', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('verifiedBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('lastActivityBy', 'name email role')
    .sort({ lastActivityAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.skip || 0);
};

// Static method to get staff assigned forms
formsDataSchema.statics.getStaffForms = function(staffId, filters = {}) {
  const query = {};
  
  // Apply role-based filters first
  if (filters.roleFilters) {
    Object.assign(query, filters.roleFilters);
  } else {
    // Default to assigned forms if no role filters
    query.assignedTo = staffId;
  }
  
  if (filters.serviceType) query.serviceType = filters.serviceType;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { formTitle: { $regex: filters.search, $options: 'i' } },
      { formDescription: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .populate('userId', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('verifiedBy', 'name email role')
    .populate('lastActivityBy', 'name email role')
    .sort({ lastActivityAt: -1 })
    .limit(filters.limit || 50)
    .skip(filters.skip || 0);
};

// Method to assign form to staff
formsDataSchema.methods.assignToStaff = function(staffId, assignedBy) {
  this.assignedTo = staffId;
  this.status = 'submitted';
  this.lastActivityBy = assignedBy;
  return this.save();
};

// Method to verify form by staff
formsDataSchema.methods.verifyByStaff = function(staffId, notes = '') {
  this.verifiedBy = staffId;
  this.verifiedAt = new Date();
  this.status = 'verified';
  this.lastActivityBy = staffId;
  
  if (notes) {
    this.adminNotes.push({
      note: `Verification: ${notes}`,
      addedBy: staffId,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to approve/reject form by admin
formsDataSchema.methods.approveByAdmin = function(adminId, approved = true, reason = '') {
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.status = approved ? 'completed' : 'rejected';
  this.lastActivityBy = adminId;
  
  if (!approved && reason) {
    this.rejectionReason = reason;
    this.adminNotes.push({
      note: `Rejection: ${reason}`,
      addedBy: adminId,
      addedAt: new Date()
    });
  } else if (approved) {
    this.adminNotes.push({
      note: 'Form approved and completed',
      addedBy: adminId,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

export default mongoose.model('FormsData', formsDataSchema);
