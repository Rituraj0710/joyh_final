import mongoose from 'mongoose';

const purchaserSchema = new mongoose.Schema({
  title: { type: String, enum: ['श्री', 'श्रीमती', 'सुश्री'], default: 'श्री' },
  name: { type: String, required: true, trim: true },
  rel: { type: String, enum: ['पुत्र', 'पत्नी', 'पुत्री', 'पुत्र/पुत्री', 'पत्नी/पति', 'अन्य'], default: 'पुत्र' },
  father_name: { type: String, required: true, trim: true },
  addr: { type: String, required: true, trim: true },
  idtype: { type: String, enum: ['आधार', 'पैन', 'पासपोर्ट', 'ड्राइविंग लाइसेंस'], default: 'आधार' },
  idno: { type: String, required: true, trim: true },
  occ: { type: String, trim: true },
  pan: { type: String, trim: true },
  mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
  email: { type: String, trim: true, lowercase: true },
  photo: { type: String } // Path to uploaded photo
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  mode: { type: String, required: true, trim: true },
  ref: { type: String, trim: true },
  date: { type: Date, required: true },
  bank: { type: String, trim: true }
}, { _id: false });

const witnessSchema = new mongoose.Schema({
  title: { type: String, enum: ['श्री', 'श्रीमती', 'सुश्री'], default: 'श्री' },
  name: { type: String, required: true, trim: true },
  rel: { type: String, enum: ['पुत्र', 'पत्नी', 'पुत्री', 'पुत्र/पुत्री', 'पत्नी/पति', 'अन्य'], default: 'पुत्र' },
  father_name: { type: String, required: true, trim: true },
  addr: { type: String, required: true, trim: true },
  idtype: { type: String, enum: ['आधार', 'पासपोर्ट', 'ड्राइविंग लाइसेंस'], default: 'आधार' },
  idno: { type: String, required: true, trim: true },
  occ: { type: String, trim: true },
  mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
  photo: { type: String } // Path to uploaded photo
}, { _id: false });

const floorSchema = new mongoose.Schema({
  floor_number: { type: Number, required: true, min: 0 },
  area: { type: Number, required: true, min: 0 },
  usage: { type: String, trim: true }
}, { _id: false });

const propertySaleCertificateSchema = new mongoose.Schema({
  // Bank/Secured Creditor Information
  bank: {
    select: { type: String, required: true, trim: true },
    other: { type: String, trim: true },
    reg_off: { type: String, required: true, trim: true },
    head_off: { type: String, required: true, trim: true },
    pan: { type: String, trim: true },
    post: { type: String, trim: true }
  },

  // Bank Representative Information
  bank_representative: {
    title: { type: String, required: true, enum: ['श्री', 'श्रीमती', 'सुश्री'], default: 'श्री' },
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, enum: ['पुत्र', 'पत्नी', 'पुत्री', 'पुत्र/पुत्री', 'पत्नी/पति', 'अन्य'], default: 'पुत्र' },
    father_name: { type: String, required: true, trim: true },
    occupation: { type: String, trim: true },
    mobile: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true }
  },

  // Acknowledgment Receipt
  acknowledgment: {
    amount: { type: Number, required: true, min: 0 },
    amount_words: { type: String, trim: true }
  },

  // Property Information
  property: {
    previous_owner: { type: String, required: true, trim: true },
    acquisition_mode: { type: String, required: true, trim: true },
    bank_power: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Residential', 'Commercial', 'Industrial', 'Agriculture'] },
    subtype: { type: String, required: true, trim: true },
    construction_type: { type: String, trim: true },
    state: { type: String, default: 'Uttar Pradesh', trim: true },
    tehsil: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    khasra: { type: String, trim: true },
    plot: { type: String, trim: true },
    flat_floor: { type: String, trim: true },
    covered_area: { type: Number, min: 0 },
    super_area: { type: Number, min: 0 },
    plot_area: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['sqft', 'sqyd', 'sqm'], default: 'sqm' },
      sqm: { type: Number, min: 0 }
    },
    road_size: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['sqft', 'sqyd', 'sqm'], default: 'sqm' },
      meters: { type: Number, min: 0 }
    },
    features: {
      road_double: { type: Boolean, default: false },
      park_facing: { type: Boolean, default: false },
      corner_plot: { type: Boolean, default: false }
    },
    address: { type: String, required: true, trim: true }
  },

  // Parties
  purchasers: { 
    type: [purchaserSchema], 
    required: true, 
    validate: [v => v.length >= 1, "At least one purchaser is required"] 
  },
  witnesses: { 
    type: [witnessSchema], 
    default: [] 
  },
  payments: { 
    type: [paymentSchema], 
    default: [] 
  },
  floors: { 
    type: [floorSchema], 
    default: [] 
  },

  // Metadata
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected'], 
    default: 'draft' 
  },
  amount: { 
    type: Number, 
    default: 2000 
  } // Base amount for property sale certificate
}, { 
  collection: 'property_sale_certificates',
  timestamps: true 
});

// Indexes for better query performance
propertySaleCertificateSchema.index({ 'bank_representative.mobile': 1 });
propertySaleCertificateSchema.index({ 'property.address': 1 });
propertySaleCertificateSchema.index({ 'property.category': 1 });
propertySaleCertificateSchema.index({ createdBy: 1 });
propertySaleCertificateSchema.index({ status: 1 });
propertySaleCertificateSchema.index({ createdAt: -1 });

// Virtual for purchaser count
propertySaleCertificateSchema.virtual('purchaserCount').get(function() {
  return this.purchasers ? this.purchasers.length : 0;
});

// Virtual for witness count
propertySaleCertificateSchema.virtual('witnessCount').get(function() {
  return this.witnesses ? this.witnesses.length : 0;
});

// Ensure virtual fields are serialized
propertySaleCertificateSchema.set('toJSON', { virtuals: true });
propertySaleCertificateSchema.set('toObject', { virtuals: true });

const PropertySaleCertificate = mongoose.model('PropertySaleCertificate', propertySaleCertificateSchema);

export default PropertySaleCertificate;