@echo off
setlocal
cd /d "%~dp0"
if not exist ".env" (
  echo .env dosyasi bulunamadi. Once kurulum.bat dosyasini calistir.
  exit /b 1
)
call pnpm start
endlocal
