@echo off
echo ========================================
echo   StudyHub Backend - Setup Script
echo ========================================
echo.

cd backend

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Verifying installation...
call npm list --depth=0

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo   Ready to start!
echo ========================================
echo.
echo To start the server, run:
echo   cd backend
echo   node server.js
echo.
echo Or use the start.bat file
echo.
pause
