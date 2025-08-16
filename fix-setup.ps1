# This script fixes line endings in setup.ps1

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
            } else {
                Write-Host "File already has correct line endings." -ForegroundColor Green
            }
        } catch {
            Write-Host "Warning: Could not check/fix line endings in $FilePath" -ForegroundColor Yellow
        }
    }
}

# Fix line endings in setup.ps1
Fix-LineEndings -FilePath "setup.ps1"

# Also fix the string with backticks
$content = Get-Content -Path "setup.ps1" -Raw
$content = $content -replace 'Write-Host "Or run the demo with', 'Write-Host "Or run the demo with `'
$content = $content -replace "run-demo.ps1'\"", "run-demo.ps1`\""
$content | Set-Content -Path "setup.ps1" -NoNewline
Add-Content -Path "setup.ps1" -Value ""  # Add final newline

Write-Host "setup.ps1 has been fixed." -ForegroundColor Green
