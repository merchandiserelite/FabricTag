@echo off
title TexFlow - Sadece Bana Ozel Gelistirme Kaydet
color 0B
echo ================================================================
echo    TEXFLOW - OZEL GELISTIRME KAYDETME (MUSTERILERE GITMEZ)
echo ================================================================
echo.
echo Bu islem yapilan degisiklikleri yalnizca 'texflow' gelistirici
echo daliniza yukler. Musteriler bunu GORMEZ ve guncelleme ALMAZ.
echo.
cd /d "%~dp0"
set /p NOT=Gelistirme aciklamasi / notunuz: 
if "%NOT%"=="" set NOT=Gelistirici ozel calismasi

echo.
echo [1/2] Dosyalar hazirlaniyor...
git add .

echo [2/2] GitHub texflow dalina gonderiliyor...
git commit -m "dev: %NOT%"
git push origin texflow

echo.
echo ================================================================
echo [BASARILI] Ozel gelistirmeleriniz GitHub texflow dalinda saklandi!
echo Musteriler 'main' dalinda oldugu icin bu degisiklikleri gormez.
echo ================================================================
echo.
pause
