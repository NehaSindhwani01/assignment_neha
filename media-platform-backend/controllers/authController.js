const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService'); 
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Send OTP for registration or existing unverified user
exports.signUp = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await AdminUser.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login.'
      });
    }

    let user = existingUser;
    if (!user) {
      // Create new unverified user (password will be hashed automatically)
      user = new AdminUser({ email, hashed_password: password });
    } else {
      // Update password if user exists but unverified (password will be hashed automatically)
      user.hashed_password = password;
    }

    // Generate OTP
    const otpCode = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.json({
      success: true,
      message: 'OTP sent to your email. Verify to complete registration.',
      data: { email }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during signup.',
      error: error.message
    });
  }
};

// Verify OTP and complete registration
exports.verifySignUpOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('OTP Verification Request:');
    console.log('Email:', email);
    console.log('OTP:', otp);

    const user = await AdminUser.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'User not found. Please signup first.'
      });
    }

    console.log('Found user:', user.email);
    console.log('User OTP data:', user.otp);

    if (!user.verifyOTP(otp)) {
      console.log('OTP verification failed for user:', user.email);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.'
      });
    }

    console.log('OTP verified successfully for user:', user.email);

    // Mark verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateAuthToken(user._id);

    res.json({
      success: true,
      message: 'Registration completed successfully.',
      data: {
        user: { id: user._id, email: user.email, created_at: user.created_at },
        token
      }
    });

  } catch (error) {
    console.error('Error in verifySignUpOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP.',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await AdminUser.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/password or user not verified.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateAuthToken(user._id);
    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { id: user._id, email: user.email, created_at: user.created_at },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login.',
      error: error.message
    });
  }
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await AdminUser.findOne({ email, isVerified: true });
    if (!user) return res.status(404).json({ success: false, message: 'No verified user found.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({ success: true, message: 'OTP sent! Check your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};
// 2. Reset Password - verify OTP and change password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await AdminUser.findOne({ email, isVerified: true });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user.' 
      });
    }

    // Verify OTP
    if (!user.verifyResetOTP(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP.' 
      });
    }

    // Set new password (pre-save hook will hash it automatically)
    user.hashed_password = newPassword;

    // Clear OTP
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.json({ 
      success: true, 
      message: 'Password reset successful!' 
    });

  } catch (err) {
    console.error('Error in resetPassword:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password.',
      error: err.message 
    });
  }
};
// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Resend OTP request for:', email);

    const user = await AdminUser.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified.'
      });
    }

    // Generate new OTP
    const otpCode = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.json({
      success: true,
      message: 'OTP resent successfully. Check your email.',
      data: { email }
    });

  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP.',
      error: error.message
    });
  }
};