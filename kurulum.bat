@echo off
setlocal
cd /d "%~dp0"

echo [Logbot V5 Java] Java ve Maven kontrol ediliyor...
where java >nul 2>nul
if errorlevel 1 (
  echo Java 19 veya daha yenisi bulunamadi. https://adoptium.net/
  pause
  exit /b 1
)
where mvn >nul 2>nul
if errorlevel 1 (
  echo Maven bulunamadi. https://maven.apache.org/download.cgi
  pause
  exit /b 1
)
echo [Logbot V5 Java] Java bot derleniyor...
call mvn -q package -DskipTests
if errorlevel 1 (
  echo Java bot kurulumu basarisiz oldu.
  pause
  exit /b 1
)
if not exist ".env" copy /y ".env.example" ".env" >nul
echo Kurulum tamamlandi. .env icine DISCORD_TOKEN ekleyip baslat.bat dosyasini calistir.
pause
endlocal
