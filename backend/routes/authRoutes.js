const express = require('express');
const router = express.Router();
const { 
  login, 
  logout,
  getProfile,
  sendChangePasswordOtp,
  verifyChangePassword,
  sendDeleteOtp,
  deleteAccount
} = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const getConnection = require('../db/oracle');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp, subject = 'Email Verification', mailOptions = null) {
  if (mailOptions) {
    // Use custom mail options
    return await transporter.sendMail(mailOptions);
  }

  const defaultMailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: `StudyHub - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">StudyHub</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(defaultMailOptions);
}

// In-memory OTP storage
const otpStore = new Map();

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.post('/login', (req, res) => login(req, res, getConnection));
router.post('/logout', logout);

// ==========================================
// PROTECTED ROUTES
// ==========================================

// Get user profile
router.get('/me', authenticateUser, (req, res) => {
  getProfile(req, res, getConnection);
});

// Send OTP for password change
router.post('/send-change-password-otp', authenticateUser, (req, res) => {
  sendChangePasswordOtp(req, res, getConnection, sendOTPEmail, otpStore);
});

// Verify OTP and change password
router.post('/verify-change-password', authenticateUser, (req, res) => {
  verifyChangePassword(req, res, getConnection, otpStore);
});

// Send OTP for account deletion
router.post('/send-delete-otp', authenticateUser, (req, res) => {
  sendDeleteOtp(req, res, getConnection, sendOTPEmail, otpStore);
});

// Delete account with OTP verification
router.post('/delete-account', authenticateUser, (req, res) => {
  deleteAccount(req, res, getConnection, otpStore);
});

module.exports = router;
