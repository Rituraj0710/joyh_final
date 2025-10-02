import * as yup from 'yup';

// Login Schema
export const loginSchema = yup.object({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

// Register Schema
export const registerSchema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup.string()
    .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .nullable(),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  password_confirmation: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

// Agent Register Schema
export const agentRegisterSchema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup.string()
    .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone number is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  licenseNumber: yup.string()
    .required('License number is required'),
  experience: yup.number()
    .min(0, 'Experience must be a positive number')
    .required('Experience is required')
});

// Change Password Schema
export const changePasswordSchema = yup.object({
  currentPassword: yup.string()
    .required('Current password is required'),
  newPassword: yup.string()
    .min(6, 'New password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required')
});

// Reset Password Link Schema
export const resetPasswordLinkSchema = yup.object({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required')
});

// Reset Password Schema
export const resetPasswordSchema = yup.object({
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

// Verify Email Schema
export const verifyEmailSchema = yup.object({
  otp: yup.string()
    .matches(/^[0-9]{6}$/, 'OTP must be exactly 6 digits')
    .required('OTP is required')
});

// Contact Us Schema
export const contactUsSchema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup.string()
    .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone number is required'),
  subject: yup.string()
    .min(5, 'Subject must be at least 5 characters')
    .required('Subject is required'),
  message: yup.string()
    .min(10, 'Message must be at least 10 characters')
    .required('Message is required')
});

// Form Validation Schemas for Document Forms
export const willDeedSchema = yup.object({
  testator: yup.object({
    name: yup.string().required('Testator name is required'),
    fatherName: yup.string().required('Father name is required'),
    address: yup.string().required('Address is required'),
    mobile: yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
      .required('Mobile is required'),
    aadhaar: yup.string()
      .matches(/^[0-9]{12}$/, 'Aadhaar must be exactly 12 digits')
      .required('Aadhaar is required')
  }).required('Testator information is required'),
  beneficiaries: yup.array()
    .of(yup.object({
      name: yup.string().required('Beneficiary name is required'),
      relationship: yup.string().required('Relationship is required'),
      share: yup.string().required('Share is required')
    }))
    .min(1, 'At least one beneficiary is required'),
  witnesses: yup.array()
    .of(yup.object({
      name: yup.string().required('Witness name is required'),
      address: yup.string().required('Witness address is required'),
      mobile: yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
        .required('Witness mobile is required')
    }))
    .min(2, 'At least two witnesses are required')
});

export const saleDeedSchema = yup.object({
  documentType: yup.string().required('Document type is required'),
  propertyType: yup.string().required('Property type is required'),
  salePrice: yup.number()
    .min(0, 'Sale price must be positive')
    .required('Sale price is required'),
  state: yup.string().required('State is required'),
  district: yup.string().required('District is required'),
  tehsil: yup.string().required('Tehsil is required'),
  village: yup.string().required('Village is required')
});

export const trustDeedSchema = yup.object({
  trustName: yup.string().required('Trust name is required'),
  trustAddress: yup.string().required('Trust address is required'),
  startingAmount: yup.object({
    number: yup.string().required('Starting amount is required'),
    words: yup.string().required('Amount in words is required')
  }).required('Starting amount information is required'),
  trustees: yup.array()
    .of(yup.object({
      name: yup.string().required('Trustee name is required'),
      address: yup.string().required('Trustee address is required'),
      mobile: yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
        .required('Trustee mobile is required')
    }))
    .min(1, 'At least one trustee is required')
});

export const propertyRegistrationSchema = yup.object({
  seller_name: yup.string().required('Seller name is required'),
  seller_father_name: yup.string().required('Seller father name is required'),
  seller_address: yup.string().required('Seller address is required'),
  seller_aadhaar: yup.string()
    .matches(/^[0-9]{12}$/, 'Aadhaar must be exactly 12 digits')
    .required('Seller Aadhaar is required'),
  seller_mobile: yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
    .required('Seller mobile is required'),
  buyer_name: yup.string().required('Buyer name is required'),
  buyer_father_name: yup.string().required('Buyer father name is required'),
  buyer_address: yup.string().required('Buyer address is required'),
  buyer_aadhaar: yup.string()
    .matches(/^[0-9]{12}$/, 'Aadhaar must be exactly 12 digits')
    .required('Buyer Aadhaar is required'),
  buyer_mobile: yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
    .required('Buyer mobile is required'),
  property_address: yup.string().required('Property address is required'),
  property_type: yup.string().required('Property type is required'),
  area_sqm: yup.string().required('Area is required'),
  sale_price: yup.string().required('Sale price is required'),
  registration_date: yup.date().required('Registration date is required')
});

export const adoptionDeedSchema = yup.object({
  childName: yup.string().required('Child name is required'),
  childDOB: yup.date().required('Child date of birth is required'),
  childGender: yup.string().required('Child gender is required'),
  state: yup.string().required('State is required'),
  district: yup.string().required('District is required'),
  tehsil: yup.string().required('Tehsil is required'),
  firstParties: yup.array()
    .of(yup.object({
      name: yup.string().required('Adopting party name is required'),
      mobile: yup.string()
        .matches(/^[6-9]\d{9}$/, 'Invalid mobile number')
        .required('Mobile is required'),
      address: yup.string().required('Address is required')
    }))
    .min(1, 'At least one adopting party is required'),
  witnesses: yup.array()
    .of(yup.object({
      name: yup.string().required('Witness name is required'),
      mobile: yup.string()
        .matches(/^[6-9]\d{9}$/, 'Invalid mobile number')
        .required('Witness mobile is required'),
      address: yup.string().required('Witness address is required')
    }))
    .min(1, 'At least one witness is required')
});

export const powerOfAttorneySchema = yup.object({
  executionDate: yup.date().required('Execution date is required'),
  state: yup.string().required('State is required'),
  district: yup.string().required('District is required'),
  tehsil: yup.string().required('Tehsil is required'),
  subRegistrarOffice: yup.string().required('Sub Registrar office is required'),
  kartaParties: yup.array()
    .of(yup.object({
      name: yup.string().required('Karta name is required'),
      fatherName: yup.string().required('Father name is required'),
      address: yup.string().required('Address is required'),
      mobile: yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
        .required('Mobile is required')
    }))
    .min(1, 'At least one karta party is required'),
  agentParties: yup.array()
    .of(yup.object({
      name: yup.string().required('Agent name is required'),
      fatherName: yup.string().required('Father name is required'),
      address: yup.string().required('Address is required'),
      mobile: yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits')
        .required('Mobile is required')
    }))
    .min(1, 'At least one agent party is required')
});
