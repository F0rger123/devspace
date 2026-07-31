import JSZip from 'jszip';

export interface PackageOptions {
  os: 'win' | 'mac' | 'linux';
  packageFormat?: 'bat' | 'ps1' | 'zip' | 'html' | 'command' | 'sh';
  userName: string;
  userEmail: string;
  localDbPath: string;
  globalHotkey: string;
  syncInterval: string;
  appOrigin: string;
  selectedOllamaModel?: string;
  ollamaHost?: string;
}

export function buildWindowsInstallerScript(): string {
  return `@echo off
TITLE DevSpace Aether Desktop - Windows Installer Builder v2.5.0
COLOR 0E
CLS

echo =========================================================================
echo   ⚡ DevSpace Aether Desktop - Native Windows Setup.exe Builder v2.5.0
echo =========================================================================
echo.
echo   This script compiles the React frontend, builds the Electron main process,
echo   and generates the standalone offline NSIS installer (Setup.exe) using
echo   electron-builder.
echo.
echo =========================================================================
echo.

echo   [1/4] Checking Node.js and npm environment...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ ERROR: Node.js is not installed or not in PATH.
    echo      Please install Node.js (v18+) from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

echo   [2/4] Installing project dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo   [3/4] Compiling React application and Electron main scripts...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ ERROR: React frontend build failed.
    pause
    exit /b 1
)

call npm run build:electron
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ ERROR: Electron scripts build failed.
    pause
    exit /b 1
)

echo.
echo   [4/4] Building Windows NSIS Setup Installer (DevSpace Aether Desktop Setup 2.5.0.exe)...
call npx electron-builder --win nsis --x64
if %ERRORLEVEL% NEQ 0 (
    echo   ❌ ERROR: electron-builder failed to create the Windows NSIS installer.
    pause
    exit /b 1
)

echo.
echo =========================================================================
echo   ✅ BUILD SUCCESSFUL!
echo =========================================================================
echo.
echo   Your native Windows setup installer has been generated at:
echo   release\\DevSpace Aether Desktop Setup 2.5.0.exe
echo.
echo   You can now run "release\\DevSpace Aether Desktop Setup 2.5.0.exe" to install
echo   DevSpace as a native Windows desktop application.
echo =========================================================================
echo.
pause
`;
}

export function buildPowerShellInstallerScript(): string {
  return `# =========================================================================
# DevSpace Aether Desktop - Windows Installer Builder (PowerShell)
# =========================================================================

Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host "  ⚡ DevSpace Aether Desktop - Native Windows Setup.exe Builder v2.5.0" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "  [1/4] Checking Node.js environment..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ❌ ERROR: Node.js is not installed. Please install Node.js v18+ from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "  [2/4] Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ ERROR: npm install failed." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

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

Write-Host "  [4/4] Generating Windows NSIS Setup Installer..." -ForegroundColor Cyan
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
Write-Host "  Your installer is located at: release\\DevSpace Aether Desktop Setup 2.5.0.exe" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to finish..."
`;
}

export function buildReadmeInstructions(os: 'win' | 'mac' | 'linux', userName: string): string {
  if (os === 'win') {
    return `=========================================================================
  DevSpace Aether Desktop Setup Guide (Windows PC)
=========================================================================
User: ${userName}
Version: 2.5.0 (Native Offline Installer Builder)

INSTRUCTIONS TO GENERATE "DevSpace Aether Desktop Setup 2.5.0.exe":
-------------------------------------------------------------------------
1. Extract the downloaded ZIP package to a folder on your Windows computer.
2. Ensure Node.js (v18 or higher) is installed on your Windows machine.
3. Double-click "build-installer.bat" (or run "build-installer.ps1" in PowerShell).
4. The script will automatically:
   - Install all project dependencies
   - Compile the React web application
   - Compile the Electron desktop shell
   - Execute electron-builder NSIS target
5. Locate the generated native installer at:
   "release\\DevSpace Aether Desktop Setup 2.5.0.exe"
6. Run "DevSpace Aether Desktop Setup 2.5.0.exe" to install DevSpace directly
   onto your Windows PC as a native standalone Electron desktop app.
`;
  }

  return `=========================================================================
  DevSpace Aether Desktop Setup Guide
=========================================================================
User: ${userName}
Version: 2.5.0

INSTRUCTIONS:
1. Extract the package on your build machine.
2. Run "npm install && npm run build && npm run build:electron".
3. Run "npx electron-builder" to build the native desktop binary.
`;
}

export async function generateInstallerPackage(opts: PackageOptions): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  const { 
    os, 
    userName, 
    userEmail, 
    localDbPath, 
    globalHotkey, 
    syncInterval, 
    selectedOllamaModel = 'qwen2.5-coder:7b',
    ollamaHost = 'http://localhost:11434'
  } = opts;

  const configContent = JSON.stringify({
    userName,
    userEmail,
    localDbPath,
    globalHotkey,
    syncInterval,
    selectedOllamaModel,
    ollamaHost,
    version: '2.5.0',
    installedAt: new Date().toISOString()
  }, null, 2);

  if (os === 'win') {
    const batContent = buildWindowsInstallerScript();
    const ps1Content = buildPowerShellInstallerScript();
    const readme = buildReadmeInstructions('win', userName);

    const zip = new JSZip();
    zip.file('build-installer.bat', batContent);
    zip.file('build-installer.ps1', ps1Content);
    zip.file('config.json', configContent);
    zip.file('README-Windows-Setup.txt', readme);

    const blob = await zip.generateAsync({ type: 'blob' });
    return {
      blob,
      fileName: `DevSpace-Aether-Desktop-Setup-Windows.zip`,
      mimeType: 'application/zip'
    };
  }

  const readme = buildReadmeInstructions(os, userName);
  const zip = new JSZip();
  zip.file('config.json', configContent);
  zip.file('README.txt', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    fileName: `DevSpace-Aether-Desktop-Package.zip`,
    mimeType: 'application/zip'
  };
}
