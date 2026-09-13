@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo .env dosyasi bulunamadi. Once kurulum.bat dosyasini calistir.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm bulunamadi. Once kurulum.bat dosyasini calistir.
  pause
  exit /b 1
)

echo [Logbot V5] Bot baslatiliyor...
call pnpm start
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [Logbot V5] Bot durdu. Cikis kodu: %EXIT_CODE%
pause
endlocal
