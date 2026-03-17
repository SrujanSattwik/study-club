const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'studyhub-secret-key-change-in-production';

function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticateUser, generateToken, JWT_SECRET };
