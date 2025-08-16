# UpSkill Node.js and npm Installation Script
# This script helps install Node.js and npm on Windows systems

Write-Host "UpSkill Node.js and npm Installation Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is already installed
$nodeInstalled = $false
try {
    $nodeVersion = node -v
    $nodeInstalled = $true
    Write-Host "Node.js is already installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in PATH" -ForegroundColor Yellow
}

# Check if npm is already installed
$npmInstalled = $false
try {
    $npmVersion = npm -v
    $npmInstalled = $true
    Write-Host "npm is already installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in PATH" -ForegroundColor Yellow
}

# If both are installed, exit early
if ($nodeInstalled -and $npmInstalled) {
    Write-Host ""
    Write-Host "Node.js and npm are already installed. You can now run the setup script:" -ForegroundColor Green
    Write-Host ".\setup.ps1" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "This script will help you install Node.js and npm on your Windows system." -ForegroundColor Cyan
Write-Host ""

# Offer installation options
Write-Host "Installation Options:" -ForegroundColor Cyan
Write-Host "1. Download and install Node.js manually (recommended)" -ForegroundColor White
Write-Host "2. Use winget to install Node.js (requires Windows 10 or later with winget installed)" -ForegroundColor White
Write-Host "3. Use Chocolatey to install Node.js (requires Chocolatey package manager)" -ForegroundColor White
Write-Host ""

$option = Read-Host "Select an option (1-3)"

switch ($option) {
    "1" {
        # Manual installation
        Write-Host ""
        Write-Host "Manual Installation Steps:" -ForegroundColor Cyan
        Write-Host "1. Visit https://nodejs.org/en/download/" -ForegroundColor White
        Write-Host "2. Download the Windows Installer (.msi) for the LTS version" -ForegroundColor White
        Write-Host "3. Run the installer and follow the installation wizard" -ForegroundColor White
        Write-Host "4. Restart your PowerShell or command prompt after installation" -ForegroundColor White
        Write-Host "5. Run the setup script with: .\setup.ps1" -ForegroundColor White
        
        # Ask if user wants to open the download page
        $openBrowser = Read-Host "Would you like to open the Node.js download page now? (y/n)"
        if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
            Start-Process "https://nodejs.org/en/download/"
            Write-Host "Download page opened in your browser." -ForegroundColor Green
        }
    }
    "2" {
        # Winget installation
        Write-Host ""
        Write-Host "Installing Node.js using winget..." -ForegroundColor Cyan
        
        try {
            # Check if winget is available
            $wingetCheck = winget -v
            
            # Install Node.js using winget
            Write-Host "Running: winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
            winget install OpenJS.NodeJS.LTS
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Node.js has been installed successfully!" -ForegroundColor Green
                Write-Host "Please restart your PowerShell or command prompt, then run:" -ForegroundColor Green
                Write-Host ".\setup.ps1" -ForegroundColor Cyan
            } else {
                Write-Host ""
                Write-Host "Installation failed. Please try the manual installation option." -ForegroundColor Red
            }
        } catch {
            Write-Host ""
            Write-Host "Error: winget is not available on your system." -ForegroundColor Red
            Write-Host "Please use the manual installation option instead." -ForegroundColor Yellow
        }
    }
    "3" {
        # Chocolatey installation
        Write-Host ""
        Write-Host "Installing Node.js using Chocolatey..." -ForegroundColor Cyan
        
        try {
            # Check if Chocolatey is available
            $chocoCheck = choco -v
            
            # Install Node.js using Chocolatey
            Write-Host "Running: choco install nodejs-lts -y" -ForegroundColor Yellow
            choco install nodejs-lts -y
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Node.js has been installed successfully!" -ForegroundColor Green
                Write-Host "Please restart your PowerShell or command prompt, then run:" -ForegroundColor Green
                Write-Host ".\setup.ps1" -ForegroundColor Cyan
            } else {
                Write-Host ""
                Write-Host "Installation failed. Please try the manual installation option." -ForegroundColor Red
            }
        } catch {
            Write-Host ""
            Write-Host "Error: Chocolatey is not available on your system." -ForegroundColor Red
            Write-Host "Please use the manual installation option instead." -ForegroundColor Yellow
        }
    }
    default {
        Write-Host ""
        Write-Host "Invalid option. Please run the script again and select a valid option (1-3)." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "After installing Node.js and npm:" -ForegroundColor Cyan
Write-Host "1. Restart your PowerShell or command prompt" -ForegroundColor White
Write-Host "2. Verify installation with: node -v and npm -v" -ForegroundColor White
Write-Host "3. Run the UpSkill setup script: .\setup.ps1" -ForegroundColor White
Write-Host ""