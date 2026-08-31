@echo off
chcp 65001 >nul
title FabricTag Desktop Shortcut Creator

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\FabricTag.lnk'); $s.TargetPath = '%~dp0FabricTag\FabricTag.exe'; $s.WorkingDirectory = '%~dp0FabricTag'; $s.IconLocation = '%~dp0FabricTag\icon.ico, 0'; $s.Description = 'FabricTag - Smart Fabric Swatch & Hanger AI'; $s.Save()"

echo.
echo ============================================================
echo   FabricTag Desktop Shortcut Created Successfully!
echo ============================================================
echo.
pause
