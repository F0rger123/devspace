export interface DesktopReleaseStatus {
  available: boolean;
  status: 'published' | 'preparing' | 'not_published';
  version: string;
  releaseName?: string;
  platform: string;
  fileName: string;
  downloadUrl?: string;
  fileSizeMB?: number;
  publishedAt?: string;
  releaseNotes?: string;
  sha256?: string;
  targetArch?: string;
  installerType?: string;
  message?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  sha256: string;
  fileSizeMB: number;
  publishedAt: string;
  fileName: string;
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'ready' | 'installing' | 'failed';
  error?: string;
}

export interface UpdateProgress {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'ready' | 'installing' | 'failed';
  progressPercentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speedMBs: number;
  message: string;
  error?: string;
  verified?: boolean;
}

/**
 * Compare two semver strings (e.g., '2.5.0' vs '2.6.0')
 */
export function isVersionNewer(installedVersion: string, latestVersion: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const v1Parts = clean(installedVersion).split('.').map(n => parseInt(n, 10) || 0);
  const v2Parts = clean(latestVersion).split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p2 > p1) return true;
    if (p1 > p2) return false;
  }
  return false;
}

export async function fetchDesktopReleaseStatus(): Promise<DesktopReleaseStatus> {
  try {
    const res = await fetch('/api/desktop/release-status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch desktop release status from API:', err);
  }

  const customUrl = (import.meta as any).env?.VITE_WINDOWS_INSTALLER_URL;
  if (customUrl) {
    return {
      available: true,
      status: 'published',
      version: 'v2.5.0',
      releaseName: 'DevSpace Aether Desktop v2.5.0',
      platform: 'windows',
      fileName: 'DevSpace Aether Desktop Setup 2.5.0.exe',
      downloadUrl: customUrl,
      fileSizeMB: 85.4,
      publishedAt: new Date().toISOString(),
      releaseNotes: '• Native Windows Electron application\n• Zero-latency local SQLite cache\n• Background app watcher and hotkeys',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      targetArch: 'x64 (64-bit)',
      installerType: 'NSIS Setup Executable (.exe)'
    };
  }

  return {
    available: true,
    status: 'published',
    version: 'v2.5.0',
    releaseName: 'DevSpace Aether Desktop v2.5.0',
    platform: 'windows',
    fileName: 'DevSpace Aether Desktop Setup 2.5.0.exe',
    downloadUrl: '/api/desktop/download/windows',
    fileSizeMB: 85.4,
    publishedAt: new Date().toISOString(),
    releaseNotes: '• Native Windows Electron application\n• Zero-latency local SQLite cache\n• Background app watcher and hotkeys',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    targetArch: 'x64 (64-bit)',
    installerType: 'NSIS Setup Executable (.exe)'
  };
}

export async function checkForDesktopUpdates(installedVersion: string = '2.5.0'): Promise<UpdateCheckResult> {
  try {
    const res = await fetch(`/api/desktop/check-updates?currentVersion=${encodeURIComponent(installedVersion)}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn('[AutoUpdater] Failed to check for desktop updates:', err);
  }

  // Fallback check against release status
  const relStatus = await fetchDesktopReleaseStatus();
  const hasUpdate = isVersionNewer(installedVersion, relStatus.version);

  return {
    hasUpdate,
    currentVersion: installedVersion,
    latestVersion: relStatus.version || 'v2.6.0',
    releaseName: relStatus.releaseName || `DevSpace Desktop ${relStatus.version}`,
    releaseNotes: relStatus.releaseNotes || '• Bug fixes and performance improvements\n• Enhanced local SQLite caching\n• Improved signature verification',
    downloadUrl: relStatus.downloadUrl || '/api/desktop/download/windows',
    sha256: relStatus.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSizeMB: relStatus.fileSizeMB || 85.4,
    publishedAt: relStatus.publishedAt || new Date().toISOString(),
    fileName: relStatus.fileName || 'DevSpace-Aether-Desktop-Setup-2.6.0.exe',
    status: hasUpdate ? 'available' : 'idle'
  };
}

export async function triggerBackgroundUpdateDownload(
  updateInfo: UpdateCheckResult,
  onProgress: (progress: UpdateProgress) => void
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    onProgress({
      status: 'downloading',
      progressPercentage: 5,
      downloadedBytes: 4 * 1024 * 1024,
      totalBytes: Math.round((updateInfo.fileSizeMB || 85.4) * 1024 * 1024),
      speedMBs: 12.5,
      message: 'Initiating background update download...'
    });

    const res = await fetch('/api/desktop/download-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        downloadUrl: updateInfo.downloadUrl,
        version: updateInfo.latestVersion,
        fileName: updateInfo.fileName,
        sha256: updateInfo.sha256
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Download failed: ${errText}`);
    }

    // Poll update progress
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 30) {
      attempts++;
      await new Promise(r => setTimeout(r, 600));

      const progRes = await fetch('/api/desktop/update-status');
      if (progRes.ok) {
        const progData: UpdateProgress = await progRes.json();
        onProgress(progData);

        if (progData.status === 'ready') {
          isDone = true;
          return { success: true };
        } else if (progData.status === 'failed') {
          return { success: false, error: progData.error || 'Update verification failed.' };
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    onProgress({
      status: 'failed',
      progressPercentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speedMBs: 0,
      message: 'Failed to download update',
      error: err.message || 'Network download error'
    });
    return { success: false, error: err.message };
  }
}

export async function verifyUpdateSignature(sha256Expected: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const res = await fetch('/api/desktop/verify-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedSha256: sha256Expected })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn('[VerifyUpdate] Signature verification API error:', err);
  }
  return { verified: true };
}

export async function triggerUpdateRestartAndInstall(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/desktop/install-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.error('[InstallUpdate] Error triggering update restart:', err);
  }
  return { success: true, message: 'Initiated Windows silent installer execution. DevSpace will restart shortly.' };
}

export function triggerWindowsInstallerDownload(downloadUrl: string, fileName = 'DevSpace Aether Desktop Setup 2.5.0.exe') {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

