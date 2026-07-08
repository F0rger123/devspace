/**
 * Tasteful Haptic Feedback Utility using Web Vibration API.
 * Safely checks for support so it never crashes on desktop or unsupported devices.
 */

export const haptic = {
  /**
   * Extremely light tick/tap, perfect for button clicks and small state toggles.
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (e) {
        // Safe fallback
      }
    }
  },

  /**
   * Slightly stronger vibration for medium actions like opening drawers or tabs.
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Safe fallback
      }
    }
  },

  /**
   * Double tap pattern for success or complete actions.
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([20, 50, 20]);
      } catch (e) {
        // Safe fallback
      }
    }
  },

  /**
   * Distinctive notification or warning haptic feedback.
   */
  warning: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch (e) {
        // Safe fallback
      }
    }
  }
};

