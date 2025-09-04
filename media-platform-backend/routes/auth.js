const express = require('express');
const { 
  signUp, 
  verifySignUpOTP, 
  login, 
  forgotPassword, 
  resetPassword, 
  resendOTP 
} = require('../controllers/authController');
const router = express.Router();

/**
 * @route   POST /api/auth/sign-up
 * @desc    Start registration (send OTP)
 * @access  Public
 */
router.post('/sign-up', signUp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 */
router.post('/verify-otp', verifySignUpOTP);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for verification
 * @access  Public
 */
router.post('/resend-otp', resendOTP);

module.exports = router;