@echo off
REM ========================================
REM Liste des fichiers qui seront supprimes
REM ========================================

echo.
echo ========================================
echo FICHIERS QUI SERONT SUPPRIMES
echo ========================================
echo.

echo BACKEND OBSOLETES:
echo.
if exist gestures_server.py (echo   [X] gestures_server.py) else (echo   [ ] gestures_server.py - Deja supprime)
if exist calibration.py (echo   [X] calibration.py) else (echo   [ ] calibration.py - Deja supprime)
if exist config.example.py (echo   [X] config.example.py) else (echo   [ ] config.example.py - Deja supprime)
if exist test_gestures.py (echo   [X] test_gestures.py) else (echo   [ ] test_gestures.py - Deja supprime)
if exist server_v2.py (echo   [X] server_v2.py) else (echo   [ ] server_v2.py - Deja supprime)
echo.

echo FRONTEND OBSOLETES:
echo.
if exist src\App.jsx (echo   [X] src\App.jsx) else (echo   [ ] src\App.jsx - Deja supprime)
if exist src\App.css (echo   [X] src\App.css) else (echo   [ ] src\App.css - Deja supprime)
if exist src\AppV2.jsx (echo   [X] src\AppV2.jsx) else (echo   [ ] src\AppV2.jsx - Deja supprime)
if exist src\AppV3.jsx (echo   [X] src\AppV3.jsx) else (echo   [ ] src\AppV3.jsx - Deja supprime)
if exist src\main_v3.jsx (echo   [X] src\main_v3.jsx) else (echo   [ ] src\main_v3.jsx - Deja supprime)
if exist src\main_premium.jsx (echo   [X] src\main_premium.jsx) else (echo   [ ] src\main_premium.jsx - Deja supprime)
echo.

echo DOCUMENTATION TEMPORAIRE (optionnel):
echo.
if exist CHANGELOG.md (echo   [X] CHANGELOG.md) else (echo   [ ] CHANGELOG.md - Deja supprime)
if exist RESTART_V3.md (echo   [X] RESTART_V3.md) else (echo   [ ] RESTART_V3.md - Deja supprime)
if exist ACTIVER_PREMIUM.md (echo   [X] ACTIVER_PREMIUM.md) else (echo   [ ] ACTIVER_PREMIUM.md - Deja supprime)
if exist DEBUG_NO_MOVEMENT.md (echo   [X] DEBUG_NO_MOVEMENT.md) else (echo   [ ] DEBUG_NO_MOVEMENT.md - Deja supprime)
echo.

echo ========================================
echo.
echo Pour supprimer ces fichiers, lance:
echo   cleanup.bat
echo.
echo Pour faire un backup avant, lance:
echo   backup_before_cleanup.bat
echo.
pause
