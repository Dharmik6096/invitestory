# PowerShell Auto-Sync & Vercel Deployment Script
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   InviteStory Auto-Sync & Vercel Deployment      " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

try {
    python "$ScriptDir\sync-to-vercel.py"
    Write-Host "`n[SUCCESS] All data synced and deployed to Vercel!" -ForegroundColor Green
} catch {
    Write-Host "`n[ERROR] Sync failed: $_" -ForegroundColor Red
    exit 1
}
