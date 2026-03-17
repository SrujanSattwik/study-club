# StudyHub - Main Project Data

This document contains the comprehensive data for the StudyHub project. It serves as a central source of truth for features, architecture, and system details.

> [!IMPORTANT]
> This file should be updated with each new feature release or significant architectural change.

## 🚀 Project Overview
StudyHub is a comprehensive digital learning ecosystem designed to streamline educational resource management and enhance student collaboration. It integrates advanced materials management, AI-powered study tools, and a secure authentication system.

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (Dynamic Loading) |
| **Backend** | Node.js, Express.js |
| **Database** | Oracle Database (Oracle XE), Oracle Instant Client |
| **AI Integration** | Google Gemini AI API |
| **Authentication** | JWT (JSON Web Tokens), OTP (Email Verification via Nodemailer) |

---

## ✨ Core Features

### 🔐 Authentication & User Management
- **Secure Signup:** Email verification using OTP.
- **Robust Login:** JWT-based session management.
- **Profile Management:** User-specific dashboards and settings.
- **Role-based Access:** Differentiated access for students and admins.

### 📚 Materials Management
- **Multi-format Support:** Support for Textbooks (PDF), Videos (MP4/AVI), Audio (MP3), Notes, and Infographics.
- **Upload System:** Managed backend uploads with categorization.
- **Download Tracking:** Real-time tracking of resource popularity.
- **Search & Filter:** Advanced filtering by material type and author.

### 🧠 Intelligent Study Tools
- **KnowNook:** AI-powered Q&A interface using Gemini AI.
- **StudyBite:** Daily academic challenges.
- **StudySync:** Collaborative group study planner.
- **MindMesh:** Interactive concept mapping.
- **Syllabus Scheduler:** Automated study plan generator.
- **Timetable Creator:** Personalized schedule management.

---

## 🏗 System Architecture

### Frontend Structure
- `/frontend/index.html`: Main entry point.
- `/frontend/pages/`: Individual feature pages (Community, Dashboard, Materials).
- `/frontend/components/`: Reusable HTML/JS components (Sidebar, Navbar).
- `/frontend/css/`: Modular stylesheets.

### Backend Structure
- `backend/server.js`: Main server configuration and route registration.
- `backend/db/oracle.js`: Oracle database connection pool management.
- `backend/controllers/`: Business logic for various modules (Materials, Activity, Auth).
- `backend/routes/`: API endpoint definitions.

---

## 📊 Database Schema Highlights

- **`USERS`**: Manages credentials, roles, and session metadata.
- **`MATERIALS`**: Stores metadata for educational resources, including paths and download counts.
- **`ACTIVITY_LOG`**: Tracks user interactions for analytics and progress monitoring.

---

## 🔗 Key API Endpoints

- `POST /api/auth/login`: User authentication.
- `GET /api/materials`: Retrieve filtered library resources.
- `POST /api/activity/:id/view`: Track resource engagement.
- `POST /api/ask`: Interface with Gemini AI.

---

## 🔮 Roadmap & Future Updates
- [ ] Real-time study groups with WebSockets.
- [ ] Advanced analytics dashboard for learners.
- [ ] Dark mode/Theming support.
- [ ] Native mobile wrapper.

---

*Last Updated: 2026-03-06*
