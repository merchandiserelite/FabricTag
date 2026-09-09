@echo off
chcp 65001 >nul
echo [FabricTag] Masaustu Kisayolu Olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\FabricTag.lnk'); $s.TargetPath = '%~dp0FabricTag.exe'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0icon.ico'; $s.Description = 'FabricTag Akilli Kumas Kartela Sistemi'; $s.Save();"
echo.
echo ============================================================
echo   Masaustune FabricTag kisayolu basariyla eklendi!
echo   Artik programi masaustunuzdeki FabricTag simgesine 
echo   cift tiklayarak baslatabilirsiniz.
echo ============================================================
echo.
pause
