# Backend User-Authenticated System - Quick Start

## 🎯 What's New

The backend now has a complete user-authenticated system with:
- Proper JWT authentication
- Activity tracking (views, downloads, progress)
- User dashboard with stats
- Clean route separation
- Security-first design

---

## 🚀 Getting Started

### 1. Start the Server

```bash
cd backend
node server.js
```

You should see:
```
✅ StudyHub Backend Server running on port 3001
✅ Auth API: http://localhost:3001/api/auth/*
✅ Dashboard API: http://localhost:3001/api/dashboard
✅ Activity API: http://localhost:3001/api/materials/:id/view|download|progress
✅ Materials API: http://localhost:3001/api/materials
✅ Gemini AI API: http://localhost:3001/api/ask
```

### 2. Test the System

```bash
node test-auth-system.js
```

This will run automated tests for all endpoints.

---

## 📋 API Quick Reference

### Login
```javascript
POST /api/auth/login
Body: { email, password }
Response: { success, token, user }
```

### Get Dashboard
```javascript
GET /api/dashboard
Headers: { Authorization: "Bearer <token>" }
Response: { success, data: { stats, recentActivity } }
```

### Track Activity
```javascript
POST /api/materials/:materialId/view
POST /api/materials/:materialId/download
POST /api/materials/:materialId/progress
Headers: { Authorization: "Bearer <token>" }
Body: { progress } // only for progress endpoint
```

---

## 🔐 Security Features

1. **JWT Authentication**
   - 7-day token expiration
   - Secure token generation
   - Middleware validation

2. **User ID Protection**
   - Never accepted from request body
   - Always extracted from JWT token
   - Validated on every protected route

3. **Data Isolation**
   - Users only see their own data
   - Dashboard stats per user
   - Activity tracking per user

---

## 📊 Database Tables Used

### `users`
- Stores user accounts
- Managed by auth system

### `user_material_activity`
- Tracks all user interactions
- Updated by activity routes
- Used for dashboard stats

### `user_dashboard_stats`
- Aggregated user statistics
- Auto-updated on activity
- Read by dashboard endpoint

### `user_login_logs`
- Login history
- IP and device tracking
- Security audit trail

---

## 🛠️ File Structure

```
backend/
├── controllers/
│   ├── authController.js          # Login/logout logic
│   ├── activityController.js      # Activity tracking
│   └── dashboardController.js     # Dashboard data
├── middleware/
│   └── auth.js                    # JWT validation
├── routes/
│   ├── authRoutes.js              # Auth endpoints
│   ├── activityRoutes.js          # Activity endpoints
│   ├── dashboardRoutes.js         # Dashboard endpoint
│   └── materials.js               # Materials CRUD
├── db/
│   └── oracle.js                  # Database connection
├── server.js                      # Main server file
├── test-auth-system.js            # Test script
├── API-DOCUMENTATION.md           # Full API docs
└── IMPLEMENTATION-COMPLETE.md     # Implementation details
```

---

## 🧪 Manual Testing

### 1. Login and Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Copy the token from the response.

### 2. Get Dashboard
```bash
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Track a View
```bash
curl -X POST http://localhost:3001/api/materials/material-123/view \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Progress
```bash
curl -X POST http://localhost:3001/api/materials/material-123/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"progress":75}'
```

### 5. Check Dashboard Again
```bash
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

You should see updated stats!

---

## 🎨 Frontend Integration Example

```javascript
// Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await loginResponse.json();
localStorage.setItem('authToken', token);

// Get Dashboard
const dashboardResponse = await fetch('http://localhost:3001/api/dashboard', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
});
const dashboardData = await dashboardResponse.json();

// Track View
await fetch(`http://localhost:3001/api/materials/${materialId}/view`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
});

// Update Progress
await fetch(`http://localhost:3001/api/materials/${materialId}/progress`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: JSON.stringify({ progress: 75 })
});
```

---

## ⚠️ Important Notes

1. **Token Storage**
   - Store JWT token securely (localStorage or sessionStorage)
   - Include in Authorization header for all protected requests
   - Handle 401 responses (token expired → redirect to login)

2. **User ID**
   - NEVER send user_id in request body
   - Backend extracts it from JWT token
   - This prevents user impersonation

3. **Materials**
   - Materials table is GLOBAL (shared by all users)
   - Activity tracking is PER USER
   - Dashboard shows user-specific stats

4. **Error Handling**
   - 401: Authentication required or token invalid
   - 500: Server error
   - Always check response.success field

---

## 📚 Documentation

- **API-DOCUMENTATION.md** - Complete API reference
- **IMPLEMENTATION-COMPLETE.md** - Implementation details
- **test-auth-system.js** - Automated test suite

---

## ✅ Checklist

- [x] Auth routes created
- [x] Activity routes created
- [x] Dashboard route created
- [x] Dashboard controller created
- [x] Server.js updated
- [x] JWT authentication working
- [x] User ID from token (not body)
- [x] Dashboard stats auto-update
- [x] Security constraints met
- [x] No database schema changes
- [x] No frontend changes
- [x] Documentation complete
- [x] Test script included

---

## 🎉 Ready to Use!

The backend user-authenticated system is complete and ready for frontend integration.

For questions or issues, refer to:
- API-DOCUMENTATION.md for endpoint details
- IMPLEMENTATION-COMPLETE.md for architecture
- test-auth-system.js for usage examples
