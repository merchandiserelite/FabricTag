@echo off
title TexFlow - Guvenli Surum Guncelleme
color 0B
echo =======================================================
echo    TEXFLOW - GUVENLI SURUM GUNCELLEME (SIRKET ICIN)
echo =======================================================
echo.
cd /d "%~dp0"

echo [1/4] Veritabani guvenlik kontrolu ve otomatik yedekleme...
if not exist "data\backups" mkdir "data\backups"
if exist "data\texflow.db" (
    copy /Y "data\texflow.db" "data\backups\texflow_guncelleme_oncesi_yedek.db" >nul
    echo       Canli sirket veritabani data\backups altina yedeklendi.
)

echo.
echo [2/4] GitHub'dan guncel kodlar cekiliyor...
git fetch origin texflow
git pull origin texflow

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/4] Gereksinimler kontrol ediliyor...
    python -m pip install -r requirements.txt --quiet
    echo.
    echo =======================================================
    echo [BASARILI] Kodlar basariyla guncellendi!
    echo Sirket veritabaniniz (data\texflow.db) KORUNDU ve etkilenmedi.
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo [UYARI] Git cekme sirasinda cakisma olustu.
    echo Yedeginiz data\backups klasorunde guvendedir.
    echo =======================================================
)

echo.
pause
