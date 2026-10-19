@echo off
title FabricTag - GitHub Surum Guncelleme
color 0b
echo ============================================================
echo   FabricTag - GitHub'a En Son Surumu Gonderme (Push)
echo ============================================================
echo.
cd /d "%~dp0"
echo [1/2] GitHub'a baglaniyor ve surum yukleniyor...
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo [BASARILI] En son FabricTag v4.3.3 GitHub'a basariyla yuklendi!
    echo Artik tum kullanicilarinizin ekranina guncelleme bildirimi gidecektir.
    echo ============================================================
) else (
    echo.
    echo [BILGI] Eger tarayici onayi istendiyse lutfen acilan pencereden GitHub onayini verin.
)
echo.
pause
