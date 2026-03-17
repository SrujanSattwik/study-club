# Backend User-Authenticated System API Documentation

## Overview
This document describes the complete backend API for the StudyHub user-authenticated system.

## Base URL
```
http://localhost:3001
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Routes (`/api/auth`)

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### POST /api/auth/logout
Logout current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Activity Routes (`/api/materials/:materialId`)

All activity routes are **protected** and require authentication.
The `user_id` is automatically extracted from the JWT token.

### POST /api/materials/:materialId/view
Track when a user views a material.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `materialId` (string): The ID of the material being viewed

**Response:**
```json
{
  "success": true,
  "message": "View recorded"
}
```

**Side Effects:**
- Creates activity record with type 'view'
- Updates user_dashboard_stats

### POST /api/materials/:materialId/download
Track when a user downloads a material.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `materialId` (string): The ID of the material being downloaded

**Response:**
```json
{
  "success": true,
  "message": "Download recorded"
}
```

**Side Effects:**
- Creates activity record with type 'download'
- Updates user_dashboard_stats

### POST /api/materials/:materialId/progress
Update progress for a material.

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `materialId` (string): The ID of the material

**Request Body:**
```json
{
  "progress": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress updated"
}
```

**Side Effects:**
- Creates activity record with type 'progress'
- Updates user_dashboard_stats with new completion_rate

---

## Dashboard Route (`/api/dashboard`)

### GET /api/dashboard
Get dashboard statistics and recent activity for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMaterials": 5,
      "completionRate": 67.5,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "recentActivity": [
      {
        "activityId": "uuid",
        "materialId": "material-uuid",
        "activityType": "progress",
        "progress": 75,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "activityId": "uuid",
        "materialId": "material-uuid",
        "activityType": "download",
        "progress": 0,
        "timestamp": "2024-01-15T09:15:00Z"
      }
    ]
  }
}
```

**Notes:**
- Returns only the logged-in user's data
- Recent activity limited to last 5 records
- Stats are automatically calculated from user_material_activity table

---

## Database Schema

### user_material_activity
Tracks all user interactions with materials.

```sql
- activity_id (VARCHAR2, PK)
- user_id (VARCHAR2, FK)
- material_id (VARCHAR2)
- activity_type (VARCHAR2) -- 'view', 'download', 'progress'
- progress (NUMBER) -- 0-100
- activity_timestamp (TIMESTAMP)
```

### user_dashboard_stats
Aggregated statistics per user.

```sql
- user_id (VARCHAR2, PK)
- total_materials (NUMBER) -- count of distinct materials interacted with
- completion_rate (NUMBER) -- average of all progress values
- last_updated (TIMESTAMP)
```

---

## Security Constraints

1. **Never trust frontend for user_id**
   - All user identification comes from JWT token
   - Middleware extracts userId from token and adds to req.userId

2. **Global vs Personal Data**
   - Materials, resources, community → GLOBAL (shared by all users)
   - Activity tracking → PERSONAL (per user)
   - Dashboard stats → PERSONAL (per user)

3. **Token Expiration**
   - JWT tokens expire after 7 days
   - Frontend must handle 401 responses and redirect to login

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**401 Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to [operation]"
}
```

---

## Middleware Order

The server applies middleware in this order:
1. CORS
2. JSON body parser
3. Static file serving (/uploads)
4. Route-specific authentication (where required)

---

## Testing

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Dashboard (with token)
```bash
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Activity Tracking
```bash
curl -X POST http://localhost:3001/api/materials/material-id-123/view \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes

- All timestamps are in UTC
- Progress values are 0-100
- Material IDs reference the global materials table
- User IDs are UUIDs generated during signup
