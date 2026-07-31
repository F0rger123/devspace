export interface KeyBinding {
  id: string;
  actionName: string;
  description: string;
  shortcut: string; // e.g. "Cmd+Shift+E", "Alt+Space", "Ctrl+Shift+K"
  enabled: boolean;
}

export const DEFAULT_BINDINGS: KeyBinding[] = [
  {
    id: 'TOGGLE_CONTEXT_MODE',
    actionName: 'Aether Context Circle Mode',
    description: 'Circle screen area with mouse cursor across desktop apps',
    shortcut: 'Cmd+Shift+E',
    enabled: true
  },
  {
    id: 'TOGGLE_HAND_GESTURES',
    actionName: 'Hand Gesture AI Camera HUD',
    description: 'Toggle webcam tracking for hand gestures and cursor pointing',
    shortcut: 'Cmd+Alt+G',
    enabled: true
  },
  {
    id: 'EMERGENCY_STOP',
    actionName: 'Aether Emergency Kill Switch',
    description: 'Instantly halt all autonomous mouse clicks and permission grants',
    shortcut: 'Esc',
    enabled: true
  },
  {
    id: 'QUICK_CAPTURE_MEMORY',
    actionName: 'Quick Cortex Memory Capture',
    description: 'Save current active screen region directly into Cortex memory',
    shortcut: 'Cmd+Shift+M',
    enabled: true
  },
  {
    id: 'TOGGLE_CLAUDE_AUTO_APPROVE',
    actionName: 'Claude Permission Auto-Clicker',
    description: 'Auto-click "Yes/Allow" on Claude CLI permission modals',
    shortcut: 'Cmd+Shift+P',
    enabled: true
  },
  {
    id: 'TRIGGER_VOICE_DICTATION',
    actionName: 'Aether Voice Assistant Dictation',
    description: 'Speak prompts directly to Aether AI Assistant',
    shortcut: 'Alt+Space',
    enabled: true
  }
];

export function getKeyBindings(): KeyBinding[] {
  try {
    const raw = localStorage.getItem('devspace_keyboard_bindings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_BINDINGS;
}

export function saveKeyBindings(bindings: KeyBinding[]) {
  localStorage.setItem('devspace_keyboard_bindings', JSON.stringify(bindings));
  window.dispatchEvent(new Event('devspace-bindings-updated'));
}

export function parseShortcut(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('Cmd');
  if (event.shiftKey) parts.push('Shift');
  if (event.altKey) parts.push('Alt');

  const keyUpper = event.key.toUpperCase();
  if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(keyUpper)) {
    if (keyUpper === ' ') parts.push('Space');
    else if (keyUpper === 'ESCAPE') parts.push('Esc');
    else parts.push(keyUpper);
  }

  return parts.join('+');
}
