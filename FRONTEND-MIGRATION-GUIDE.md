# 🔄 FRONTEND MIGRATION GUIDE

## Overview
Backend routes have been reorganized to fix conflicts. Activity tracking endpoints moved from `/api/materials/*` to `/api/activity/*`.

---

## 🔍 What Changed

### Activity Tracking Routes (User-Specific)
**Purpose:** Track individual user interactions with materials

| Old Endpoint | New Endpoint | Auth Required |
|-------------|--------------|---------------|
| `POST /api/materials/:id/view` | `POST /api/activity/:materialId/view` | ✅ Yes |
| `POST /api/materials/:id/download` | `POST /api/activity/:materialId/download` | ✅ Yes |
| `POST /api/materials/:id/progress` | `POST /api/activity/:materialId/progress` | ✅ Yes |

### Materials Routes (Public CRUD)
**Purpose:** Manage materials (list, upload, download counter)

| Endpoint | Changed? | Auth Required |
|----------|----------|---------------|
| `GET /api/materials` | ❌ No change | ❌ No |
| `POST /api/materials` | ❌ No change | ❌ No |
| `POST /api/materials/:id/download` | ❌ No change | ❌ No |

---

## 📝 Code Changes Required

### 1. Update Activity Tracking Calls

#### Recording a View
```javascript
// ❌ OLD CODE
async function recordView(materialId) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/materials/${materialId}/view`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// ✅ NEW CODE
async function recordView(materialId) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/activity/${materialId}/view`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

#### Recording a Download (User Tracking)
```javascript
// ❌ OLD CODE
async function recordUserDownload(materialId) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/materials/${materialId}/download`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// ✅ NEW CODE
async function recordUserDownload(materialId) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/activity/${materialId}/download`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

#### Updating Progress
```javascript
// ❌ OLD CODE
async function updateProgress(materialId, progress) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/materials/${materialId}/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ progress })
  });
}

// ✅ NEW CODE
async function updateProgress(materialId, progress) {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:3001/api/activity/${materialId}/progress`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ progress })
  });
}
```

### 2. Public Download Counter (No Change)
```javascript
// ✅ UNCHANGED - Still works
async function incrementDownloadCounter(materialId) {
  await fetch(`http://localhost:3001/api/materials/${materialId}/download`, {
    method: 'POST'
  });
}
```

---

## 🔍 Files to Check

Search your frontend for these patterns and update:

### Pattern 1: Direct fetch calls
```javascript
// Search for:
fetch('http://localhost:3001/api/materials/${id}/view'
fetch('http://localhost:3001/api/materials/${id}/download'
fetch('http://localhost:3001/api/materials/${id}/progress'

// Replace with:
fetch('http://localhost:3001/api/activity/${materialId}/view'
fetch('http://localhost:3001/api/activity/${materialId}/download'
fetch('http://localhost:3001/api/activity/${materialId}/progress'
```

### Pattern 2: Axios calls
```javascript
// Search for:
axios.post(`/api/materials/${id}/view`
axios.post(`/api/materials/${id}/download`
axios.post(`/api/materials/${id}/progress`

// Replace with:
axios.post(`/api/activity/${materialId}/view`
axios.post(`/api/activity/${materialId}/download`
axios.post(`/api/activity/${materialId}/progress`
```

### Pattern 3: API helper functions
```javascript
// Search for:
const API_BASE = 'http://localhost:3001/api/materials';

// Update to:
const API_BASE = 'http://localhost:3001/api';
const ACTIVITY_API = `${API_BASE}/activity`;
const MATERIALS_API = `${API_BASE}/materials`;
```

---

## 📂 Likely Files to Update

Based on your project structure:
- `frontend/assets/js/materials.js`
- `frontend/assets/js/materials-manager.js`
- `frontend/pages/materials/textbooks.html` (inline scripts)
- `frontend/pages/materials/video-lectures.html` (inline scripts)
- `frontend/pages/materials/audio-content.html` (inline scripts)
- `frontend/pages/materials/study-notes.html` (inline scripts)

---

## 🧪 Testing After Migration

### Test Activity Tracking
1. Login to the app
2. View a material → Check browser console for 200 response
3. Download a material → Check browser console for 200 response
4. Update progress → Check browser console for 200 response
5. Check dashboard → Verify stats updated

### Test Materials API
1. List materials → Should work without login
2. Upload material → Should work
3. Download counter → Should increment

### Expected Responses

#### Success Response
```json
{
  "success": true,
  "message": "View recorded"
}
```

#### Error Response (No Auth)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### Error Response (Invalid Input)
```json
{
  "success": false,
  "message": "Material ID is required"
}
```

---

## 🔧 Quick Find & Replace

Use your IDE's find & replace feature:

### Find:
```
/api/materials/\$\{([^}]+)\}/(view|download|progress)
```

### Replace:
```
/api/activity/${$1}/$2
```

**Note:** This regex works in VS Code. Adjust for your IDE.

---

## ⚠️ Important Notes

1. **Two Download Endpoints:**
   - `/api/activity/:id/download` - Tracks user download (requires auth)
   - `/api/materials/:id/download` - Increments public counter (no auth)
   
   Use both if you want to track user activity AND increment public counter.

2. **Authentication Required:**
   All `/api/activity/*` endpoints require JWT token in Authorization header.

3. **Material ID Parameter:**
   Changed from `:id` to `:materialId` for clarity. Both work, but `:materialId` is more descriptive.

4. **Error Handling:**
   Backend now returns proper 400/401/500 status codes. Update error handling accordingly.

---

## 📊 Migration Checklist

- [ ] Search for `/api/materials/*/view` and update
- [ ] Search for `/api/materials/*/download` and update (user tracking only)
- [ ] Search for `/api/materials/*/progress` and update
- [ ] Test login flow
- [ ] Test material viewing
- [ ] Test material downloading
- [ ] Test progress tracking
- [ ] Test dashboard stats
- [ ] Verify public download counter still works
- [ ] Check browser console for errors
- [ ] Test without authentication (should fail gracefully)

---

## 🆘 Troubleshooting

### "Authentication required" error
- Check JWT token is in localStorage
- Verify Authorization header format: `Bearer <token>`
- Check token hasn't expired (7 day expiry)

### "Material ID is required" error
- Verify materialId is being passed in request
- Check materialId is not undefined or null

### 404 Not Found
- Verify you updated the endpoint path
- Check backend is running on port 3001
- Verify route is `/api/activity/` not `/api/materials/`

### CORS errors
- Backend allows localhost:5500, 5501, 5502
- If using different port, update backend CORS config

---

## ✅ Verification

After migration, all these should work:

```javascript
// Activity tracking (requires auth)
POST /api/activity/123/view          → 200 OK
POST /api/activity/123/download      → 200 OK
POST /api/activity/123/progress      → 200 OK

// Materials CRUD (public)
GET  /api/materials                  → 200 OK
POST /api/materials                  → 201 Created
POST /api/materials/123/download     → 200 OK

// Dashboard (requires auth)
GET  /api/dashboard                  → 200 OK
```

---

**Need Help?** Check `BACKEND-BUG-FIX-COMPLETE.md` for full details.
