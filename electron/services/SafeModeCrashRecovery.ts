import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface CrashState {
  lastBootTimestamp: number;
  bootSuccessTimestamp: number;
  consecutiveCrashCount: number;
  inSafeMode: boolean;
  crashLogs: Array<{ timestamp: number; reason: string }>;
}

export class SafeModeCrashRecovery {
  private stateFilePath: string = '';
  private state: CrashState = {
    lastBootTimestamp: Date.now(),
    bootSuccessTimestamp: 0,
    consecutiveCrashCount: 0,
    inSafeMode: false,
    crashLogs: [],
  };

  public initialize(): boolean {
    try {
      const userData = app.getPath('userData');
      this.stateFilePath = path.join(userData, 'aether_crash_state.json');

      const isSafeModeFlag = process.argv.includes('--safe-mode');

      if (fs.existsSync(this.stateFilePath)) {
        try {
          const raw = fs.readFileSync(this.stateFilePath, 'utf8');
          this.state = JSON.parse(raw);
        } catch (e) {
          console.warn('[SafeMode] Error reading crash state, resetting to defaults');
        }
      }

      const now = Date.now();
      // Check if previous boot failed before reporting success (within 30s)
      const didCrashRecently =
        this.state.lastBootTimestamp > 0 &&
        this.state.bootSuccessTimestamp < this.state.lastBootTimestamp &&
        now - this.state.lastBootTimestamp < 60000;

      if (didCrashRecently) {
        this.state.consecutiveCrashCount += 1;
        this.state.crashLogs.unshift({
          timestamp: now,
          reason: 'Process terminated unexpectedly during startup initialization.',
        });
      } else {
        this.state.consecutiveCrashCount = 0;
      }

      this.state.lastBootTimestamp = now;

      // Trigger safe mode if explicit flag is passed OR 3 consecutive crashes occurred
      if (isSafeModeFlag || this.state.consecutiveCrashCount >= 3) {
        this.state.inSafeMode = true;
        console.warn(
          `[SafeMode] Safe Mode ACTIVE (Reason: ${
            isSafeModeFlag ? 'CLI flag --safe-mode' : '3 consecutive startup crashes detected'
          }). Third-party extensions and heavy overlays are disabled.`
        );
      } else {
        this.state.inSafeMode = false;
      }

      this.saveState();
      return this.state.inSafeMode;
    } catch (err) {
      console.warn('[SafeMode] Initialization error:', err);
      return false;
    }
  }

  public recordBootSuccess(): void {
    try {
      this.state.bootSuccessTimestamp = Date.now();
      this.state.consecutiveCrashCount = 0;
      this.saveState();
      console.log('[SafeMode] Startup marked as healthy and verified.');
    } catch (e) {
      console.warn('[SafeMode] Failed to record boot success:', e);
    }
  }

  public recordCrash(reason: string): void {
    try {
      this.state.crashLogs.unshift({ timestamp: Date.now(), reason });
      this.saveState();
    } catch (e) {}
  }

  public isSafeMode(): boolean {
    return this.state.inSafeMode;
  }

  public getCrashState(): CrashState {
    return { ...this.state };
  }

  public clearSafeMode(): void {
    this.state.inSafeMode = false;
    this.state.consecutiveCrashCount = 0;
    this.saveState();
  }

  private saveState(): void {
    if (!this.stateFilePath) return;
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SafeMode] Failed to write crash state:', e);
    }
  }
}

export const safeModeCrashRecovery = new SafeModeCrashRecovery();
