/**
 * Theme Manager Service
 * Handles theme switching and dice color preferences
 * Uses CSS custom properties for theming
 */

export class ThemeManager extends EventTarget {
  // Available themes
  static THEMES = [
    { id: 'theme-default', name: 'Default' },
    { id: 'theme-abstract', name: 'Abstract' },
    { id: 'theme-basketball', name: 'Basketball' },
    { id: 'theme-future', name: 'Future' },
    { id: 'theme-halloween', name: 'Halloween' },
    { id: 'theme-nature', name: 'Nature' },
    { id: 'theme-ocean', name: 'Ocean' },
    { id: 'theme-space', name: 'Space' },
    { id: 'theme-tron', name: 'Tron' }
  ];

  // Dice color options (Y position offset in sprite)
  static DICE_COLORS = {
    red: 0,
    yellow: -60,
    green: -120,
    blue: -180,
    pink: -240,
    white: -300,
    black: -360
  };

  #currentTheme = 'theme-default';
  #currentDiceColor = 'white';
  #storageKey = 'yambo-preferences';

  constructor() {
    super();
    this.#loadPreferences();
  }

  /**
   * Get current theme ID
   * @returns {string}
   */
  get theme() {
    return this.#currentTheme;
  }

  /**
   * Set theme by ID
   * @param {string} themeId - Theme ID (e.g., 'theme-tron')
   */
  set theme(themeId) {
    const validTheme = ThemeManager.THEMES.find(t => t.id === themeId);
    if (validTheme) {
      this.#applyTheme(themeId);
    }
  }

  /**
   * Get current dice color name
   * @returns {string}
   */
  get diceColor() {
    return this.#currentDiceColor;
  }

  /**
   * Set dice color by name
   * @param {string} colorName - Color name (e.g., 'red', 'blue')
   */
  set diceColor(colorName) {
    if (ThemeManager.DICE_COLORS.hasOwnProperty(colorName)) {
      this.#currentDiceColor = colorName;
      this.#savePreferences();
      this.#emit('diceColorChange', {
        color: colorName,
        offset: this.diceColorOffset
      });
    }
  }

  /**
   * Get dice color Y offset for sprite positioning
   * @returns {number}
   */
  get diceColorOffset() {
    return ThemeManager.DICE_COLORS[this.#currentDiceColor] ?? -300;
  }

  /**
   * Get list of available themes
   * @returns {Array<{id: string, name: string}>}
   */
  getAvailableThemes() {
    return [...ThemeManager.THEMES];
  }

  /**
   * Get list of available dice colors
   * @returns {string[]}
   */
  getAvailableDiceColors() {
    return Object.keys(ThemeManager.DICE_COLORS);
  }

  /**
   * Apply theme to document body
   * @param {string} themeId - Theme ID
   */
  #applyTheme(themeId) {
    const oldTheme = this.#currentTheme;
    this.#currentTheme = themeId;

    // Remove old theme class, add new one
    document.body.classList.remove(oldTheme);
    document.body.classList.add(themeId);

    this.#savePreferences();
    this.#emit('themeChange', { theme: themeId, previousTheme: oldTheme });
  }

  /**
   * Initialize theme on page load
   * Call this after DOM is ready
   */
  init() {
    document.body.classList.add(this.#currentTheme);
  }

  /**
   * Load preferences from localStorage
   */
  #loadPreferences() {
    try {
      const stored = localStorage.getItem(this.#storageKey);
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.theme && ThemeManager.THEMES.find(t => t.id === prefs.theme)) {
          this.#currentTheme = prefs.theme;
        }
        if (prefs.diceColor && ThemeManager.DICE_COLORS.hasOwnProperty(prefs.diceColor)) {
          this.#currentDiceColor = prefs.diceColor;
        }
      }
    } catch (e) {
      console.warn('Failed to load theme preferences:', e);
    }
  }

  /**
   * Save preferences to localStorage
   */
  #savePreferences() {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify({
        theme: this.#currentTheme,
        diceColor: this.#currentDiceColor
      }));
    } catch (e) {
      console.warn('Failed to save theme preferences:', e);
    }
  }

  /**
   * Emit a custom event
   * @param {string} type - Event type
   * @param {Object} detail - Event detail
   */
  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Subscribe to theme changes
   * @param {string} type - Event type ('themeChange' or 'diceColorChange')
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(type, callback) {
    this.addEventListener(type, callback);
    return () => this.removeEventListener(type, callback);
  }
}

// Singleton instance for convenience
export const themeManager = new ThemeManager();
