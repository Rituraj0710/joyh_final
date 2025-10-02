import express from 'express';
import passport from 'passport';
import FormsDataController from '../controllers/formsDataController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import setAuthHeader from '../middlewares/setAuthHeader.js';
import { authorize } from '../middlewares/rbac.js';
import { 
  canAccessFormsData, 
  canViewForm, 
  canEditForm, 
  canVerifyForm, 
  canApproveForm, 
  canAssignForm, 
  filterFormsByRole,
  canLockForm 
} from '../middlewares/formsRbac.js';
import { authLimiter } from '../config/rateLimits.js';

const router = express.Router();

// All routes require authentication and forms access
router.use(setAuthHeader, accessTokenAutoRefresh, passport.authenticate('userOrStaff', { session: false }), canAccessFormsData);

// User/Agent routes - can save and submit their own forms
router.post('/save', 
  authLimiter,
  FormsDataController.saveForm
);

router.post('/submit', 
  authLimiter,
  FormsDataController.submitForm
);

router.get('/user-forms', 
  FormsDataController.getUserForms
);

router.get('/stats', 
  FormsDataController.getFormStats
);

router.get('/:id', 
  FormsDataController.getFormById
);

// Admin/Staff routes - full CRUD access with role-based filtering
router.get('/admin/forms', 
  authorize(['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5']),
  filterFormsByRole,
  FormsDataController.getAdminForms
);

router.get('/:id', 
  canViewForm,
  FormsDataController.getFormById
);

router.put('/admin/forms/:id', 
  authorize(['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5']),
  canViewForm,
  canEditForm,
  authLimiter,
  FormsDataController.updateForm
);

router.delete('/admin/forms/:id', 
  authorize(['admin']),
  canViewForm,
  FormsDataController.deleteForm
);

// Staff assignment and verification routes
router.post('/admin/forms/:id/assign', 
  authorize(['admin']),
  canAssignForm,
  authLimiter,
  FormsDataController.assignFormToStaff
);

router.post('/forms/:id/verify', 
  authorize(['staff1', 'staff2', 'staff3', 'staff4', 'staff5']),
  canViewForm,
  canVerifyForm,
  authLimiter,
  FormsDataController.verifyForm
);

router.post('/admin/forms/:id/approve', 
  authorize(['admin']),
  canViewForm,
  canApproveForm,
  authLimiter,
  FormsDataController.approveForm
);

// Staff routes - get assigned forms with role-based filtering
router.get('/staff/forms', 
  authorize(['staff1', 'staff2', 'staff3', 'staff4', 'staff5']),
  filterFormsByRole,
  FormsDataController.getStaffForms
);

export default router;
