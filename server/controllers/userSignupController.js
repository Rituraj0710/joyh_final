import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import sendSignupEmail from '../utils/sendSignupEmail.js';
import logger from '../config/logger.js';

class UserSignupController {
  /**
   * Create new user account
   */
  static signup = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          status: "failed",
          message: "Name, email, and password are required"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "failed",
          message: "Please provide a valid email address"
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          status: "failed",
          message: "Password must be at least 6 characters long"
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          status: "failed",
          message: "User with this email already exists"
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user1', // Default role for normal users
        is_verified: false, // Will be verified via email
        isActive: true
      });

      await newUser.save();

      // Generate email verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database
      await EmailVerification.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          email: email.toLowerCase(),
          otp: otp,
          otpExpiry: otpExpiry,
          userType: 'user',
          userId: newUser._id
        },
        { upsert: true, new: true }
      );

      // Send verification email
      try {
        await sendSignupEmail(email, otp, name);
        
        logger.info(`User signup successful: ${email}`, {
          userId: newUser._id,
          email: email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(201).json({
          status: "success",
          message: "User account created successfully. Please check your email for verification.",
          data: {
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name,
            isVerified: false
          }
        });

      } catch (emailError) {
        logger.error(`Failed to send verification email to ${email}:`, emailError);
        
        // Still return success but mention email issue
        res.status(201).json({
          status: "success",
          message: "User account created successfully. Please contact support if you don't receive verification email.",
          data: {
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name,
            isVerified: false
          }
        });
      }

    } catch (error) {
      logger.error('User signup error:', error);
      res.status(500).json({
        status: "failed",
        message: "Unable to create user account, please try again later"
      });
    }
  };

  /**
   * Verify user email with OTP
   */
  static verifyEmail = async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          status: "failed",
          message: "Email and OTP are required"
        });
      }

      // Find verification record
      const verification = await EmailVerification.findOne({
        email: email.toLowerCase(),
        userType: 'user'
      });

      if (!verification) {
        return res.status(404).json({
          status: "failed",
          message: "No verification request found for this email"
        });
      }

      // Check if OTP is expired
      if (verification.otpExpiry < new Date()) {
        return res.status(400).json({
          status: "failed",
          message: "OTP has expired. Please request a new one."
        });
      }

      // Verify OTP
      if (verification.otp !== otp) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid OTP. Please check and try again."
        });
      }

      // Update user verification status
      await User.findByIdAndUpdate(verification.userId, {
        is_verified: true
      });

      // Remove verification record
      await EmailVerification.findByIdAndDelete(verification._id);

      logger.info(`User email verified: ${email}`, {
        userId: verification.userId,
        email: email,
        ip: req.ip
      });

      res.status(200).json({
        status: "success",
        message: "Email verified successfully. You can now login."
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        status: "failed",
        message: "Unable to verify email, please try again later"
      });
    }
  };

  /**
   * Resend verification OTP
   */
  static resendOTP = async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "failed",
          message: "Email is required"
        });
      }

      // Check if user exists and is not verified
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        is_verified: false 
      });

      if (!user) {
        return res.status(404).json({
          status: "failed",
          message: "User not found or already verified"
        });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update verification record
      await EmailVerification.findOneAndUpdate(
        { email: email.toLowerCase(), userType: 'user' },
        {
          email: email.toLowerCase(),
          otp: otp,
          otpExpiry: otpExpiry,
          userType: 'user',
          userId: user._id
        },
        { upsert: true, new: true }
      );

      // Send verification email
      try {
        await sendSignupEmail(email, otp, user.name);
        
        res.status(200).json({
          status: "success",
          message: "Verification OTP sent successfully"
        });

      } catch (emailError) {
        logger.error(`Failed to resend verification email to ${email}:`, emailError);
        
        res.status(500).json({
          status: "failed",
          message: "Unable to send verification email, please try again later"
        });
      }

    } catch (error) {
      logger.error('Resend OTP error:', error);
      res.status(500).json({
        status: "failed",
        message: "Unable to resend OTP, please try again later"
      });
    }
  };
}

export default UserSignupController;
