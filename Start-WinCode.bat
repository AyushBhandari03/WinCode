@echo off
setlocal

set "BACKEND_DIR=D:\Projects\WinCode\backend"
set "FRONTEND_DIR=D:\Projects\WinCode\frontend"

if not exist "%BACKEND_DIR%\package.json" (
	echo Backend path not found: %BACKEND_DIR%
	pause
	exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
	echo Frontend path not found: %FRONTEND_DIR%
	pause
	exit /b 1
)

echo Starting backend (npm run dev)...
start "WinCode Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm.cmd run dev"

echo Starting frontend (npm start)...
start "WinCode Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && set BROWSER=none && npm.cmd start"

echo Waiting for frontend to boot...
timeout /t 6 /nobreak >nul

start "" "http://localhost:3000"

endlocal
