// import mongoose from "mongoose";

// const fileSchema = new mongoose.Schema({
//   field: {type: String, required: true},
//   path: {type: String, required: true},
//   originalName: {type: String},
//   mimeType: {type: String},
//   size: {type: Number},
// }, { _id: false });

// const willDeedSchema = new mongoose.Schema({
//   meta: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
//   testator: { type: mongoose.Schema.Types.Mixed, required: false, default: {} },
//   beneficiaries: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   executors: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   witnesses: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   immovables: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   movables: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   rules: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   conditions: { type: mongoose.Schema.Types.Mixed, required: false, default: [] },
//   files: { type: [fileSchema], default: [] },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
//   created_at: { type: Date, default: Date.now },
// }, { collection: 'will_deeds' });

// const WillDeedModel = mongoose.model("WillDeed", willDeedSchema);

// export default WillDeedModel;


// models/WillDeed.js
import mongoose from "mongoose";

const personSchema = new mongoose.Schema({
  prefix: {
    type: String,
    enum: ['श्री', 'श्रीमती', 'कुमारी', 'अन्य'],
    default: 'श्री'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fh: {
    type: String, // Father/Husband name
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  idType: {
    type: String,
    enum: ['आधार कार्ड', 'पैन कार्ड', 'वोटर आईडी', 'पासपोर्ट', 'ड्राइविंग लाइसेंस', 'अन्य'],
    default: 'आधार कार्ड'
  },
  idNo: {
    type: String,
    trim: true
  },
  idUploadPath: String,
  photoPath: String
}, { _id: false });

const immovablePropertySchema = new mongoose.Schema({
  subtype: {
    type: String,
    enum: ['कृषि भूमि', 'Residential', 'Commercial', 'Industrial', 'अन्य'],
    default: 'कृषि भूमि'
  },
  title: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  acquisition: {
    type: String,
    enum: ['स्व-अर्जित', 'Sale Deed', 'Gift Deed', 'विरासत', 'बटवारा', 'अन्य'],
    default: 'स्व-अर्जित'
  },
  book: String,
  volume: String,
  doc: String,
  page: String,
  regDate: Date,
  sr: String, // Sub-Registrar office details
  assignedTo: String // Beneficiary name
}, { _id: false });

const movablePropertySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Car', 'Bike', 'Gold/Jewellery', 'Bank Account', 'अन्य'],
    default: 'Car'
  },
  title: {
    type: String,
    trim: true
  },
  reg: String, // Registration/Bill No
  date: Date,
  auth: String, // Authority/Shop details
  engine: String,
  chasis: String,
  qty: String, // Quantity/Weight
  amt: String, // Amount
  assignedTo: String // Beneficiary name
}, { _id: false });

const willDeedSchema = new mongoose.Schema({
  // Metadata
  meta: {
    draftBy: {
      type: String,
      enum: ['Jyoh Services Pvt. Ltd.', 'Self', 'Other Advocate'],
      default: 'Jyoh Services Pvt. Ltd.'
    },
    propertyType: {
      type: String,
      enum: ['immovable', 'movable', 'both'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft'
    }
  },

  // Testator (Will maker)
  testator: {
    type: personSchema,
    required: true
  },

  // Beneficiaries
  beneficiaries: [personSchema],

  // Executors
  executors: [personSchema],

  // Witnesses (minimum 2 required)
  witnesses: {
    type: [personSchema],
    validate: [
      {
        validator: function (witnesses) {
          return witnesses.length >= 2;
        },
        message: 'At least 2 witnesses are required'
      }
    ]
  },

  // Properties
  immovables: [immovablePropertySchema],
  movables: [movablePropertySchema],

  // Rules and Conditions
  rules: [{
    type: String,
    trim: true
  }],

  conditions: [{
    type: String,
    trim: true
  }],

  // File uploads tracking
  uploads: {
    testatorId: String,
    testatorPhoto: String,
    personIds: [String],
    personPhotos: [String]
  },

  // User who created this will deed
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Agent assigned (if any)
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

// Indexes for better query performance
willDeedSchema.index({ 'testator.name': 1 });
willDeedSchema.index({ 'meta.status': 1 });
willDeedSchema.index({ createdBy: 1 });
willDeedSchema.index({ assignedAgent: 1 });

// Virtual for full testator name
willDeedSchema.virtual('testator.fullName').get(function () {
  if (this.testator && this.testator.prefix && this.testator.name) {
    const cleanName = this.testator.name.replace(/^(श्री|श्रीमती|कुमारी|अन्य)\s+/, '').trim();
    return `${this.testator.prefix} ${cleanName}`.trim();
  }
  return this.testator?.name || '';
});

// Pre-save middleware to ensure data consistency
willDeedSchema.pre('save', function (next) {
  // Ensure at least one beneficiary
  if (!this.beneficiaries || this.beneficiaries.length === 0) {
    return next(new Error('At least one beneficiary is required'));
  }

  // Ensure at least one executor
  if (!this.executors || this.executors.length === 0) {
    return next(new Error('At least one executor is required'));
  }

  // Validate property assignments
  const beneficiaryNames = this.beneficiaries.map(b =>
    `${b.prefix} ${b.name.replace(/^(श्री|श्रीमती|कुमारी|अन्य)\s+/, '').trim()}`.trim()
  );

  // Check immovable property assignments
  for (let prop of this.immovables || []) {
    if (prop.assignedTo && !beneficiaryNames.some(name => prop.assignedTo.includes(name) || name.includes(prop.assignedTo))) {
      return next(new Error(`Invalid beneficiary assignment for immovable property: ${prop.assignedTo}`));
    }
  }

  // Check movable property assignments
  for (let prop of this.movables || []) {
    if (prop.assignedTo && !beneficiaryNames.some(name => prop.assignedTo.includes(name) || name.includes(prop.assignedTo))) {
      return next(new Error(`Invalid beneficiary assignment for movable property: ${prop.assignedTo}`));
    }
  }

  next();
});

const WillDeed = mongoose.model("WillDeed", willDeedSchema);

export default WillDeed;