@echo off
chcp 65001 >nul
title FabricTag Setup Wizard (v4.1.0)
cls
echo =====================================================================
echo       FABRICTAG - GLOBAL SETUP WIZARD / KURULUM SİHİRBAZI
echo       Smart Fabric Swatch & Hanger AI Tag Management System
echo =====================================================================
echo.
echo [Step 1/3] Please select your language / Lütfen dilinizi seçin:
echo   1) 🇬🇧 English (EN) - Default
echo   2) 🇹🇷 Türkçe (TR)
echo   3) 🇩🇪 Deutsch (DE)
echo   4) 🇮🇹 Italiano (IT)
echo   5) 🇪🇸 Español (ES)
echo   6) 🇫🇷 Français (FR)
echo   7) 🇸🇦 العربية (AR)
echo   8) 🇨🇳 中文 (ZH)
echo   9) 🇯🇵 日本語 (JA)
echo.
set /p lang_choice="Select [1-9] (Default: 1): "
if "%lang_choice%"=="" set lang_choice=1

set desc="FabricTag - Smart Fabric Swatch & Hanger AI"
set def_lang=en
if "%lang_choice%"=="2" (
    set def_lang=tr
    set desc="FabricTag - Akıllı Kumaş Kartela ve Etiket Sistemi"
)
if "%lang_choice%"=="3" (
    set def_lang=de
    set desc="FabricTag - Intelligenter Stoffmuster- & Etiketten-Scanner"
)
if "%lang_choice%"=="4" (
    set def_lang=it
    set desc="FabricTag - Scanner per Cartelle e Campioni Tessuto"
)
if "%lang_choice%"=="5" (
    set def_lang=es
    set desc="FabricTag - Escáner de Muestras de Tela y Etiquetas"
)
if "%lang_choice%"=="6" (
    set def_lang=fr
    set desc="FabricTag - Scanner d'Échantillons de Tissu"
)
if "%lang_choice%"=="7" (
    set def_lang=ar
    set desc="FabricTag - نظام مسح كارتيلات الأقمشة الذكي"
)
if "%lang_choice%"=="8" (
    set def_lang=zh
    set desc="FabricTag - 智能面料样卡与标签识别系统"
)
if "%lang_choice%"=="9" (
    set def_lang=ja
    set desc="FabricTag - スマート生地見本＆ハンガーAIタグシステム"
)

echo.
echo ---------------------------------------------------------------------
echo [Step 2/3] Setting Up Backup Directory / Yedekleme Klasörü
echo ---------------------------------------------------------------------
set "def_backup=%USERPROFILE%\Documents\FabricTag_Backups"
echo Default Backup Location: %def_backup%
echo.
set /p user_backup="Custom backup path (or press Enter for default): "
if "%user_backup%"=="" set "user_backup=%def_backup%"

if not exist "%user_backup%" mkdir "%user_backup%" >nul 2>&1
echo --> Backup directory configured: %user_backup%

echo.
echo ---------------------------------------------------------------------
echo [Step 3/3] Creating Desktop Shortcut / Masaüstü Kısayolu Oluşturuluyor
echo ---------------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\FabricTag.lnk'); $s.TargetPath = '%~dp0FabricTag\FabricTag.exe'; $s.WorkingDirectory = '%~dp0FabricTag'; $s.IconLocation = '%~dp0FabricTag\icon.ico, 0'; $s.Description = '%desc%'; $s.Save()"

echo.
echo =====================================================================
echo   SETUP COMPLETED SUCCESSFULLY! / KURULUM TAMAMLANDI!
echo   Desktop shortcut created: 'FabricTag'
echo =====================================================================
echo.
set /p run_now="Start FabricTag now? / FabricTag başlatılsın mı? [Y/n]: "
if /i "%run_now%"=="n" goto end
start "" "%~dp0FabricTag\FabricTag.exe"
:end
