const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const axios      = require('axios');
const path       = require('path');
const { PassThrough } = require('stream');
require('dotenv').config();
const { initPool } = require('./db/oracle');
const getConnection  = require('./db/oracle');
const materialsRouter = require('./routes/materials');
const authRoutes     = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { router: chatRoutes, insertMessage } = require('./routes/chatRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://localhost:5502",
    "http://127.0.0.1:5502"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Dashboard route (protected)
app.use('/api/dashboard', dashboardRoutes);

// Activity routes (protected) - user-specific tracking
app.use('/api/activity', activityRoutes);

// Materials API - public material CRUD
app.use('/api/materials', materialsRouter);

// KnowNook chat history (protected)
app.use('/api/chat', chatRoutes);

// In-memory OTP storage
const otpStore = new Map();

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
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: 'StudyHub - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to StudyHub!</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Send OTP endpoint 
app.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Check if email already exists
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        'SELECT email FROM users WHERE email = :email',
        { email }
      );

      if (result.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
    } finally {
      await conn.close();
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);
    console.log(`OTP sent to ${email}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP and create user
app.post('/auth/verify-otp-signup', async (req, res) => {
  try {
    const { fullName, email, password, otp } = req.body;

    // Validate input
    if (!fullName || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify OTP
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    if (storedOTP.expiresAt < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // OTP verified, delete it
    otpStore.delete(email);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user into database
    const conn = await getConnection();
    try {
      await conn.execute(
        `INSERT INTO users (user_id, full_name, email, password_hash, role)
         VALUES (:userId, :fullName, :email, :passwordHash, 'student')`,
        { userId, fullName, email, passwordHash },
        { autoCommit: true }
      );

      res.json({ 
        success: true, 
        message: 'Account created successfully',
        userId 
      });
    } catch (dbError) {
      if (dbError.errorNum === 1) { // ORA-00001: unique constraint violated
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      throw dbError;
    } finally {
      await conn.close();
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// ─── KnowNook – NVIDIA AI Proxy (with DB persistence) ────────────────────────
const NVIDIA_API_KEY  = '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL    = 'openai/gpt-oss-20b';
const MAX_MSG_LEN     = 4000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'studyhub-secret-key-change-in-production';

// POST /api/ask – proxies to NVIDIA + saves to DB when user is authenticated
app.post('/api/ask', async (req, res) => {
    const { messages, sessionId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'No messages provided.' });
    }

    // Extract last user message for DB storage
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');

    // ── Guard: reject empty user messages ─────────────────────────────────────
    if (!lastUserMsg || !lastUserMsg.content || lastUserMsg.content.trim() === '') {
        return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    // ── Resolve authenticated user (optional – guests can still chat) ─────────
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
            userId = decoded.userId || null;
        } catch (_) { /* invalid token → guest mode */ }
    }

    // ── Save user message to DB (if authenticated + sessionId provided) ───────
    if (userId && sessionId) {
        try {
            const conn = await getConnection();
            await insertMessage(conn, userId, 'user', lastUserMsg.content, sessionId);
            await conn.close();
        } catch (dbErr) {
            console.error('DB save (user msg) error:', dbErr);
        }
    }

    try {
        const nvResponse = await axios.post(
            `${NVIDIA_BASE_URL}/chat/completions`,
            {
                model:       NVIDIA_MODEL,
                messages:    messages,
                temperature: 1,
                top_p:       1,
                max_tokens:  4096,
                stream:      true
            },
            {
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${NVIDIA_API_KEY}`
                },
                responseType: 'stream'
            }
        );

        // Forward SSE headers to browser
        res.setHeader('Content-Type',  'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection',    'keep-alive');

        // ── Tee the stream: one branch → browser, one branch → collect text ───
        const browserBranch  = new PassThrough();
        const collectBranch  = new PassThrough();
        nvResponse.data.pipe(browserBranch);
        nvResponse.data.pipe(collectBranch);
        browserBranch.pipe(res);

        // Collect SSE chunks to assemble full assistant text
        let rawBuffer    = '';
        let assistantText = '';
        let streamError  = false;

        collectBranch.on('data', (chunk) => {
            rawBuffer += chunk.toString('utf8');
            // Parse SSE lines incrementally
            const lines = rawBuffer.split('\n');
            rawBuffer = lines.pop(); // keep incomplete line
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;
                try {
                    const json  = JSON.parse(trimmed.slice(6));
                    const delta = json?.choices?.[0]?.delta;
                    if (delta?.content) assistantText += delta.content;
                } catch (_) { /* ignore malformed */ }
            }
        });

        collectBranch.on('error', (err) => {
            console.error('Collect stream error:', err.message);
            streamError = true;
        });

        collectBranch.on('end', async () => {
            if (!streamError && userId && sessionId && assistantText.trim()) {
                try {
                    const conn = await getConnection();
                    await insertMessage(conn, userId, 'assistant', assistantText, sessionId);
                    await conn.close();
                } catch (dbErr) {
                    console.error('DB save (assistant msg) error:', dbErr);
                }
            }
        });

        nvResponse.data.on('error', (err) => {
            console.error('NVIDIA source stream error:', err.message);
            streamError = true;
            res.end();
        });

    } catch (err) {
        console.error('NVIDIA API error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error contacting NVIDIA API.' });
    }
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
initPool()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ StudyHub Backend Server running on port ${PORT}`);
      console.log(`✅ Auth API: http://localhost:${PORT}/api/auth/*`);
      console.log(`✅ Dashboard API: http://localhost:${PORT}/api/dashboard`);
      console.log(`✅ Activity API: http://localhost:${PORT}/api/activity/:materialId/view|download|progress`);
      console.log(`✅ Materials API: http://localhost:${PORT}/api/materials`);
      console.log(`✅ KnowNook AI API:   http://localhost:${PORT}/api/ask  [NVIDIA GPT-OSS-20B]`);
      console.log(`✅ KnowNook History:  http://localhost:${PORT}/api/chat/history`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize DB pool:', err);
    process.exit(1);
  });
