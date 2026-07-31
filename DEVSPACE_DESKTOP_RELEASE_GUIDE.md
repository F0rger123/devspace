# DevSpace Desktop: Milestone 2 Release Guide & Deployment Pipeline

This guide specifies the complete, end-to-end execution workflow for producing and publishing the first official **DevSpace Aether Desktop Windows Installer (`DevSpace Aether Desktop Setup 2.5.0.exe`)**, starting from Google AI Studio and ending with an end-user downloading and running `Setup.exe` from the website.

---

## Environment & Platform Key

| Symbol | Location | Environment Description |
|---|---|---|
| ☁️ **AI Studio** | Google AI Studio | Application development environment, code editing, and server runtime |
| 🐙 **GitHub** | GitHub Repository | Version control, release tag management, and secrets configuration |
| ⚙️ **GitHub Actions** | GitHub Actions Runner | Cloud CI/CD automation runner (`windows-latest` virtual machine) |
| 💻 **Windows** | Local Windows Workstation | Physical developer machine (alternative local build host) |
| 🌐 **Website** | DevSpace App / Server API | Production website (`/api/desktop/download/windows` endpoint & Download Wizard UI) |

---

## Complete Step-by-Step Release Checklist

### Step 1: Export & Push Codebase to GitHub
- **Location**: ☁️ **Google AI Studio** ➡️ 🐙 **GitHub**
- **Action**:
  1. Open the **Settings / Export** menu in Google AI Studio.
  2. Select **Export to GitHub** (or push to the remote repository `DevSpace-Aether-Desktop`).
  3. Ensure all native runtime files (`electron/main.ts`, `electron/preload.ts`, `package.json`, `.github/workflows/desktop-build.yml`) are committed to the `main` branch.

---

### Step 2: Configure Repository Permissions & Release Secrets
- **Location**: 🐙 **GitHub**
- **Action**:
  1. Navigate to **GitHub Repository Settings** ➡️ **Actions** ➡️ **General**.
  2. Under *Workflow permissions*, grant **Read and write permissions** (allowing GitHub Actions to create GitHub Releases and upload build assets).
  3. (Optional) If code signing with an EV certificate, add `WIN_CSC_LINK` (PFX base64 certificate) and `WIN_CSC_KEY_PASSWORD` to **Secrets and variables** ➡️ **Actions**.

---

### Step 3: Trigger Automated Desktop Release Build (CI/CD Pipeline)
- **Location**: 🐙 **GitHub** ➡️ ⚙️ **GitHub Actions**
- **Action**:
  1. Create and push a semver git release tag:
     ```bash
     git tag v2.5.0
     git push origin v2.5.0
     ```
  2. Alternatively, trigger the workflow manually under GitHub Actions tab ➡️ **DevSpace Desktop CI/CD Build Pipeline** ➡️ **Run workflow**.

---

### Step 4: GitHub Actions Automated Compilation (Headless Windows Build)
- **Location**: ⚙️ **GitHub Actions** (`windows-latest` runner)
- **Action**:
  - The GitHub Actions runner executes the automated workflow `.github/workflows/desktop-build.yml`:
    1. **Checkout**: Checks out source code.
    2. **Environment Setup**: Installs Node.js v20 with npm caching.
    3. **Dependency Resolution**: Runs `npm ci`.
    4. **Quality Gate**: Runs `npm run lint` (`tsc --noEmit`).
    5. **Web Build**: Runs `npm run build` (compiles Vite SPA to `dist/` and Express server to `dist/server.cjs`).
    6. **Electron Build**: Runs `npm run build:electron` (bundles `electron/main.ts` and `electron/preload.ts` with `esbuild` to `dist-electron/`).
    7. **NSIS Packaging**: Runs `npm run dist:win` (`electron-builder --win nsis`).
    8. **Binary Production**: Produces `release/DevSpace Aether Desktop Setup 2.5.0.exe`.
    9. **Release Upload**: Uploads the binary as a GitHub Workflow Artifact and attaches it to the GitHub Draft/Tag Release.

---

### Step 5: (Alternative / Verification Method) Local Windows Workstation Build
- **Location**: 💻 **Windows** (Local Workstation)
- **Action**:
  1. Clone the GitHub repository onto a Windows PC:
     ```cmd
     git clone https://github.com/your-org/devspace-desktop.git
     cd devspace-desktop
     ```
  2. Run the automated PowerShell installer builder script or double-click `build-installer.bat`:
     ```powershell
     .\build-installer.ps1
     ```
     *or manually:*
     ```cmd
     npm install
     npm run build
     npm run build:electron
     npm run dist:win
     ```
  3. Verify that `release\DevSpace Aether Desktop Setup 2.5.0.exe` is generated successfully.

---

### Step 6: Host & Publish Binary on the Production Distribution Server
- **Location**: 🐙 **GitHub** / 💻 **Windows** ➡️ 🌐 **Website Server**
- **Action**:
  1. Option A (Automated GitHub Release CDN):
     - Copy the published GitHub Release asset direct URL (e.g. `https://github.com/your-org/devspace/releases/download/v2.5.0/DevSpace.Aether.Desktop.Setup.2.5.0.exe`).
     - Set the environment variable `WINDOWS_INSTALLER_URL` or `VITE_WINDOWS_INSTALLER_URL` on the application hosting platform.
  2. Option B (Direct Hosted Server Release):
     - Upload `DevSpace Aether Desktop Setup 2.5.0.exe` directly into the `/release` directory on the production web server.

---

### Step 7: Verify Release Status via Server API
- **Location**: 🌐 **Website**
- **Action**:
  1. Perform a GET request to `/api/desktop/release-status`.
  2. Confirm the API returns:
     ```json
     {
       "available": true,
       "status": "published",
       "version": "2.5.0",
       "platform": "windows",
       "fileName": "DevSpace Aether Desktop Setup 2.5.0.exe",
       "downloadUrl": "/api/desktop/download/windows",
       "fileSizeMB": 85,
       "installerType": "NSIS Setup Executable (.exe)"
     }
     ```

---

### Step 8: End-User Desktop Download & Installation
- **Location**: 🌐 **Website** ➡️ 💻 **Windows** (User Machine)
- **Action**:
  1. User clicks **"Download Desktop"** or **"Launch Desktop Installer Wizard"** in the website header or settings.
  2. The Desktop Wizard steps through OS selection (Windows), account sync, and Ollama settings.
  3. At Step 6, the wizard detects `available: true` and displays the **"DOWNLOAD WINDOWS INSTALLER (SETUP.EXE)"** button.
  4. User clicks the button to download `DevSpace Aether Desktop Setup 2.5.0.exe`.
  5. User double-clicks `DevSpace Aether Desktop Setup 2.5.0.exe` on their Windows machine.
  6. The NSIS setup wizard installs DevSpace directly into `C:\Program Files\DevSpace Aether Desktop`, creates Start Menu & Desktop shortcuts, and launches the flagship native Windows app.
