@echo off
title Web App WAKA III MMD Darussalamah
color 0b
echo ===================================================================
echo           MENJALANKAN WEB APP WAKA III MMD DARUSSALAMAH
echo ===================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [!] PERINGATAN: Node.js belum terpasang di sistem Windows laptop Anda.
    echo.
    echo Silakan unduh dan pasang Node.js (pilih versi LTS) dari link resmi:
    echo   https://nodejs.org/
    echo.
    echo Setelah selesai memasang Node.js, cukup klik ganda (double-click)
    echo kembali file ini untuk menjalankan aplikasi secara otomatis.
    echo ===================================================================
    pause
    exit /b
)

echo [*] Server sedang dijalankan...
echo [*] Membuka web di browser Anda (http://localhost:3000)...
timeout /t 2 >nul
start "" http://localhost:3000
npm run dev
pause
