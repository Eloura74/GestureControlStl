@echo off
REM Lanceur V3.0 avec encodage UTF-8 pour Windows

echo ========================================
echo HOLO-CONTROL V3.0 - Launcher
echo ========================================

REM Activer UTF-8 dans la console
chcp 65001 > nul

REM Activer environnement virtuel si existe
if exist .venv310\Scripts\activate.bat (
    echo [*] Activation environnement virtuel...
    call .venv310\Scripts\activate.bat
) else (
    echo [!] .venv310 introuvable, utilisation Python global
)

REM Définir encodage UTF-8 pour Python
set PYTHONIOENCODING=utf-8

REM Lancer serveur V3
echo [*] Lancement serveur V3.0...
echo.
python server_v3.py

pause
