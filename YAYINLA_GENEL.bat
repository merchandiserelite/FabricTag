@echo off
title TexFlow - Tum Musteriler Icin Genel Surum Yayinla
color 0A
echo ================================================================
echo    TEXFLOW - GENEL SURUM YAYINLAMA (TUM MUSTERILER ICIN)
echo ================================================================
echo.
echo Bu islem 'texflow' gelistirici dalinizdaki onayli degisiklikleri
echo 'main' (Genel Dagitim) dalina aktaracak ve tum musterilerin
echo programina guncelleme olarak gonderecektir.
echo.
set /p ONAY=Tum musterilere yayinlamak istediginize emin misiniz? (E/H): 
if /I not "%ONAY%"=="E" (
    echo.
    echo Islem iptal edildi.
    pause
    exit /b
)

echo.
echo [1/2] GitHub uzerinde 'main' dalina aktariliyor...
cd /d "%~dp0"
git push origin texflow:main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo [BASARILI] Yeni surum genel yayina verildi!
    echo Tum musteriler programlarini actiklarinda guncellemeyi gorecektir.
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo [HATA] Yayinlama sirasinda bir sorun olustu.
    echo Internet baglantinizi ve Git durumunuzu kontrol edin.
    echo ================================================================
)

echo.
pause
