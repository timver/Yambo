/**
 * Yambo Options Component
 * Player settings, theme selection, dice color, sound controls
 */

import { gameState } from '../services/game-state.js';
import { themeManager, ThemeManager } from '../services/theme-manager.js';
import { audioService } from '../services/audio-service.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    fieldset {
      background: var(--fieldset-bg, rgba(0, 0, 0, 0.8));
      border: var(--panel-border-width, 2px) solid var(--fieldset-border-color, #2f2727);
      border-radius: var(--fieldset-border-radius, 10px);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    legend {
      color: var(--legend-color, #009933);
      font-family: var(--font-family-heading, inherit);
      padding: 0 0.5rem;
    }

    .form-group {
      margin-bottom: 0.75rem;
    }

    .form-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }

    label {
      display: block;
      color: var(--label-color, #fff);
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    input[type="text"],
    select {
      width: 100%;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.9);
    }

    button {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f8f9fa;
      cursor: pointer;
      white-space: nowrap;
    }

    button:hover {
      background: #e9ecef;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .checkbox-group label {
      display: inline;
      margin: 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--fieldset-border-color, #2f2727);
      margin: 1rem 0;
      opacity: 0.5;
    }
  </style>

  <fieldset>
    <legend>Options</legend>

    <!-- Player Name -->
    <div class="form-group">
      <div class="form-row">
        <div class="form-group">
          <label for="playerName">Player Name</label>
          <input type="text" id="playerName" placeholder="Enter name..." />
        </div>
        <button type="button" class="btn-add-player">Set</button>
      </div>
    </div>

    <hr />

    <!-- Theme -->
    <div class="form-group">
      <label for="theme">Theme</label>
      <select id="theme"></select>
    </div>

    <!-- Dice Color -->
    <div class="form-group">
      <label for="diceColor">Dice Color</label>
      <select id="diceColor">
        <option value="red">Red</option>
        <option value="yellow">Yellow</option>
        <option value="green">Green</option>
        <option value="blue">Blue</option>
        <option value="pink">Pink</option>
        <option value="white" selected>White</option>
        <option value="black">Black</option>
      </select>
    </div>

    <!-- Animation Speed -->
    <div class="form-group">
      <label for="juggleTime">Roll Speed</label>
      <select id="juggleTime">
        <option value="100">Fast</option>
        <option value="200" selected>Normal</option>
        <option value="400">Slow</option>
        <option value="800">Very Slow</option>
      </select>
    </div>

    <hr />

    <!-- Sound -->
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="soundEnabled" checked />
        <label for="soundEnabled">Sound Effects</label>
      </div>
    </div>

    <!-- Tooltips -->
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="tooltipsEnabled" checked />
        <label for="tooltipsEnabled">Tooltips</label>
      </div>
    </div>
  </fieldset>
`;

export class YamboOptions extends HTMLElement {
  #playerNameInput;
  #addPlayerBtn;
  #themeSelect;
  #diceColorSelect;
  #juggleTimeSelect;
  #soundCheckbox;
  #tooltipsCheckbox;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#cacheElements();
    this.#populateThemes();
    this.#loadSettings();
    this.#bindEvents();
  }

  #cacheElements() {
    this.#playerNameInput = this.shadowRoot.querySelector('#playerName');
    this.#addPlayerBtn = this.shadowRoot.querySelector('.btn-add-player');
    this.#themeSelect = this.shadowRoot.querySelector('#theme');
    this.#diceColorSelect = this.shadowRoot.querySelector('#diceColor');
    this.#juggleTimeSelect = this.shadowRoot.querySelector('#juggleTime');
    this.#soundCheckbox = this.shadowRoot.querySelector('#soundEnabled');
    this.#tooltipsCheckbox = this.shadowRoot.querySelector('#tooltipsEnabled');
  }

  #populateThemes() {
    const themes = themeManager.getAvailableThemes();
    this.#themeSelect.innerHTML = themes
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join('');
  }

  #loadSettings() {
    // Load theme
    this.#themeSelect.value = themeManager.theme;

    // Load dice color
    this.#diceColorSelect.value = themeManager.diceColor;

    // Load sound setting
    this.#soundCheckbox.checked = audioService.enabled;

    // Load from localStorage
    try {
      const stored = localStorage.getItem('yambo-options');
      if (stored) {
        const options = JSON.parse(stored);
        if (options.juggleTime) {
          this.#juggleTimeSelect.value = options.juggleTime;
        }
        if (options.tooltipsEnabled !== undefined) {
          this.#tooltipsCheckbox.checked = options.tooltipsEnabled;
        }
      }
    } catch (e) {
      console.warn('Failed to load options:', e);
    }
  }

  #saveSettings() {
    try {
      localStorage.setItem('yambo-options', JSON.stringify({
        juggleTime: this.#juggleTimeSelect.value,
        tooltipsEnabled: this.#tooltipsCheckbox.checked
      }));
    } catch (e) {
      console.warn('Failed to save options:', e);
    }
  }

  #bindEvents() {
    // Player name
    this.#addPlayerBtn.addEventListener('click', () => this.#setPlayerName());
    this.#playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.#setPlayerName();
    });

    // Theme
    this.#themeSelect.addEventListener('change', () => {
      themeManager.theme = this.#themeSelect.value;
      this.#emitChange('theme', this.#themeSelect.value);
    });

    // Dice color
    this.#diceColorSelect.addEventListener('change', () => {
      themeManager.diceColor = this.#diceColorSelect.value;
      this.#emitChange('diceColor', this.#diceColorSelect.value);
    });

    // Juggle time
    this.#juggleTimeSelect.addEventListener('change', () => {
      this.#saveSettings();
      this.#emitChange('juggleTime', this.juggleTime);
    });

    // Sound
    this.#soundCheckbox.addEventListener('change', () => {
      audioService.enabled = this.#soundCheckbox.checked;
      this.#emitChange('sound', this.#soundCheckbox.checked);
    });

    // Tooltips
    this.#tooltipsCheckbox.addEventListener('change', () => {
      this.#saveSettings();
      this.#emitChange('tooltips', this.#tooltipsCheckbox.checked);
    });
  }

  #setPlayerName() {
    const name = this.#playerNameInput.value.trim();
    if (name) {
      gameState.playerName = name;
      this.#playerNameInput.value = '';
      this.#emitChange('playerName', name);
    }
  }

  #emitChange(setting, value) {
    this.dispatchEvent(new CustomEvent('optionchange', {
      bubbles: true,
      detail: { setting, value }
    }));
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current theme ID
   * @returns {string}
   */
  get theme() {
    return this.#themeSelect.value;
  }

  /**
   * Set theme
   * @param {string} themeId
   */
  set theme(themeId) {
    this.#themeSelect.value = themeId;
    themeManager.theme = themeId;
  }

  /**
   * Get dice color
   * @returns {string}
   */
  get diceColor() {
    return this.#diceColorSelect.value;
  }

  /**
   * Set dice color
   * @param {string} color
   */
  set diceColor(color) {
    this.#diceColorSelect.value = color;
    themeManager.diceColor = color;
  }

  /**
   * Get dice color offset for sprite
   * @returns {number}
   */
  get diceColorOffset() {
    return themeManager.diceColorOffset;
  }

  /**
   * Get juggle/roll time in ms
   * @returns {number}
   */
  get juggleTime() {
    return parseInt(this.#juggleTimeSelect.value, 10) || 200;
  }

  /**
   * Set juggle time
   * @param {number} ms
   */
  set juggleTime(ms) {
    this.#juggleTimeSelect.value = ms;
    this.#saveSettings();
  }

  /**
   * Check if sound is enabled
   * @returns {boolean}
   */
  get isSoundEnabled() {
    return this.#soundCheckbox.checked;
  }

  /**
   * Enable/disable sound
   * @param {boolean} enabled
   */
  set isSoundEnabled(enabled) {
    this.#soundCheckbox.checked = enabled;
    audioService.enabled = enabled;
  }

  /**
   * Check if tooltips are enabled
   * @returns {boolean}
   */
  get isTooltipsEnabled() {
    return this.#tooltipsCheckbox.checked;
  }

  /**
   * Enable/disable tooltips
   * @param {boolean} enabled
   */
  set isTooltipsEnabled(enabled) {
    this.#tooltipsCheckbox.checked = enabled;
    this.#saveSettings();
  }
}

customElements.define('yambo-options', YamboOptions);
