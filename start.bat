@echo off
rem Start het TISP Teamportaal: dubbelklik op dit bestand.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is niet geinstalleerd. Installeer de LTS-versie via https://nodejs.org en probeer opnieuw.
  pause
  exit /b 1
)
start "" http://localhost:8000
node server\server.js
pause
