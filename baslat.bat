@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo .env dosyasi bulunamadi. Once kurulum.bat dosyasini calistir.
  pause
  exit /b 1
)
where java >nul 2>nul
if errorlevel 1 (
  echo Java bulunamadi.
  pause
  exit /b 1
)
where mvn >nul 2>nul
if errorlevel 1 (
  echo Maven bulunamadi.
  pause
  exit /b 1
)
echo [Logbot V5 Java] Bot derleniyor...
call mvn -q package -DskipTests
if errorlevel 1 (
  echo Java bot derlemesi basarisiz oldu.
  pause
  exit /b 1
)
echo [Logbot V5 Java] Bot baslatiliyor...
call java -jar target\logbot-v5-java-1.0.0.jar
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [Logbot V5 Java] Bot durdu. Cikis kodu: %EXIT_CODE%
pause
endlocal
