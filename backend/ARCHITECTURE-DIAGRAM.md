# Backend Authentication System Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  (React/Vanilla JS - sends requests with JWT token)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │ Authorization: Bearer <token>
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                              │
│                      (server.js)                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MIDDLEWARE LAYER                                       │    │
│  │  • CORS                                                 │    │
│  │  • JSON Parser                                          │    │
│  │  • Static Files (/uploads)                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ROUTE LAYER                                            │    │
│  │                                                         │    │
│  │  /api/auth/*          → authRoutes.js                  │    │
│  │  /api/dashboard       → dashboardRoutes.js             │    │
│  │  /api/materials/:id/* → activityRoutes.js              │    │
│  │  /api/materials/*     → materials.js                   │    │
│  │  /auth/*              → OTP/Signup (in server.js)      │    │
│  │  /api/ask             → Gemini AI (in server.js)       │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  AUTH MIDDLEWARE (middleware/auth.js)                   │    │
│  │                                                         │    │
│  │  authenticateUser()                                     │    │
│  │  • Validates JWT token                                 │    │
│  │  • Extracts userId from token                          │    │
│  │  • Adds req.userId and req.userEmail                   │    │
│  │  • Returns 401 if invalid                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  CONTROLLER LAYER                                       │    │
│  │                                                         │    │
│  │  authController.js                                      │    │
│  │  • login()                                              │    │
│  │  • logout()                                             │    │
│  │                                                         │    │
│  │  activityController.js                                  │    │
│  │  • recordView()                                         │    │
│  │  • recordDownload()                                     │    │
│  │  • updateProgress()                                     │    │
│  │  • trackActivity()                                      │    │
│  │  • updateDashboardStats()                              │    │
│  │                                                         │    │
│  │  dashboardController.js                                 │    │
│  │  • getDashboard()                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  DATABASE LAYER (db/oracle.js)                          │    │
│  │                                                         │    │
│  │  getConnection()                                        │    │
│  │  • Returns Oracle DB connection                        │    │
│  │  • Connection pooling                                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORACLE DATABASE                               │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────┐        │
│  │  users           │  │  user_login_logs             │        │
│  │  • user_id (PK)  │  │  • log_id (PK)               │        │
│  │  • full_name     │  │  • user_id (FK)              │        │
│  │  • email         │  │  • ip_address                │        │
│  │  • password_hash │  │  • device_info               │        │
│  │  • role          │  │  • login_timestamp           │        │
│  └──────────────────┘  └──────────────────────────────┘        │
│                                                                  │
│  ┌──────────────────────────────────┐  ┌────────────────────┐  │
│  │  user_material_activity          │  │  user_dashboard_   │  │
│  │  • activity_id (PK)              │  │  stats             │  │
│  │  • user_id (FK)                  │  │  • user_id (PK)    │  │
│  │  • material_id                   │  │  • total_materials │  │
│  │  • activity_type (view/download) │  │  • completion_rate │  │
│  │  • progress (0-100)              │  │  • last_updated    │  │
│  │  • activity_timestamp            │  └────────────────────┘  │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  materials       │  (GLOBAL - shared by all users)           │
│  │  • material_id   │                                           │
│  │  • title         │                                           │
│  │  • type          │                                           │
│  │  • file_path     │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Examples

### 1. Login Flow

```
Frontend                Server              Auth Controller      Database
   │                      │                       │                 │
   │  POST /api/auth/login                        │                 │
   ├─────────────────────>│                       │                 │
   │  {email, password}   │                       │                 │
   │                      │  login(req, res)      │                 │
   │                      ├──────────────────────>│                 │
   │                      │                       │  SELECT user    │
   │                      │                       ├────────────────>│
   │                      │                       │<────────────────┤
   │                      │                       │  user data      │
   │                      │                       │                 │
   │                      │                       │  bcrypt.compare │
   │                      │                       │  ✓ password OK  │
   │                      │                       │                 │
   │                      │                       │  UPDATE last_   │
   │                      │                       │  login_at       │
   │                      │                       ├────────────────>│
   │                      │                       │                 │
   │                      │                       │  INSERT login_  │
   │                      │                       │  log            │
   │                      │                       ├────────────────>│
   │                      │                       │                 │
   │                      │                       │  generateToken()│
   │                      │                       │  ✓ JWT created  │
   │                      │<──────────────────────┤                 │
   │                      │  {token, user}        │                 │
   │<─────────────────────┤                       │                 │
   │  {success, token}    │                       │                 │
   │                      │                       │                 │
```

### 2. Dashboard Request Flow

```
Frontend                Server              Middleware           Controller         Database
   │                      │                      │                    │                 │
   │  GET /api/dashboard  │                      │                    │                 │
   │  Authorization: Bearer <token>              │                    │                 │
   ├─────────────────────>│                      │                    │                 │
   │                      │  authenticateUser()  │                    │                 │
   │                      ├─────────────────────>│                    │                 │
   │                      │                      │  jwt.verify()      │                 │
   │                      │                      │  ✓ token valid     │                 │
   │                      │                      │  req.userId = ...  │                 │
   │                      │<─────────────────────┤                    │                 │
   │                      │                      │                    │                 │
   │                      │  getDashboard(req)   │                    │                 │
   │                      ├──────────────────────┴───────────────────>│                 │
   │                      │                                            │  SELECT stats   │
   │                      │                                            ├────────────────>│
   │                      │                                            │<────────────────┤
   │                      │                                            │  stats data     │
   │                      │                                            │                 │
   │                      │                                            │  SELECT recent  │
   │                      │                                            │  activity       │
   │                      │                                            ├────────────────>│
   │                      │                                            │<────────────────┤
   │                      │                                            │  activity data  │
   │                      │<───────────────────────────────────────────┤                 │
   │                      │  {stats, recentActivity}                   │                 │
   │<─────────────────────┤                                            │                 │
   │  {success, data}     │                                            │                 │
   │                      │                                            │                 │
```

### 3. Activity Tracking Flow

```
Frontend                Server              Middleware           Controller         Database
   │                      │                      │                    │                 │
   │  POST /api/materials/123/view                │                    │                 │
   │  Authorization: Bearer <token>              │                    │                 │
   ├─────────────────────>│                      │                    │                 │
   │                      │  authenticateUser()  │                    │                 │
   │                      ├─────────────────────>│                    │                 │
   │                      │                      │  ✓ token valid     │                 │
   │                      │                      │  req.userId = ...  │                 │
   │                      │<─────────────────────┤                    │                 │
   │                      │                      │                    │                 │
   │                      │  recordView(req)     │                    │                 │
   │                      ├──────────────────────┴───────────────────>│                 │
   │                      │                                            │  trackActivity()│
   │                      │                                            │  INSERT activity│
   │                      │                                            ├────────────────>│
   │                      │                                            │                 │
   │                      │                                            │  updateDashboard│
   │                      │                                            │  Stats()        │
   │                      │                                            │  SELECT stats   │
   │                      │                                            ├────────────────>│
   │                      │                                            │<────────────────┤
   │                      │                                            │  UPDATE/INSERT  │
   │                      │                                            │  dashboard_stats│
   │                      │                                            ├────────────────>│
   │                      │<───────────────────────────────────────────┤                 │
   │                      │  {success: true}                           │                 │
   │<─────────────────────┤                                            │                 │
   │  {success, message}  │                                            │                 │
   │                      │                                            │                 │
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: CORS Protection                                   │
│  • Only allows localhost:5500 and 127.0.0.1:5500           │
│  • Validates origin on every request                        │
│                                                              │
│  Layer 2: JWT Authentication                                │
│  • Token required for protected routes                      │
│  • 7-day expiration                                         │
│  • Signed with secret key                                   │
│                                                              │
│  Layer 3: User ID Extraction                                │
│  • User ID NEVER from request body                          │
│  • Always extracted from validated JWT                      │
│  • Prevents user impersonation                              │
│                                                              │
│  Layer 4: Data Isolation                                    │
│  • WHERE user_id = :userId in all queries                   │
│  • Users can only access their own data                     │
│  • No cross-user data leakage                               │
│                                                              │
│  Layer 5: Password Security                                 │
│  • bcrypt hashing (10 rounds)                               │
│  • Never store plain passwords                              │
│  • Secure comparison                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Dashboard Stats Update

```
User Action (view/download/progress)
           │
           ▼
    trackActivity()
           │
           ├─> INSERT INTO user_material_activity
           │   • activity_id (UUID)
           │   • user_id (from JWT)
           │   • material_id
           │   • activity_type
           │   • progress
           │   • timestamp
           │
           ▼
    updateDashboardStats()
           │
           ├─> SELECT COUNT(DISTINCT material_id), AVG(progress)
           │   FROM user_material_activity
           │   WHERE user_id = :userId
           │
           ▼
    Check if user record exists
           │
           ├─> If NOT exists:
           │   INSERT INTO user_dashboard_stats
           │   • user_id
           │   • total_materials
           │   • completion_rate
           │   • last_updated
           │
           └─> If exists:
               UPDATE user_dashboard_stats
               SET total_materials = ...,
                   completion_rate = ...,
                   last_updated = CURRENT_TIMESTAMP
               WHERE user_id = :userId
```

---

## 🎯 Key Design Principles

1. **Separation of Concerns**
   - Routes: HTTP handling
   - Controllers: Business logic
   - Middleware: Cross-cutting concerns
   - Database: Data persistence

2. **Security First**
   - JWT for authentication
   - User ID from token only
   - Data isolation per user
   - Password hashing

3. **Scalability**
   - Modular architecture
   - Reusable components
   - Clean interfaces
   - Easy to extend

4. **Maintainability**
   - Clear file structure
   - Consistent naming
   - Comprehensive docs
   - Test coverage

---

## 📝 Route Protection Matrix

| Endpoint                              | Protected | User ID Source |
|---------------------------------------|-----------|----------------|
| POST /api/auth/login                  | ❌ No     | N/A            |
| POST /api/auth/logout                 | ❌ No     | N/A            |
| POST /auth/send-otp                   | ❌ No     | N/A            |
| POST /auth/verify-otp-signup          | ❌ No     | N/A            |
| GET /api/dashboard                    | ✅ Yes    | JWT Token      |
| POST /api/materials/:id/view          | ✅ Yes    | JWT Token      |
| POST /api/materials/:id/download      | ✅ Yes    | JWT Token      |
| POST /api/materials/:id/progress      | ✅ Yes    | JWT Token      |
| GET/POST /api/materials/*             | ❌ No     | N/A            |
| POST /api/ask                         | ❌ No     | N/A            |

---

## 🎉 System Complete!

All components are wired together and ready for production use.
