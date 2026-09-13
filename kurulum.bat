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
  echo pnpm bulunamadi. npm ile kuruluyor...
  where npm >nul 2>nul
  if errorlevel 1 (
    echo npm bulunamadi. Node.js kurulumu eksik olabilir.
    pause
    exit /b 1
  )
  call npm install --global pnpm@10.26.1
  if errorlevel 1 (
    echo pnpm kurulumu basarisiz oldu.
    pause
    exit /b 1
  )
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