@echo off
chcp 65001 >nul
title FabricTag - Durdur
color 0C

echo ================================================================
echo           FabricTag - SISTEMI DURDURMA ARACI
echo ================================================================
echo.
echo Port 8000 ve calisan FabricTag sunucusu sonlandiriliyor...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)
taskkill /f /im python.exe >nul 2>&1

echo.
echo [OK] FabricTag basariyla durduruldu ve portlar temizlendi.
timeout /t 2 >nul
