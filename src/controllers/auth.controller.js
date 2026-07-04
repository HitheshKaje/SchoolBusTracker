const crypto = require('crypto');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');
const { sendSMS } = require('../services/sms.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Institution = require('../models/Institution');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (role !== 'Admin') {
      return sendError(res, 403, 'Self-registration is only allowed for Organization Administrators.');
    }

    // Check if user exists
    let user = await User.findOne({ mobile });
    if (user) {
      return sendError(res, 400, 'User already exists with this mobile number');
    }

    let institutionId = null;
    if (role === 'Admin') {
      const { orgName, orgDisplayName, orgAddress, orgLat, orgLon, orgOsmId } = req.body;
      const Institution = require('../models/Institution');
      const newInst = await Institution.create({
        name: orgName || (name + "'s Institution"),
        displayName: orgDisplayName,
        address: orgAddress,
        latitude: orgLat,
        longitude: orgLon,
        osmId: orgOsmId,
        contactEmail: email,
        contactPhone: mobile
      });
      institutionId = newInst._id;
    }

    user = await User.create({
      name,
      email: email || undefined,
      mobile,
      password,
      role,
      institution: institutionId
    });

    sendSuccess(res, 201, 'Account created successfully. Please sign in.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { mobile, password, loginType } = req.body;

    if (!mobile || !password) {
      return sendError(res, 400, 'Please provide mobile and password');
    }

    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const type = loginType || 'user';

    if (type === 'org' && user.role !== 'Admin') {
      return sendError(res, 403, 'This account is not an Organization Administrator. Please use the Parent/Driver Login.');
    }

    if (type === 'user' && user.role === 'Admin') {
      return sendError(res, 403, 'Organization Administrators must use the Organization Login.');
    }

    const token = generateToken(user._id);

    // Front-end will redirect based on user.role
    sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie (if used)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  // Assuming frontend deletes token. If HTTP-only cookies were used, clear them here.
  sendSuccess(res, 200, 'Logout successful, please delete token on client');
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('institution');
    sendSuccess(res, 200, 'User data fetched successfully', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password / Generate OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile });

    if (!user) {
      return sendError(res, 404, 'No user found with that mobile number');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving to DB
    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpires = Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    // Send SMS (Mocked)
    const message = `Your OTP for password reset is ${otp}. It is valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`;
    await sendSMS(user.mobile, message);

    sendSuccess(res, 200, 'OTP sent to registered mobile number');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ 
      mobile, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user || !user.otp) {
      return sendError(res, 400, 'Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return sendError(res, 400, 'Invalid OTP');
    }

    // OTP is valid. Generate a secure reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 mins to reset password
    
    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, 'OTP verified successfully', { resetToken });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Hash token to compare with DB
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetToken: resetPasswordToken,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    
    await user.save();

    // Optionally generate and send a new JWT token so user is automatically logged in
    const token = generateToken(user._id);

    sendSuccess(res, 200, 'Password reset successful', { token });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete current user account
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    if (user.role !== 'Admin') {
      return sendError(res, 403, 'Only Admins can delete their account here');
    }
    
    // Optionally delete the associated institution
    if (user.institution) {
      const Institution = require('../models/Institution');
      await Institution.findByIdAndDelete(user.institution);
    }
    
    await User.findByIdAndDelete(req.user.id);
    
    sendSuccess(res, 200, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
