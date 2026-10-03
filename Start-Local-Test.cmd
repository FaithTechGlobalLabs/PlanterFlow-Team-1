@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\start-local-test.ps1"
pause
