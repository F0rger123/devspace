# DevSpace Desktop Architecture Specification (Phase 1)
**Flagship Native Windows Desktop Architecture**

---

## 1. Executive Summary & Core Philosophy

DevSpace Desktop is the flagship execution platform for the DevSpace ecosystem. This architecture document establishes the technical blueprint for establishing a unified, native desktop application while maintaining **one shared codebase**.

### Key Architectural Directives
- **Single Shared Codebase**: The core React application in `src/` serves as the primary front-end for both Web and Desktop platforms without duplicate UI code or divergent business logic.
- **Native Windows Desktop Runtime**: Powered by an Electron container with context isolation, secure IPC bridging, and native NSIS Windows installers (`.exe`).
- **Strict Anti-Patterns (Excluded Technologies)**:
  - ❌ No Progressive Web Apps (PWAs)
  - ❌ No browser shortcuts or URL shortcuts
  - ❌ No raw HTML wrappers or web launchers
  - ❌ No Chrome install prompts or manifest web-app badges
- **Flagship Priority**: Native desktop features (local filesystem access, system tray, window chrome controls, offline persistence, native IPC) elevate DevSpace Desktop to the primary developer workspace experience.

---

## 2. Target Project Folder Structure

Below is the proposed folder structure enforcing strict separation between shared application logic, native desktop runtime code, capability modules, plugins, and server/build orchestration.

```
devspace-desktop/
├── electron/                         # [Desktop Only] Native Main & Preload Processes
│   ├── main.ts                       # Electron main process entry point (lifecycle, windows, native IPC handlers)
│   ├── preload.ts                    # Context bridge exposing safe native APIs to renderer process
│   ├── capabilities/                 # [Modular Capabilities] Isolated native capability implementations
│   │   ├── CapabilityManager.ts      # Registry & orchestrator for all native desktop capabilities
│   │   ├── FilesCapability.ts        # Native FS read/write/stream & file pickers
│   │   ├── TerminalCapability.ts     # PTY / PowerShell interactive shell session management
│   │   ├── GitCapability.ts          # Native Git repository inspection, diff, commit, and branch ops
│   │   ├── BrowserCapability.ts      # WebContents / Webview sandbox browser control
│   │   ├── ScreenCaptureCapability.ts# Native Windows display & window frame capture/recording
│   │   ├── LocalModelsCapability.ts  # Local LLM runner integration (Ollama / Llama.cpp / ONNX)
│   │   ├── GeminiCLICapability.ts    # Google GenAI CLI process execution & streaming
│   │   └── ClaudeCapability.ts       # Anthropic Claude CLI & MCP server integration
│   ├── permissions/                  # [Permission Engine] Security & user consent verification
│   │   ├── PermissionManager.ts      # Checks, requests, and persists native feature access rights
│   │   └── scopes.ts                 # Declarative Windows privilege & permission scope definitions
│   ├── plugins/                      # [Plugin System] Dynamic extension runtime for native capabilities
│   │   ├── PluginHost.ts             # Plugin loader, lifecycle controller, and isolation boundary
│   │   ├── PluginContract.ts         # TypeScript interface contract for desktop plugins
│   │   └── installed/                # Installed dynamic desktop plugins directory
│   ├── updater/                      # [Update Channels] Automated release channel updater
│   │   └── UpdateManager.ts          # Auto-updater configuring Stable, Beta, and Developer release channels
│   └── assets/                       # Desktop native icons (.ico, .png) & NSIS installer media
│
├── src/                              # [Shared 100%] Primary React Application (Web & Desktop Renderer)
│   ├── main.tsx                      # Web & Desktop React DOM bootstrap
│   ├── App.tsx                       # Root App Router & Global Provider container
│   ├── index.css                     # Shared Tailwind CSS global styles
│   ├── desktop/                      # [Shared] Native Bridge Interfaces & Fallback Implementations
│   │   ├── bridge.ts                 # Unified access point for native desktop APIs
│   │   ├── runtimeVersion.ts         # Runtime version detection & capability handshake
│   │   ├── permissions.ts            # Client-side permission prompt & status hooks
│   │   ├── capabilities.ts           # React hooks & providers for querying desktop capabilities
│   │   ├── plugins.ts                # Client-side plugin UI registry & extension points
│   │   ├── types.ts                  # TypeScript definitions for IPC commands & native events
│   │   └── fallbacks.ts              # Web-safe fallback implementations when running in browser
│   ├── components/                   # Shared UI Components (Design, Canvas, Dialogs, Custom TitleBar)
│   ├── context/                      # React Context providers (Theme, Auth, DesktopState)
│   ├── data/                         # Static mock blueprints, template data, default configs
│   ├── lib/                          # Utility libraries, sandbox engines, data transformations
│   ├── pages/                        # View pages (Design.tsx, Create.tsx, Dashboard.tsx, Settings.tsx)
│   ├── store/                        # Global state stores (Zustand / Redux state)
│   └── utils/                        # Formatting, sanitization, helper functions
│
├── public/                           # [Shared] Public static assets, fonts, icons
├── server.ts                         # [Shared/Backend] Node Express API proxy & dev server engine
├── index.html                        # [Shared] Main single-page application entry template
├── vite.config.ts                    # [Shared] Vite bundler configuration
├── package.json                      # [Shared] Dependency & build pipeline configuration
├── tsconfig.json                     # TypeScript compiler configuration
├── DEVSPACE_DESKTOP_ARCHITECTURE.md  # Architecture specification document (this file)
└── build-installer.ps1               # PowerShell native Windows build helper script
```

---

## 3. Capability Manager Architecture

To ensure strict separation of concerns, native desktop features are decoupled into standalone **Capability Modules** orchestrated by a central `CapabilityManager`. Each capability operates as an isolated domain with its own IPC namespace, lifecycle, error boundary, and permission requirements.

```
                                  +-----------------------+
                                  |   CapabilityManager   |
                                  +-----------+-----------+
                                              |
        +------------------+------------------+------------------+------------------+
        |                  |                  |                  |                  |
        v                  v                  v                  v                  v
  [Files Cap]        [Terminal Cap]       [Git Cap]        [Browser Cap]    [Screen Capture]
        |                  |                  |                  |                  |
        v                  v                  v                  v                  v
  [Local Models]     [Gemini CLI]       [Claude Cap]      [Future Plugin 1]  [Future Plugin 2]
```

### Modular Capabilities Specification

1. **Files Capability (`files`)**: Direct native filesystem stream access, high-speed project directory watchers (`chokidar`), native Windows file save/open picker dialogs, and workspace file tree indexing.
2. **Terminal Capability (`terminal`)**: Interactive pseudo-terminal (PTY) session manager (`node-pty`) supporting PowerShell, Command Prompt, and WSL sessions with bidirectional streaming to xterm.js UI components.
3. **Git Capability (`git`)**: Native Git executable wrapper providing local branch inspection, staging diff generation, commit history graph traversal, and remote credential helper integration.
4. **Browser Capability (`browser`)**: Isolated `WebContentsView` sandbox browser engine allowing embedded preview rendering, proxy bypass, cookie isolation, and live devtools inspection.
5. **Screen Capture Capability (`screenCapture`)**: Windows Desktop Duplication API and `desktopCapturer` integration for high-framerate workspace recording, window snapshot generation, and visual bug reporting.
6. **Local Models Capability (`localModels`)**: Interprocess connection manager for local AI inference engines (Ollama daemon, Llama.cpp RPC binaries, or ONNX Runtime Web/Native) with GPU acceleration hardware detection.
7. **Gemini CLI Capability (`geminiCli`)**: Native subprocess manager executing Google GenAI CLI tools, managing API token environment flags, and handling stdout streaming.
8. **Claude Capability (`claude`)**: Integration adapter for Anthropic Claude CLI and local Model Context Protocol (MCP) servers, allowing desktop agent tool invocation.

### Capability Interface & Contract (`electron/capabilities/CapabilityManager.ts`)

```typescript
export interface DesktopCapability {
  id: string; // e.g., 'terminal', 'git', 'localModels'
  version: string;
  requiredPermissions: PermissionScope[];
  initialize(mainContext: ElectronMainContext): Promise<void>;
  dispose(): Promise<void>;
  isSupported(): Promise<boolean>;
}

export class CapabilityManager {
  private capabilities = new Map<string, DesktopCapability>();

  public registerCapability(capability: DesktopCapability): void {
    this.capabilities.set(capability.id, capability);
  }

  public getCapability<T extends DesktopCapability>(id: string): T | undefined {
    return this.capabilities.get(id) as T;
  }

  public async getAvailableCapabilities(): Promise<Record<string, { version: string; supported: boolean }>> {
    const result: Record<string, { version: string; supported: boolean }> = {};
    for (const [id, cap] of this.capabilities.entries()) {
      result[id] = {
        version: cap.version,
        supported: await cap.isSupported(),
      };
    }
    return result;
  }
}
```

---

## 4. Runtime Version System & Feature Handshake

The React front-end shared codebase may run in cloud web environments or inside various versions of the native Windows desktop shell. A deterministic **Runtime Version Handshake System** enables the web app to query desktop capabilities dynamically at boot and adapt its UI without runtime errors.

### Handshake Protocol Flow

```
+-------------------+                           +------------------------+
| React Web App     | --- 1. Query Handshake -->| Native Preload Bridge  |
| (Shared Renderer) |                           | (Desktop / Web Spec)   |
+-------------------+                           +------------------------+
        |                                                   |
        | <--- 2. Return Runtime Version Payload -----------+
        |       { desktopVersion, apiLevel, capabilities }
        v
+-----------------------------------------------------------------+
| React Capability Context Provider (`src/desktop/capabilities`)  |
| Enables/disables Native Terminal, Local Models, Git UI, etc.    |
+-----------------------------------------------------------------+
```

### Runtime Version Payload Schema (`src/desktop/runtimeVersion.ts`)

```typescript
export interface RuntimeVersionPayload {
  isDesktop: boolean;
  desktopVersion: string;         // SemVer string (e.g., "1.4.0")
  apiLevel: number;               // Integer API contract version (e.g., 2)
  channel: 'stable' | 'beta' | 'developer';
  platform: 'win32' | 'darwin' | 'linux' | 'web';
  arch: 'x64' | 'arm64' | 'web';
  capabilities: Record<string, {
    enabled: boolean;
    version: string;
    permissionsGranted: boolean;
  }>;
}
```

### Feature Detection API in React

```typescript
// Component usage example in src/pages/Create.tsx or src/pages/Design.tsx
import { useDesktopCapability } from '../desktop/capabilities';

export function TerminalPanel() {
  const { hasCapability, isGranted } = useDesktopCapability();

  if (!hasCapability('terminal')) {
    return <WebTerminalFallbackNotice />;
  }

  if (!isGranted('terminal:execute')) {
    return <PermissionRequestBanner capability="terminal" />;
  }

  return <NativeXtermWindow />;
}
```

---

## 5. Desktop Permission System

To safeguard developer environments, DevSpace Desktop implements a **Declarative Permission System**. Every native feature must declare its required permission scopes. The desktop runtime prompts the user for authorization before granting access to sensitive Windows OS APIs.

### Permission Scopes Hierarchy (`electron/permissions/scopes.ts`)

```typescript
export type PermissionScope =
  | 'fs:read'           // Read access to user workspace directories
  | 'fs:write'          // Write/delete access to local workspace files
  | 'terminal:execute'  // Spawn PTY processes & shell command execution
  | 'git:write'         // Perform Git commits, branch modifications, and pushes
  | 'screencapture:record' // Record screen, active window, or display frames
  | 'localmodel:gpu'    // Allocate system RAM/VRAM for local LLM inference
  | 'shell:spawn'       // Spawn external system executables (Gemini CLI, Claude CLI)
  | 'browser:webview'   // Open embedded webview browser containers
  | 'plugin:load';      // Load dynamically installed desktop plugins
```

### Permission Manager Architecture

```
[IPC Request from Renderer]
            │
            v
[PermissionManager.check(scope)] ──> Already Granted? ──YES──> Execute IPC Operation
            │
           NO
            v
[Trigger Native Authorization Dialog] ── User Consented? ──YES──> Store Decision & Execute
            │
           NO
            v
[Reject IPC Request with Security Exception]
```

---

## 6. Plugin Architecture

DevSpace Desktop features an extensible **Native Plugin Architecture**. Future capabilities (such as custom IDE extensions, third-party AI runners, or specialized build toolchains) can be loaded dynamically at runtime without modifying or recompiling the core desktop shell executable.

```
                              +--------------------------+
                              |    Native PluginHost     |
                              +------------+-------------+
                                           |
               +---------------------------+---------------------------+
               |                                                       |
               v                                                       v
   [Built-In Plugin Loader]                                [External Community Plugins]
 (`electron/plugins/installed/`)                         (`%APPDATA%/DevSpace/plugins/`)
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                              +--------------------------+
                              | Isolated Node.js Worker  |
                              | Context / Sandbox API    |
                              +--------------------------+
```

### Native Plugin Contract (`electron/plugins/PluginContract.ts`)

```typescript
export interface DevSpaceNativePlugin {
  manifest: {
    id: string;               // e.g., 'com.devspace.docker-manager'
    name: string;
    version: string;
    author: string;
    requiredApiLevel: number;
    declaredPermissions: PermissionScope[];
  };

  /** Called when the desktop shell boots or when the plugin is enabled */
  activate(context: PluginContext): Promise<void>;

  /** Called when the plugin is disabled or desktop shell shuts down */
  deactivate(): Promise<void>;
}

export interface PluginContext {
  registerIPC(channel: string, handler: (...args: any[]) => Promise<any>): void;
  registerCapability(capability: DesktopCapability): void;
  logger: { info(msg: string): void; error(msg: string, err?: any): void };
}
```

---

## 7. Distribution Channels & Auto-Update Engine

To support rapid developer iteration while maintaining production stability, DevSpace Desktop defines three distinct **Update Channels**.

### Release Channels Matrix

| Channel | Identifier | Target Audience | Update Frequency | Stability Guarantee |
|---|---|---|---|---|
| **Developer** | `developer` | DevSpace Core Engineers & Early Testing | Daily / Per-Commit Builds | Bleeding Edge / Experimental |
| **Beta** | `beta` | Power Developers & Community Testers | Weekly Releases | Feature Complete / Staging Validated |
| **Stable** | `stable` | General Production Developers | Monthly Releases | Fully Qualified & Signed Executables |

### Channel Update Architecture (`electron/updater/UpdateManager.ts`)

```typescript
import { autoUpdater } from 'electron-updater';

export class UpdateManager {
  private currentChannel: 'stable' | 'beta' | 'developer' = 'stable';

  public configureChannel(channel: 'stable' | 'beta' | 'developer'): void {
    this.currentChannel = channel;
    autoUpdater.allowPrerelease = channel !== 'stable';
    autoUpdater.channel = channel;
    
    // Set differential delta update feeds
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: `https://updates.devspace.io/desktop/windows/${channel}/`
    });
  }

  public checkForUpdates(): void {
    autoUpdater.checkForUpdatesAndNotify();
  }
}
```

---

## 8. Code Sharing Model & Dual Runtime Summary

```
                      +------------------------------------------+
                      |         DevSpace Core (src/)             |
                      |  React 19 + TypeScript + Tailwind CSS    |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
        [Desktop Native Runtime]                      [Web Browser Runtime]
     +-----------------------------+               +-------------------------+
     | Electron Chromium Window    |               | Cloud Run / Web Browser |
     | Preload ContextBridge IPC   |               | Native API Fallbacks    |
     | Capability Manager          |               | Storage & API Proxies   |
     | Permission Engine           |               +-------------------------+
     | Native Plugins & Auto-Update|
     +-----------------------------+
```

---

## 9. Phase 1 Verification & Roadmap

### Phase 1 Architectural Objectives
- [x] Inspect current codebase architecture & directory structure.
- [x] Establish single repository code-sharing methodology.
- [x] Categorize desktop-only vs shared source files.
- [x] Define Capability Manager architecture (Files, Terminal, Git, Browser, Screen Capture, Local Models, Gemini CLI, Claude).
- [x] Define Runtime Version system and feature handshake protocol.
- [x] Establish declarative Permission system and security scope hierarchy.
- [x] Design extensible Native Plugin architecture and plugin contracts.
- [x] Formulate Update Channels (Developer, Beta, Stable) and update stream pipeline.
- [x] Reject PWAs, browser shortcuts, and HTML launcher hacks.
- [x] Produce comprehensive `DEVSPACE_DESKTOP_ARCHITECTURE.md` specification.

### Phase 2 Implementation Plan (Upcoming)
1. Implement typed `src/desktop/bridge.ts`, runtime version handshake, and fallback hooks.
2. Build native Windows custom frameless titlebar component (`src/components/DesktopTitleBar.tsx`).
3. Wire Capability Manager modules inside `/electron/capabilities/`.
4. Validate build pipeline with PowerShell installer scripts (`build-installer.ps1`).
