# UpSkill Setup Launcher
# This script navigates to the upskill directory and runs the setup script

Write-Host "UpSkill Setup Launcher" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Check if upskill directory exists
if (-not (Test-Path "upskill")) {
    Write-Host "Error: 'upskill' directory not found." -ForegroundColor Red
    Write-Host "Make sure you're running this script from the correct directory." -ForegroundColor Yellow
    exit 1
}

# Check if we're already in the upskill directory
$currentDir = Split-Path -Leaf (Get-Location)
$inUpskillDir = ($currentDir -eq "upskill") -and (Test-Path "package.json") -and (Test-Path "next.config.js")

if (-not $inUpskillDir) {
    # Navigate to upskill directory
    Write-Host "Navigating to upskill directory..." -ForegroundColor Yellow
    Set-Location -Path "upskill"
} else {
    Write-Host "Already in upskill directory." -ForegroundColor Green
}

# Check if setup.ps1 exists
if (-not (Test-Path "setup.ps1")) {
    Write-Host "Error: 'setup.ps1' not found in the upskill directory." -ForegroundColor Red
    Write-Host "The setup script may be missing or corrupted." -ForegroundColor Yellow
    exit 1
}

# Run the setup script
Write-Host "Starting the setup process..." -ForegroundColor Green
& .\setup.ps1

# Stay in the upskill directory after running the script
# This prevents issues with subsequent commands that assume we're still in the upskill directory