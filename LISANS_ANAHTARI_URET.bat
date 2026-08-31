@echo off
chcp 65001 >nul
title FabricTag Lisans Anahtari Uretici
cls
python "%~dp0tools\license_generator.py"
pause
