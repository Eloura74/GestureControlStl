@echo off
REM ========================================
REM HOLO-CONTROL - Backup Avant Nettoyage
REM ========================================

echo.
echo ========================================
echo BACKUP PROJET
echo ========================================
echo.
echo Creation d'une sauvegarde complete...
echo.

set BACKUP_DIR=..\holo-control-backup-%DATE:~-4%%DATE:~3,2%%DATE:~0,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

echo Destination: %BACKUP_DIR%
echo.

xcopy /E /I /H /Y . "%BACKUP_DIR%"

echo.
echo ========================================
echo BACKUP TERMINE !
echo ========================================
echo.
echo Sauvegarde creee dans: %BACKUP_DIR%
echo.
echo Vous pouvez maintenant lancer: cleanup.bat
echo.
pause
