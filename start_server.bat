@echo off
title Wedding Invitation Cards Server
echo =======================================================
echo   Starting Invitation Cards Local Web Server...
echo =======================================================
echo.
echo Opening browser at http://localhost:8080 ...
echo Press Ctrl+C in this window anytime to stop the server.
echo.

start "" "http://localhost:8080"
python -m http.server 8080
pause
