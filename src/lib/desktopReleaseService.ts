export interface DesktopReleaseStatus {
  available: boolean;
  status: 'published' | 'not_published';
  version: string;
  platform: string;
  fileName: string;
  downloadUrl?: string;
  fileSizeMB?: number;
  publishedAt?: string;
  targetArch?: string;
  installerType?: string;
  message?: string;
  developerInfo?: {
    buildScript: string;
    ciWorkflow: string;
    targetOutput: string;
  };
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
      version: '2.5.0',
      platform: 'windows',
      fileName: 'DevSpace Aether Desktop Setup 2.5.0.exe',
      downloadUrl: customUrl,
      fileSizeMB: 85,
      targetArch: 'x64',
      installerType: 'NSIS Setup Executable (.exe)'
    };
  }

  return {
    available: false,
    status: 'not_published',
    version: '2.5.0',
    platform: 'windows',
    fileName: 'DevSpace Aether Desktop Setup 2.5.0.exe',
    message: 'No published Windows desktop installer (.exe) binary is currently hosted on the release server for v2.5.0.',
    developerInfo: {
      buildScript: 'npm run dist:win',
      ciWorkflow: '.github/workflows/desktop-build.yml',
      targetOutput: 'release/DevSpace Aether Desktop Setup 2.5.0.exe'
    }
  };
}

export function triggerWindowsInstallerDownload(downloadUrl: string, fileName = 'DevSpace Aether Desktop Setup 2.5.0.exe') {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
