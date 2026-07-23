@echo off
cd /d "%~dp0"
chcp 65001 >nul
title Well Logging Training Platform
powershell -NoLogo -ExecutionPolicy Bypass -File "%~dp0start.ps1"
pause
