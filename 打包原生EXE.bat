@echo off
title SkillDocker Native Build
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-exe.ps1"
pause
