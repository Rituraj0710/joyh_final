import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRECT_KEY || process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-document-management-system-2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

/**
 * Enhanced Login endpoint with strict role validation
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
      // Log failed login attempt
      await AuditLog.logAction({
        userId: null,
        userRole: 'unknown',
        action: 'login',
        resource: 'user',
        details: `Failed login attempt - user not found: ${email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium',
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLog.logAction({
        userId: user._id,
        userRole: user.role,
        action: 'login',
        resource: 'user',
        resourceId: user._id,
        details: 'Failed login attempt - invalid password',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'medium',
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Validate user role - only allow specific roles
    const allowedRoles = ['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5'];
    if (!allowedRoles.includes(user.role)) {
      await AuditLog.logAction({
        userId: user._id,
        userRole: user.role,
        action: 'login',
        resource: 'user',
        resourceId: user._id,
        details: `Failed login attempt - invalid role: ${user.role}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'high',
        status: 'failure'
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user role.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token with role information
    const token = jwt.sign(
      { 
        id: user._id,
        userId: user._id, // Keep both for compatibility
        role: user.role,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Log successful login
    await AuditLog.logAction({
      userId: user._id,
      userRole: user.role,
      action: 'login',
      resource: 'user',
      resourceId: user._id,
      details: `Successful login - role: ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low',
      status: 'success'
    });

    // Return user data with role information
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          employeeId: user.employeeId,
          lastLogin: user.lastLogin,
          permissions: user.getPermissions ? user.getPermissions() : []
        }
      }
    });

  } catch (error) {
    logger.error('Enhanced login error:', error);
    
    // Log system error
    await AuditLog.logAction({
      userId: null,
      userRole: 'system',
      action: 'login',
      resource: 'user',
      details: `System error during login: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Login failed due to system error'
    });
  }
});

/**
 * Get user profile endpoint
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate user role
    const allowedRoles = ['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user role.'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        lastLogin: user.lastLogin,
        permissions: user.getPermissions ? user.getPermissions() : []
      }
    });

  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

/**
 * Logout endpoint
 */
router.post('/logout', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;

    if (userId) {
      // Log logout action
      await AuditLog.logAction({
        userId: userId,
        userRole: userRole,
        action: 'logout',
        resource: 'user',
        resourceId: userId,
        details: 'User logged out',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'low',
        status: 'success'
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * Validate token endpoint
 */
router.get('/validate', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Validate user role
    const allowedRoles = ['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user role.'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token validation failed'
    });
  }
});

export default router;
