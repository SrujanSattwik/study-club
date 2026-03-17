# Settings Feature - Quick Start Testing Guide

## 5-Minute Quick Test

### Prerequisites
✅ Backend running (`npm start`)
✅ Frontend available at `http://localhost:5500`
✅ User logged in with JWT token in localStorage
✅ Gmail configured in `.env`

---

## Test 1: Profile Section (1 minute)

1. Navigate to: `http://localhost:5500/frontend/pages/settings.html`
2. Login if not already logged in
3. Wait for page to load
4. **Verify:**
   - ✅ Profile section is active (on left)
   - ✅ Your name appears
   - ✅ Your email appears
   - ✅ Role displays (usually "User")
   - ✅ Account creation date shows
   - ✅ Edit Profile button shows "Coming Soon" message when clicked
   - ✅ Change Avatar button shows "Coming Soon" message when clicked

---

## Test 2: Password Change (2 minutes)

### Step 1: Prepare
1. Click "Change Password" in sidebar
2. You should see the password form

### Step 2: Validate Form Errors
1. Try entering wrong current password + new password
2. Click "Send OTP"
3. **You should see error:** "Current password is incorrect"

### Step 3: Successful OTP Send
1. Enter correct current password
2. Enter new password (8+ chars, different from current)
3. Confirm new password matches
4. Click "Send OTP"
5. **You should see:**
   - ✅ Success toast: "OTP sent to your email"
   - ✅ OTP input section appears below
   - ✅ 5-minute countdown timer visible (5:00)
   - ✅ "Verify & Update Password" button appears
   - ✅ "Cancel" button appears

### Step 4: Enter OTP
1. Check your email for OTP code
2. Copy the 6-digit code
3. Paste into OTP input field
4. Click "Verify & Update Password"
5. **You should see:**
   - ✅ Loading spinner on button
   - ✅ Success toast: "Password updated successfully"
   - ✅ Form resets after 2 seconds
   - ✅ Back to initial password form

### Step 5: Verify Password Works
1. Logout (click Logout button)
2. Try logging in with NEW password
3. **You should:**
   - ✅ Successfully login
   - ✅ See dashboard/home page
   - ✅ Token stored in localStorage

---

## Test 3: Account Deletion (2 minutes)

### Step 1: Navigate to Delete Section
1. Open Settings page again (login if needed)
2. Click "Delete Account" in sidebar
3. **You should see:**
   - ✅ Red warning box with danger indicators
   - ✅ List of what will be deleted
   - ✅ "Delete My Account" button (red)

### Step 2: Send OTP
1. Click "Delete My Account"
2. **Browser dialog appears:** "Are you absolutely sure..."
3. Click OK to confirm
4. **You should see:**
   - ✅ Success toast: "OTP sent to your email"
   - ✅ OTP input section appears
   - ✅ 5-minute countdown timer (5:00)
   - ✅ Special warning email received

### Step 3: Enter OTP
1. Check email for OTP with deletion warning
2. Copy 6-digit code
3. Paste into OTP input
4. Click "Permanently Delete Account"
5. **Final confirmation dialog appears**
6. Click OK
7. **You should see:**
   - ✅ Success toast: "Account deleted successfully"
   - ✅ Redirected to login page after 2 seconds
   - ✅ Session ends

### Step 4: Verify Account Deleted
1. Try logging in with original credentials
2. **You should see:**
   - ✅ "Invalid email or password" error
   - ✅ Account no longer exists

---

## Test 4: Error Cases (Optional)

### Invalid OTP
1. Send OTP for password change
2. Enter wrong OTP
3. **You should see:** "Invalid OTP" error

### Expired OTP
1. Send OTP
2. Wait 5+ minutes
3. Enter OTP
4. **You should see:** "OTP has expired"

### Too Many Attempts
1. Send OTP
2. Try 3 wrong OTPs
3. Try 4th attempt
4. **You should see:** "Too many incorrect attempts"

### Validation Errors
1. **Password too short:** "minimum 8 characters"
2. **Passwords don't match:** "passwords do not match"
3. **Same password:** "must be different from current"

---

## Test 5: UI/UX Tests (Optional)

### Responsive Design
1. Open Settings on desktop (1024px+)
   - ✅ Sidebar visible on left
   - ✅ Content on right

2. Resize to tablet (768px)
   - ✅ Sidebar becomes horizontal tabs
   - ✅ Content stacks below

3. Resize to mobile (480px)
   - ✅ Hamburger menu appears
   - ✅ Click hamburger toggles menu
   - ✅ Single column layout
   - ✅ All buttons full width

### Animations
- ✅ Section transitions smooth (0.3s fade-in)
- ✅ Toast notifications slide in from right
- ✅ Toast notifications slide out after 5 seconds
- ✅ Buttons show loading spinner
- ✅ OTP input has smooth focus states

### Navigation
- ✅ Clicking sidebar links switches sections
- ✅ Active link highlighted
- ✅ Logout button works
- ✅ Back button in navbar works

---

## API Testing (Postman)

### Test GET /api/auth/me
```bash
GET http://localhost:3000/api/auth/me

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Expected Response (200):
{
  "success": true,
  "user": {
    "userId": "xxx",
    "fullName": "Your Name",
    "email": "your-email@example.com",
    "role": "User",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Test POST send-change-password-otp
```bash
POST http://localhost:3000/api/auth/send-change-password-otp

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "currentPassword": "YourCurrentPassword123",
  "newPassword": "NewPassword456"
}

Expected Response (200):
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### Test POST verify-change-password
```bash
POST http://localhost:3000/api/auth/verify-change-password

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "otp": "123456",
  "newPassword": "NewPassword456"
}

Expected Response (200):
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Test POST send-delete-otp
```bash
POST http://localhost:3000/api/auth/send-delete-otp

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body: {}

Expected Response (200):
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### Test POST delete-account
```bash
POST http://localhost:3000/api/auth/delete-account

Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "otp": "123456"
}

Expected Response (200):
{
  "success": true,
  "message": "Account deleted successfully",
  "logout": true
}
```

---

## Debugging Tips

### If Page Doesn't Load
1. Check console for errors (F12)
2. Check if JWT token exists in localStorage
3. Check backend console for API errors
4. Try clearing cache (Ctrl+Shift+Delete)

### If API Calls Fail
1. Check Authorization header has "Bearer " prefix
2. Check token is valid (hasn't expired)
3. Check backend is running
4. Check CORS settings allow frontend URL
5. Check network tab in DevTools

### If Email Doesn't Send
1. Check MAIL_USER and MAIL_PASS in .env
2. Check Gmail has 2FA enabled
3. Check using Gmail app password (not regular password)
4. Check backend console for email errors
5. Try sending test email from backend

### If Database Operations Fail
1. Check Database connectivity
2. Check users table exists
3. Check user_id formats match
4. Check all related tables exist or errors handled
5. Check backend logs for SQL errors

---

## Checklist for Sign-Off

- [ ] Profile section loads correctly
- [ ] Password change OTP flow works
- [ ] New password verified on login
- [ ] Account deletion OTP flow works
- [ ] Account actually deleted (old login fails)
- [ ] Responsive design works (desktop/tablet/mobile)
- [ ] Toasts appear for all actions
- [ ] All error messages display correctly
- [ ] Navigation works smoothly
- [ ] No console errors
- [ ] No backend errors
- [ ] Email sending works
- [ ] OTP timers work correctly
- [ ] Resend OTP works
- [ ] Cancel/back options work
- [ ] Logout works from settings
- [ ] Redirect to login if not authenticated

---

## Test Results Template

```markdown
## Settings Feature Test Results

**Date:** March 17, 2024
**Tester:** [Your Name]
**Environment:** Local / Staging / Production

### Profile Section
- Loads: ✅ / ❌
- Data displays: ✅ / ❌
- Edit button works: ✅ / ❌
- Avatar button works: ✅ / ❌

### Password Change
- Form validates: ✅ / ❌
- OTP sends: ✅ / ❌
- OTP input appears: ✅ / ❌
- Timer works: ✅ / ❌
- Correct OTP updates: ✅ / ❌
- Wrong OTP shows error: ✅ / ❌
- New password works: ✅ / ❌

### Account Deletion
- Confirmation appears: ✅ / ❌
- OTP sends: ✅ / ❌
- Warning email: ✅ / ❌
- OTP verification works: ✅ / ❌
- Account deleted: ✅ / ❌
- User logged out: ✅ / ❌
- Old login fails: ✅ / ❌

### UI/UX
- Responsive: ✅ / ❌
- Animations: ✅ / ❌
- Navigation: ✅ / ❌
- Toasts: ✅ / ❌

### Overall Status
**PASS** / **FAIL**

**Issues Found:**
(List any bugs or issues)

**Notes:**
(Any additional observations)
```

---

## Support

If you encounter any issues:
1. Check browser console (F12 → Console tab)
2. Check backend logs
3. Review SETTINGS-FEATURE-GUIDE.md for detailed info
4. Review SETTINGS-INTEGRATION-SUMMARY.md for setup
5. Check .env configuration

---

**Estimated Test Time:** 10 minutes
**Required Accounts:** 1 test account
**Required Tools:** Browser, Email access, Postman (optional)

Happy Testing! ✅
