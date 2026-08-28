@echo off
chcp 65001 >nul
title FabricTag - GitHub Bulut Yedekleme
echo ============================================================
echo        FabricTag - GitHub Bulut Yedekleme Baslatiliyor
echo ============================================================
echo.
cd /d "C:\Users\ASLI CELIK\.gemini\antigravity\scratch\fabric-label-system"
echo Kodlar GitHub ozel kasaniza gonderiliyor...
echo (Eger ilk kez yukleme yapiyorsaniz acilacak tarayici penceresinde onay verin)
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo [BASARILI] Tum kodlariniz GitHub ozel kasaniza yuklendi!
    echo ============================================================
) else (
    echo ============================================================
    echo [UYARI] Bir hata olustu veya giris iptal edildi.
    echo ============================================================
)
echo.
pause
