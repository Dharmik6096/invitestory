@echo off
echo ==================================================
echo    InviteStory Auto-Sync ^& Vercel Deployment
echo ==================================================

python "%~dp0sync-to-vercel.py"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Sync or deployment encountered an error.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [DONE] Auto-Sync and Deployment Completed Successfully!
pause
