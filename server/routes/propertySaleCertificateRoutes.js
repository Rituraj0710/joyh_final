import express from "express";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import accessTokenAutoRefresh from "../middlewares/accessTokenAutoRefresh.js";
import setAuthHeader from "../middlewares/setAuthHeader.js";
import PropertySaleCertificateController from "../controllers/propertySaleCertificateController.js";

const router = express.Router();

// Create upload directory for property sale certificates
const uploadRoot = path.join(process.cwd(), "uploads", "property-sale-certificates");
fs.mkdirSync(uploadRoot, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadRoot);
  },
  filename: function(req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${ts}_${safe}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Define upload fields for property sale certificate
const uploadFields = [
  { name: "bank_rep_photo", maxCount: 1 },
  { name: "prop_photo", maxCount: 1 },
  { name: "purchaser_photo_1", maxCount: 1 },
  { name: "purchaser_photo_2", maxCount: 1 },
  { name: "purchaser_photo_3", maxCount: 1 },
  { name: "purchaser_photo_4", maxCount: 1 },
  { name: "purchaser_photo_5", maxCount: 1 },
  { name: "witness_photo_1", maxCount: 1 },
  { name: "witness_photo_2", maxCount: 1 },
  { name: "witness_photo_3", maxCount: 1 },
  { name: "witness_photo_4", maxCount: 1 },
  { name: "witness_photo_5", maxCount: 1 },
  { name: "property_documents", maxCount: 10 }
];

// Apply optional authentication middleware to all routes
router.use((req, res, next) => {
  passport.authenticate('userOrAgent', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
});
router.use(accessTokenAutoRefresh);
router.use(setAuthHeader);

// Routes
router.post("/", upload.fields(uploadFields), PropertySaleCertificateController.create);
router.get("/", PropertySaleCertificateController.getAll);
router.get("/stats", PropertySaleCertificateController.getStats);
router.get("/:id", PropertySaleCertificateController.getById);
router.put("/:id/status", PropertySaleCertificateController.updateStatus);
router.delete("/:id", PropertySaleCertificateController.delete);

export default router;