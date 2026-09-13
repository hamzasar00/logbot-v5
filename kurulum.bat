@echo off
setlocal
cd /d "%~dp0"

echo [Logbot V5] Node.js ve pnpm kontrol ediliyor...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 veya daha yenisini kurman gerekiyor: https://nodejs.org/
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm bulunamadi. Corepack etkinlestiriliyor...
  corepack enable
  corepack prepare pnpm@10.26.1 --activate
)

echo [Logbot V5] Bagimliliklar kuruluyor...
call pnpm install
if errorlevel 1 (
  echo Bagimlilik kurulumu basarisiz oldu.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  echo .env dosyasi olusturuldu. DISCORD_TOKEN degerini gir.
)

echo Kurulum tamamlandi. Botu baslatmak icin baslat.bat dosyasini calistir.
pause
endlocal