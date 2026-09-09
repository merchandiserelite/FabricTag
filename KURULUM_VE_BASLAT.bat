@echo off
title TexFlow - Kurulum ve Baslatma
color 0B
echo =======================================================
echo    TEXFLOW - ILK KURULUM VE SISTEMI BASLATMA
echo =======================================================
cd /d "%~dp0"
echo [1/2] Gerekli Python kutuphaneleri yukleniyor...
python -m pip install -r requirements.txt
echo.
echo [2/2] TexFlow baslatiliyor...
python start_server.py
pause
