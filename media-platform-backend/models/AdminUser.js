const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hashed_password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetPasswordOTP: String,        
  resetPasswordOTPExpires: Date,  
  created_at: {
    type: Date,
    default: Date.now
  }
});

adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('hashed_password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.hashed_password = await bcrypt.hash(this.hashed_password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminUserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.hashed_password);
};

// Generate OTP method (FIXED)
adminUserSchema.methods.generateOTP = function() {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  
  this.otp = {
    code: otpCode,
    expiresAt: expiresAt
  };
  
  return otpCode;
};

// Verify OTP method (Handle both string and number inputs)
adminUserSchema.methods.verifyOTP = function(otpCode) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  const now = new Date();
  
  // Convert both to string for comparison to handle number inputs
  const storedOTP = String(this.otp.code);
  const providedOTP = String(otpCode);
  
  const isCodeValid = storedOTP === providedOTP;
  const isNotExpired = now < this.otp.expiresAt;
  
  console.log('OTP Verification Debug:');
  console.log('Stored OTP:', storedOTP, '(type:', typeof storedOTP + ')');
  console.log('Provided OTP:', providedOTP, '(type:', typeof providedOTP + ')');
  console.log('OTP Expires:', this.otp.expiresAt);
  console.log('Current Time:', now);
  console.log('Code Valid:', isCodeValid);
  console.log('Not Expired:', isNotExpired);
  
  return isCodeValid && isNotExpired;
};

// Generate password reset token
adminUserSchema.methods.generatePasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry
  return resetToken;
};

adminUserSchema.methods.verifyResetOTP = function(otpCode) {
  if (!this.resetPasswordOTP || !this.resetPasswordOTPExpires) {
    return false;
  }
  
  const now = new Date();
  
  // Convert both to string for comparison
  const storedOTP = String(this.resetPasswordOTP);
  const providedOTP = String(otpCode);
  
  const isCodeValid = storedOTP === providedOTP;
  const isNotExpired = now < this.resetPasswordOTPExpires;
  
  console.log('Reset OTP Verification Debug:');
  console.log('Stored Reset OTP:', storedOTP);
  console.log('Provided Reset OTP:', providedOTP);
  console.log('Reset OTP Expires:', this.resetPasswordOTPExpires);
  console.log('Current Time:', now);
  console.log('Code Valid:', isCodeValid);
  console.log('Not Expired:', isNotExpired);
  
  return isCodeValid && isNotExpired;
};

module.exports = mongoose.model('AdminUser', adminUserSchema);