@echo off
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
echo   release\DevSpace Aether Desktop Setup 2.5.0.exe
echo.
echo   You can now run "release\DevSpace Aether Desktop Setup 2.5.0.exe" to install
echo   DevSpace as a native Windows desktop application.
echo =========================================================================
echo.
pause
