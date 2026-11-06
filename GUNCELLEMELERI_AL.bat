@echo off
title FabricTag - Guvenli Surum Guncelleme
color 0B
echo =======================================================
echo    FABRICTAG - GUVENLI SURUM GUNCELLEME
echo =======================================================
echo.
cd /d "%~dp0"

echo [1/3] Kumas veritabaniniz yedekleniyor...
if not exist "backups" mkdir "backups"
if exist "database.db" (
    copy /Y "database.db" "backups\database_guncelleme_oncesi_yedek.db" >nul
    echo       Canli kumas veritabaniniz backups altina guvenle yedeklendi.
)

echo.
echo [2/3] GitHub baglantisi kontrol ediliyor ve guncellemeler cekiliyor...
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch origin --prune

:: Yerel dosyalari stasla ve fabrictag dalina sifirla
git stash >nul 2>&1
git checkout fabrictag >nul 2>&1
git reset --hard origin/fabrictag

:: Veritabanini geri koy
if exist "backups\database_guncelleme_oncesi_yedek.db" (
    copy /Y "backups\database_guncelleme_oncesi_yedek.db" "database.db" >nul
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo [BASARILI] FabricTag basariyla en guncel surume yuklendi!
    echo Kumas veritabaniniz (database.db) KORUNDU ve etkilenmedi.
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo [UYARI] Guncelleme sirasinda bir baglanti sorunu yasandi.
    echo Internet baglantinizi kontrol edin.
    echo =======================================================
)

echo.
pause
