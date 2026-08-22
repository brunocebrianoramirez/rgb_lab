@echo off
title rgb_lab - servidor local
cd /d "%~dp0"
echo.
echo   Iniciando o rgb_lab...
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js nao encontrado.
  echo   Instale em https://nodejs.org  e rode este arquivo de novo.
  echo.
  pause
  exit /b
)
start "" http://localhost:5173
node server.js 5173
pause
