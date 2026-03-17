# StudyHub - Quick Start Guide

## ✅ Frontend-Backend Integration Fixed!

**All pages now correctly load data from backend APIs.**

See `INTEGRATION-FIX-SUMMARY.md` for complete details.

## Prerequisites
- Node.js installed
- Oracle Database configured
- Environment variables set in `.env` file

## Starting the Application

### 1. Start Backend Server
```bash
cd backend
node server.js
```
The server will start on **http://localhost:3001**

You should see:
```
✅ StudyHub Backend Server running on port 3001
✅ Auth API: http://localhost:3001/api/auth/*
✅ Dashboard API: http://localhost:3001/api/dashboard
✅ Materials API: http://localhost:3001/api/materials
```

### 2. Start Frontend
Open `frontend/index.html` with Live Server or any web server.

If using VS Code Live Server, it will typically run on:
- **http://localhost:5500** or
- **http://127.0.0.1:5500** or
- **http://localhost:5501** or
- **http://127.0.0.1:5501**

### 3. Test API Integration (Optional)
Open `frontend/test-api-integration.html` to test all API endpoints.

## Common Issues

### Pages Stuck on "Loading..."
**Solution**: 
1. Ensure backend server is running on port 3001
2. Check browser console for errors
3. Verify Live Server port matches CORS config (5500, 5501, 5502)
4. Use `test-api-integration.html` to diagnose API issues

### "Failed to connect to server" on Login
**Solution**: Make sure the backend server is running on port 3001
```bash
cd backend
node server.js
```

### Database Connection Errors
**Solution**: Check your `.env` file has correct Oracle DB credentials:
```
DB_USER=your_username
DB_PASSWORD=your_password
DB_CONNECTION_STRING=your_connection_string
MAIL_USER=your_gmail
MAIL_PASS=your_app_password
```

### Material Upload Not Working
**Solution**: 
1. Backend server must be running
2. Check uploads folder exists: `backend/uploads/textbooks`, `backend/uploads/videos`, etc.
3. Check console for errors

## Features

### Authentication
- Sign up with email verification (OTP)
- Login with email/password
- Session management with JWT tokens

### Materials Management
- Upload textbooks (PDF)
- Upload videos (MP4, AVI, MOV)
- Upload audio (MP3, WAV, M4A)
- Upload notes and infographics
- Download tracking
- Author/Publisher information
- Upload date display

### Study Tools
- StudyBite - Daily challenges
- KnowNook - AI-powered Q&A
- StudySync - Group study planner
- MindMesh - Concept mapping
- Cheat Notes - Quick notes
- Timetable Creator
- Syllabus Scheduler

## API Endpoints

### Auth
- POST `/api/auth/login` - User login
- POST `/auth/send-otp` - Send OTP for signup
- POST `/auth/verify-otp-signup` - Verify OTP and create account

### Materials
- GET `/api/materials?type=textbook` - Get materials by type
- POST `/api/materials` - Upload new material
- POST `/api/materials/:id/download` - Increment download count

### AI
- POST `/api/ask` - Ask Gemini AI a question

## Database Tables

### users
- user_id (PK)
- full_name
- email (UNIQUE)
- password_hash
- role
- created_at
- last_login_at

### materials
- id (PK)
- title
- description
- type (textbook/video/notes/audio)
- format (pdf/link/mp4/mp3)
- file_path
- link
- thumbnail
- download_count
- created_at
- author

## Support
For issues or questions, check the console logs in both browser and backend terminal.
