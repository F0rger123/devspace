# =========================================================================
# DevSpace Aether Desktop - Windows Installer Builder (PowerShell Script)
# =========================================================================

Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host "  ⚡ DevSpace Aether Desktop - Native Windows Setup.exe Builder v2.5.0" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check Node.js
Write-Host "  [1/4] Checking Node.js environment..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ❌ ERROR: Node.js is not installed. Please install Node.js v18+ from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# Step 2: Install Dependencies
Write-Host "  [2/4] Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ ERROR: npm install failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# Step 3: Build Web and Electron
Write-Host "  [3/4] Building React app and Electron scripts..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ ERROR: npm run build failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ ERROR: npm run build:electron failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# Step 4: Build NSIS Setup.exe
Write-Host "  [4/4] Generating Windows NSIS Installer..." -ForegroundColor Cyan
npx electron-builder --win nsis --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ ERROR: electron-builder failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "  ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "  Your installer is located at: release\DevSpace Aether Desktop Setup 2.5.0.exe" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to finish..."
