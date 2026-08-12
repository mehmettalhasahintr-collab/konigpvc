@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo Node.js 20+ gerekli. && pause && exit /b 1)

REM Port 3000'de eski KÖNİG sunucusu varsa kapat.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F >nul 2>&1
)

start "KONIG Platform" cmd /k "cd /d ""%~dp0"" && node server.js"
timeout /t 2 >nul
start "" http://localhost:3000
