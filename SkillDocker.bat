@echo off
title SkillDocker Desktop App
cd /d "%~dp0"

:: 1. Ensure local Vite bridge server is active on port 1420
netstat -ano | findstr :1420 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo Starting SkillDocker Dev Server...
    start "SkillDocker-Server" /min cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
)

:: 2. Launch standalone frameless desktop window
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:1420" --window-size=1250,880

exit
