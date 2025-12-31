/**
 * Yambo Log Component
 * Displays game messages, turn counter, and clock
 */

import { gameState } from '../services/game-state.js';
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

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .form-group {
      flex: 1;
    }

    label {
      display: block;
      color: var(--label-color, #fff);
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.9);
    }

    input[readonly] {
      background: rgba(255, 255, 255, 0.7);
      cursor: default;
    }

    .message-area {
      height: 120px;
      overflow-y: auto;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--fieldset-border-color, #2f2727);
      border-radius: 4px;
      color: var(--text-color, #fff);
      font-size: 0.8rem;
      line-height: 1.4;
    }
  </style>

  <fieldset>
    <legend>Game Log</legend>
    <div class="form-row">
      <div class="form-group">
        <label for="turn">Turn</label>
        <input type="text" id="turn" class="turn" value="0" readonly />
      </div>
      <div class="form-group">
        <label for="clock">Time</label>
        <input type="text" id="clock" class="clock" readonly />
      </div>
    </div>
    <div class="message-area"></div>
  </fieldset>
`;

export class YamboLog extends HTMLElement {
  #clockInterval = null;
  #turnInput;
  #clockInput;
  #messageArea;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#cacheElements();
    this.#bindEvents();
    this.#startClock();
  }

  disconnectedCallback() {
    if (this.#clockInterval) {
      clearInterval(this.#clockInterval);
    }
  }

  #cacheElements() {
    this.#turnInput = this.shadowRoot.querySelector('.turn');
    this.#clockInput = this.shadowRoot.querySelector('.clock');
    this.#messageArea = this.shadowRoot.querySelector('.message-area');
  }

  #bindEvents() {
    // Listen to game state changes
    gameState.on('turnChange', (e) => {
      this.#turnInput.value = e.detail.rollCount || 0;
    });

    gameState.on('rollChange', (e) => {
      this.#turnInput.value = e.detail.rollCount;
    });

    gameState.on('reset', () => {
      this.#turnInput.value = 0;
      this.#messageArea.innerHTML = '';
    });
  }

  #startClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.#clockInput.value = `${hours}:${minutes}:${seconds}`;
    };

    updateClock();
    this.#clockInterval = setInterval(updateClock, 1000);
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current turn/roll count
   * @returns {number}
   */
  get turn() {
    return parseInt(this.#turnInput.value, 10) || 0;
  }

  /**
   * Set turn/roll count
   * @param {number} value
   */
  set turn(value) {
    this.#turnInput.value = value;
  }

  /**
   * Get current clock time
   * @returns {string}
   */
  get clockTime() {
    return this.#clockInput.value;
  }

  /**
   * Add a message to the log
   * @param {Object} options
   * @param {string} options.message - Message text
   * @param {boolean} [options.isTimed=false] - Prefix with timestamp
   * @param {boolean} [options.isError=false] - Play error sound
   * @param {boolean} [options.isNewline=true] - Add line break after
   */
  addMessage(options) {
    const {
      message,
      isTimed = false,
      isError = false,
      isNewline = true
    } = options;

    let output = '';

    if (isTimed) {
      output += `${this.clockTime}: `;
    }

    output += message;

    if (isNewline) {
      output += '<br />';
    }

    this.#messageArea.innerHTML += output;
    this.#scrollToBottom();

    if (isError) {
      audioService.playError();
    }
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.#messageArea.innerHTML = '';
  }

  /**
   * Log a roll message
   * @param {number} rollNumber - Roll number (1, 2, or 3)
   * @param {number[]} [diceValues] - Optional dice values to display
   */
  logRoll(rollNumber, diceValues) {
    const rollNames = ['First roll', 'Second roll', 'Last roll'];
    let message = rollNames[rollNumber - 1] || `Roll ${rollNumber}`;

    if (diceValues) {
      message += ` (${diceValues.join(' : ')})`;
    }

    this.addMessage({
      message,
      isTimed: true,
      isError: false,
      isNewline: true
    });
  }

  /**
   * Log a combination message
   * @param {string} comboName - Name of the combination
   */
  logCombination(comboName) {
    this.addMessage({
      message: ` -- ${comboName} --`,
      isTimed: false,
      isError: false,
      isNewline: true
    });
  }

  /**
   * Log a save action
   * @param {string} cellName - Name of the saved cell
   * @param {number} score - Score saved
   */
  logSave(cellName, score) {
    this.addMessage({
      message: `Saved ${score} to ${cellName}`,
      isTimed: true,
      isError: false,
      isNewline: true
    });
  }

  /**
   * Log an error/warning
   * @param {string} message
   */
  logError(message) {
    this.addMessage({
      message: ` -- ${message} --`,
      isTimed: false,
      isError: true,
      isNewline: true
    });
  }

  /**
   * Log game over
   */
  logGameOver() {
    this.addMessage({
      message: ' -- GAME OVER --',
      isTimed: false,
      isError: true,
      isNewline: true
    });
  }

  #scrollToBottom() {
    this.#messageArea.scrollTop = this.#messageArea.scrollHeight;
  }
}

customElements.define('yambo-log', YamboLog);
