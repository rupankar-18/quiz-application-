@echo off
cd /d "%~dp0"
echo ====================================================
echo Starting QuizPulse Full-Stack (Supabase + Vite)
echo ====================================================

echo Starting Backend Server on http://localhost:5000...
start "QuizPulse Backend Server" cmd /k "node server/server.js"

echo Starting Vite Frontend on http://localhost:5173...
start "QuizPulse Frontend" cmd /k "npx vite --host"

echo ----------------------------------------------------
echo QuizPulse Full-Stack App Launched!
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:5000
echo Database:  Supabase (PostgreSQL)
echo ----------------------------------------------------
