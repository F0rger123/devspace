import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { getKeyBindings, parseShortcut } from '../../lib/keyboardMapper';
import { isElectron } from '../../lib/electronBridge';

export function GlobalHotkeyHandler() {
  const { isDrawingModeActive, setDrawingModeActive, toggleCommandPalette } = useStore();
  const { showToast, addNote } = useData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text input elements unless it's Esc
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');

      const pressedCombo = parseShortcut(e);
      const bindings = getKeyBindings();

      // Check Esc for emergency stop
      if (e.key === 'Escape') {
        const emergencyBinding = bindings.find(b => b.id === 'EMERGENCY_STOP' && b.enabled);
        if (emergencyBinding) {
          window.dispatchEvent(new Event('devspace-emergency-stop'));
          return;
        }
      }

      // Check Cmd+K or Ctrl+K for Global Command Launcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        showToast("🔍 DevSpace Command Launcher opened", "info", 1500);
        return;
      }

      // Check Cmd+Shift+D or Ctrl+Shift+D for Desktop App Download Modal (Web only)
      if (!isElectron() && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.dispatchEvent(new Event('devspace-open-desktop-download'));
        return;
      }

      // If user is actively typing inside a text input field, skip single-key or plain typing hotkeys,
      // but allow explicit modifier key combos (Cmd/Ctrl/Alt + Key)
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      if (isInput && !hasModifier) return;

      const matched = bindings.find(b => b.enabled && (
        b.shortcut.toUpperCase() === pressedCombo.toUpperCase() ||
        (pressedCombo.includes('Cmd') && b.shortcut.toUpperCase() === pressedCombo.replace('Cmd', 'Ctrl').toUpperCase())
      ));

      if (!matched) return;

      e.preventDefault();

      switch (matched.id) {
        case 'TOGGLE_CONTEXT_MODE':
          setDrawingModeActive(!isDrawingModeActive);
          showToast(!isDrawingModeActive ? "⭕ Aether Intelligence Active. Circle screen area with cursor!" : "Aether Intelligence deactivated", "info", 2500);
          break;

        case 'EMERGENCY_STOP':
          window.dispatchEvent(new Event('devspace-emergency-stop'));
          break;

        case 'TOGGLE_HAND_GESTURES':
          window.dispatchEvent(new Event('devspace-toggle-gestures'));
          showToast("🖐️ Hand Gesture AI Camera HUD toggled", "info", 2000);
          break;

        case 'QUICK_CAPTURE_MEMORY':
          addNote({
            projectId: 'default',
            title: `Quick Memory Snippet (${new Date().toLocaleTimeString()})`,
            content: `Captured via Global Keyboard Shortcut [${matched.shortcut}] on DevSpace Desktop.`,
            tags: ['QuickCapture', 'CortexMemory', 'Hotkey']
          });
          showToast("🧠 Quick Cortex Memory captured directly via hotkey!", "success", 3000);
          break;

        case 'TRIGGER_VOICE_DICTATION':
          toggleCommandPalette();
          showToast("🎤 Aether Voice Assistant activated!", "info", 2000);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingModeActive, setDrawingModeActive, toggleCommandPalette, showToast, addNote]);

  return null;
}
