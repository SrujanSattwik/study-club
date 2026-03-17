const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../middleware/auth');

async function login(req, res, getConnection) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const conn = await getConnection();
    try {
      const result = await conn.execute(
        'SELECT user_id, full_name, email, password_hash, role FROM users WHERE email = :email',
        { email }
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.PASSWORD_HASH);

      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      await conn.execute(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = :userId',
        { userId: user.USER_ID },
        { autoCommit: true }
      );

      const logId = uuidv4();
      const ipAddress = req.ip || req.connection.remoteAddress;
      const deviceInfo = req.headers['user-agent'] || 'Unknown';

      await conn.execute(
        `INSERT INTO user_login_logs (log_id, user_id, ip_address, device_info)
         VALUES (:logId, :userId, :ipAddress, :deviceInfo)`,
        { logId, userId: user.USER_ID, ipAddress, deviceInfo },
        { autoCommit: true }
      );

      const token = generateToken(user.USER_ID, user.EMAIL);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          userId: user.USER_ID,
          fullName: user.FULL_NAME,
          email: user.EMAIL,
          role: user.ROLE
        }
      });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Logout successful' });
}

// ==========================================
// GET USER PROFILE
// ==========================================

async function getProfile(req, res, getConnection) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const conn = await getConnection();
    try {
      const result = await conn.execute(
        'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = :userId',
        { userId }
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        user: {
          userId: user.USER_ID,
          fullName: user.FULL_NAME,
          email: user.EMAIL,
          role: user.ROLE || 'User',
          createdAt: user.CREATED_AT
        }
      });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
}

// ==========================================
// CHANGE PASSWORD - SEND OTP
// ==========================================

async function sendChangePasswordOtp(req, res, getConnection, sendOTPEmail, otpStore) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const conn = await getConnection();
    try {
      // Get current password hash
      const result = await conn.execute(
        'SELECT password_hash FROM users WHERE user_id = :userId',
        { userId }
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = result.rows[0];

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.PASSWORD_HASH);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpKey = `pwd_change_${userId}`;
      
      otpStore.set(otpKey, {
        otp,
        newPassword,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0
      });

      // Send OTP email
      await sendOTPEmail(userEmail, otp, 'Password Change');

      res.json({ success: true, message: 'OTP sent to your email' });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

// ==========================================
// CHANGE PASSWORD - VERIFY OTP
// ==========================================

async function verifyChangePassword(req, res, getConnection, otpStore) {
  try {
    const { otp, newPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'OTP and new password required' });
    }

    const otpKey = `pwd_change_${userId}`;
    const storedOtp = otpStore.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(otpKey);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (storedOtp.attempts >= 3) {
      otpStore.delete(otpKey);
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Request a new OTP' });
    }

    if (storedOtp.otp !== otp) {
      storedOtp.attempts++;
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const conn = await getConnection();
    try {
      await conn.execute(
        'UPDATE users SET password_hash = :passwordHash WHERE user_id = :userId',
        { passwordHash: hashedPassword, userId },
        { autoCommit: true }
      );

      // Remove OTP from storage
      otpStore.delete(otpKey);

      res.json({ success: true, message: 'Password updated successfully' });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
}

// ==========================================
// DELETE ACCOUNT - SEND OTP
// ==========================================

async function sendDeleteOtp(req, res, getConnection, sendOTPEmail, otpStore) {
  try {
    const userId = req.userId;
    const userEmail = req.userEmail;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `delete_account_${userId}`;
    
    otpStore.set(otpKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });

    // Send OTP email with warning
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: userEmail,
      subject: 'Account Deletion Confirmation - StudyHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Account Deletion Request</h2>
          <p style="color: #6b7280; font-size: 16px;">
            You have requested to delete your StudyHub account. This action is <strong>permanent and cannot be undone</strong>.
          </p>
          <p style="color: #000; font-weight: bold;">Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #ef4444; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code will expire in 5 minutes.
          </p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #7f1d1d;"><strong>Warning:</strong> Deleting your account will:</p>
            <ul style="margin: 10px 0; color: #7f1d1d;">
              <li>Delete all your personal information</li>
              <li>Remove all study materials</li>
              <li>Cancel memberships and subscriptions</li>
              <li>Delete chat history and discussions</li>
              <li>Remove you from study groups</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email and do not share this code.</p>
        </div>
      `
    };

    await sendOTPEmail(userEmail, otp, 'Account Deletion', mailOptions);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send delete OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

// ==========================================
// DELETE ACCOUNT - VERIFY OTP
// ==========================================

async function deleteAccount(req, res, getConnection, otpStore) {
  try {
    const { otp } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP required' });
    }

    const otpKey = `delete_account_${userId}`;
    const storedOtp = otpStore.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(otpKey);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (storedOtp.attempts >= 3) {
      otpStore.delete(otpKey);
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Request a new OTP' });
    }

    if (storedOtp.otp !== otp) {
      storedOtp.attempts++;
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const conn = await getConnection();
    try {
      // Delete user-related data
      
      // Delete from user_login_logs
      await conn.execute(
        'DELETE FROM user_login_logs WHERE user_id = :userId',
        { userId },
        { autoCommit: true }
      );

      // Delete from user_activities (if exists)
      try {
        await conn.execute(
          'DELETE FROM user_activities WHERE user_id = :userId',
          { userId },
          { autoCommit: true }
        );
      } catch (e) {
        // Table might not exist, continue
      }

      // Delete from dashboard_stats (if exists)
      try {
        await conn.execute(
          'DELETE FROM dashboard_stats WHERE user_id = :userId',
          { userId },
          { autoCommit: true }
        );
      } catch (e) {
        // Table might not exist, continue
      }

      // Delete from study_groups_members (if exists)
      try {
        await conn.execute(
          'DELETE FROM study_groups_members WHERE user_id = :userId',
          { userId },
          { autoCommit: true }
        );
      } catch (e) {
        // Table might not exist, continue
      }

      // Delete from chat_messages (if exists)
      try {
        await conn.execute(
          'DELETE FROM chat_messages WHERE user_id = :userId',
          { userId },
          { autoCommit: true }
        );
      } catch (e) {
        // Table might not exist, continue
      }

      // Delete the user
      await conn.execute(
        'DELETE FROM users WHERE user_id = :userId',
        { userId },
        { autoCommit: true }
      );

      // Remove OTP from storage
      otpStore.delete(otpKey);

      res.json({ success: true, message: 'Account deleted successfully', logout: true });
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { 
  login, 
  logout,
  getProfile,
  sendChangePasswordOtp,
  verifyChangePassword,
  sendDeleteOtp,
  deleteAccount
};
