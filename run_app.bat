@echo off
title Kumas Kartela Tarama & Etiket Sistemi
echo ========================================================
echo   Kumas Kartela Tarama ve Etiket Sistemi Baslatiliyor...
echo ========================================================
echo.
echo  Uygulamaya su adresten erisebilirsiniz:
echo  - Bu bilgisayardan: http://localhost:8000
echo.
echo  Telefonunuzdan veya baska bilgisayardan erismek icin:
echo  1. Bu bilgisayarin yerel IP adresini ogrenin (ipconfig yazarak)
echo  2. Telefonunuzun tarayicisina su sekilde girin: http://[IP_ADRESI]:8000
echo     (Ornek: http://192.168.1.50:8000)
echo.
echo  * NOT: Telefonunuzun ve bu bilgisayarin ayni Wi-Fi/Aga bagli
echo    oldugundan emin olun.
echo.
echo ========================================================
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000
pause
