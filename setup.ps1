# UpSkill Setup Script
# This script helps set up the UpSkill application
#
# Note: If you encounter execution policy restrictions, try one of these options:
#   1. Run PowerShell as Administrator and execute: Set-ExecutionPolicy RemoteSigned
#   2. Run this script with: powershell -ExecutionPolicy Bypass -File setup.ps1
#   3. Right-click the script, select "Run with PowerShell" and confirm any security prompts

Write-Host "UpSkill Setup Script" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Check for execution policy restrictions
try {
    $policy = Get-ExecutionPolicy
    if ($policy -eq "Restricted" -or $policy -eq "AllSigned") {
        Write-Host "Warning: Your PowerShell execution policy is set to $policy" -ForegroundColor Yellow
        Write-Host "This may prevent scripts from running. If you encounter issues, try:" -ForegroundColor Yellow
        Write-Host "  - Run PowerShell as Administrator and execute: Set-ExecutionPolicy RemoteSigned" -ForegroundColor Yellow
        Write-Host "  - Run this script with: powershell -ExecutionPolicy Bypass -File setup.ps1" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    # Silently continue if we can't check the execution policy
}

# Check for and fix line ending issues that might occur when pulling from Git
function Fix-LineEndings {
    param (
        [string]$FilePath
    )

    if (Test-Path $FilePath) {
        try {
            # Read the file content
            $content = Get-Content -Path $FilePath -Raw

            # Check if the file has Unix-style line endings (LF only)
            if ($content -match "`n" -and $content -notmatch "`r`n") {
                Write-Host "Fixing line endings in $FilePath..." -ForegroundColor Yellow

                # Convert LF to CRLF for Windows
                $content = $content -replace "`n", "`r`n"

                # Write the content back to the file
                $content | Set-Content -Path $FilePath -NoNewline
                Add-Content -Path $FilePath -Value ""  # Add final newline

                Write-Host "Line endings fixed." -ForegroundColor Green
            }
        } catch {
            Write-Host "Warning: Could not check/fix line endings in $FilePath" -ForegroundColor Yellow
        }
    }
}

# Fix line endings in common script files
if (Test-Path "run-demo.ps1") {
    Fix-LineEndings -FilePath "run-demo.ps1"
}
if (Test-Path "verify-demo.ps1") {
    Fix-LineEndings -FilePath "verify-demo.ps1"
}

# Check if we're in the correct directory by looking for key files
$inCorrectDirectory = (Test-Path "package.json") -and (Test-Path "next.config.js")

if (-not $inCorrectDirectory) {
    # We might be in the parent directory, try to find the upskill directory
    if (Test-Path "upskill") {
        Write-Host "Navigating to upskill directory..." -ForegroundColor Yellow
        Set-Location -Path "upskill"

        # Verify we're now in the correct directory
        if (-not ((Test-Path "package.json") -and (Test-Path "next.config.js"))) {
            Write-Host "Error: Could not find the necessary files in the upskill directory." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Error: Not in the correct directory and couldn't find an upskill directory." -ForegroundColor Red
        Write-Host "Please run this script from the directory containing package.json and next.config.js" -ForegroundColor Yellow
        Write-Host "or from its parent directory if it contains an 'upskill' subdirectory." -ForegroundColor Yellow
        exit 1
    }
}

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/ (version 16.x or higher)" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm -v
    Write-Host "✓ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "npm should be installed with Node.js" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green

# Check if .env.local exists, if not create it from example
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "Setting up environment variables..." -ForegroundColor Cyan

    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" -Destination ".env.local"
        Write-Host "✓ Created .env.local from example file" -ForegroundColor Green
        Write-Host "Please edit .env.local to add your API keys" -ForegroundColor Yellow
    } else {
        Write-Host "✗ .env.local.example not found" -ForegroundColor Red
        # Create a basic .env.local file
        @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="UpSkill"
"@ | Out-File -FilePath ".env.local" -Encoding utf8

        Write-Host "✓ Created basic .env.local file" -ForegroundColor Green
        Write-Host "Please edit .env.local to add your API keys" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure you've added your API keys to .env.local"
Write-Host "2. Create a Supabase project and run the schema in lib/database/schema.sql"
Write-Host "3. Run 'npm run dev' to start the development server"
Write-Host "4. Open http://localhost:3000 in your browser"
Write-Host ""

$startNow = Read-Host "Would you like to start the development server now? (y/n)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host "Starting development server..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "You can start the server later with 'npm run dev'" -ForegroundColor Yellow
    Write-Host "Or run the demo with '.\run-demo.ps1'" -ForegroundColor Yellow
}
