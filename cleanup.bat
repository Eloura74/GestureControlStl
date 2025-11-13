@echo off
REM ========================================
REM HOLO-CONTROL - Nettoyage Projet
REM Supprime fichiers obsoletes
REM ========================================

echo.
echo ========================================
echo NETTOYAGE PROJET HOLO-CONTROL
echo ========================================
echo.
echo Ce script va supprimer les fichiers obsoletes.
echo.
echo ATTENTION: Cette action est IRREVERSIBLE !
echo.
pause

echo.
echo [1/4] Suppression backend obsoletes...
if exist gestures_server.py del /Q gestures_server.py
if exist calibration.py del /Q calibration.py
if exist config.example.py del /Q config.example.py
if exist test_gestures.py del /Q test_gestures.py
if exist server_v2.py del /Q server_v2.py
echo OK

echo.
echo [2/4] Suppression frontend obsoletes...
if exist src\App.jsx del /Q src\App.jsx
if exist src\App.css del /Q src\App.css
if exist src\AppV2.jsx del /Q src\AppV2.jsx
if exist src\AppV3.jsx del /Q src\AppV3.jsx
if exist src\main_v3.jsx del /Q src\main_v3.jsx
if exist src\main_premium.jsx del /Q src\main_premium.jsx
echo OK

echo.
echo [3/4] Suppression docs temporaires (optionnel)...
if exist CHANGELOG.md del /Q CHANGELOG.md
if exist RESTART_V3.md del /Q RESTART_V3.md
if exist ACTIVER_PREMIUM.md del /Q ACTIVER_PREMIUM.md
if exist DEBUG_NO_MOVEMENT.md del /Q DEBUG_NO_MOVEMENT.md
echo OK

echo.
echo [4/4] Nettoyage termine !
echo.
echo ========================================
echo RESULTAT
echo ========================================
echo.
echo Fichiers supprimes:
echo   - Anciens serveurs (V1, V2)
echo   - Anciennes versions frontend (V1, V2, V3)
echo   - Documentation temporaire
echo.
echo Fichiers conserves:
echo   - server_v3.py (backend)
echo   - src/AppV3_Premium.jsx (frontend)
echo   - Tous les composants
echo   - Configuration
echo.
echo ========================================
echo.
echo PROCHAINE ETAPE:
echo   1. Teste le serveur: start_v3.bat
echo   2. Teste le frontend: npm run dev
echo   3. Si tout fonctionne: git commit
echo.
pause
