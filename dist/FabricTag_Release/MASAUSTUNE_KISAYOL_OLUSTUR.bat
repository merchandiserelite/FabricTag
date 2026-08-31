@echo off
chcp 65001 >nul
title FabricTag Masaustu Kisayol Olusturucu

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\FabricTag.lnk'); $s.TargetPath = '%~dp0FabricTag\FabricTag.exe'; $s.WorkingDirectory = '%~dp0FabricTag'; $s.IconLocation = '%~dp0FabricTag\icon.ico, 0'; $s.Description = 'FabricTag - Akıllı Kumaş Kartela ve Etiket Sistemi'; $s.Save()"

echo.
echo ============================================================
echo   FabricTag Masaustu Kisayolu Basariyla Olusturuldu!
echo ============================================================
echo.
echo Masaustunuzdeki 'FabricTag' simgesine cift tiklayarak baslatabilirsiniz.
echo.
pause
