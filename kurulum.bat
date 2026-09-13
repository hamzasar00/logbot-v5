@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 veya daha yenisini kurman gerekiyor: https://nodejs.org/
  exit /b 1
)
where pnpm >nul 2>nul
if errorlevel 1 (
  corepack enable
  corepack prepare pnpm@10.26.1 --activate
)
call pnpm install
if errorlevel 1 exit /b 1
if not exist ".env" copy /y ".env.example" ".env" >nul
echo Kurulum tamamlandi. .env icine DISCORD_TOKEN ekleyip baslat.bat dosyasini calistir.
endlocal
