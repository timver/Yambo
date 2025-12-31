/**
 * Yambo Toolbar Component
 * Panel control icons and game actions
 */

import { audioService } from '../services/audio-service.js';
import { gameState } from '../services/game-state.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .toolbar {
      background: var(--panel-bg, rgba(0, 0, 0, 0.8));
      border: var(--panel-border-width, 2px) solid var(--panel-border-color, #2f2727);
      border-radius: var(--panel-border-radius, 10px);
      padding: 0.5rem;
      margin-bottom: 1rem;
    }

    .toolbar-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .panel-icons {
      display: flex;
      gap: 0.25rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .panel-icons li {
      width: 24px;
      height: 24px;
      background: var(--brand-color2, #2f2727);
      border: 1px solid var(--brand-color1, #009933);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-color, #fff);
      transition: background-color 0.2s;
    }

    .panel-icons li:hover {
      background: var(--brand-color1, #009933);
    }

    .panel-icons li.active {
      background: var(--brand-color1, #009933);
    }

    .game-actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border: 1px solid var(--brand-color1, #009933);
      border-radius: 4px;
      background: var(--brand-color2, #2f2727);
      color: var(--text-color, #fff);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background: var(--brand-color1, #009933);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>

  <div class="toolbar">
    <div class="toolbar-inner">
      <ul class="panel-icons">
        <li data-panel="sheet" title="Score Sheet">S</li>
        <li data-panel="dice" title="Dice">D</li>
        <li data-panel="log" title="Game Log">L</li>
        <li data-panel="options" title="Options">O</li>
      </ul>
      <div class="game-actions">
        <button type="button" class="btn-new-game">New Game</button>
      </div>
    </div>
  </div>
`;

export class YamboToolbar extends HTMLElement {
  #panelIcons;
  #newGameBtn;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#cacheElements();
    this.#bindEvents();
  }

  #cacheElements() {
    this.#panelIcons = this.shadowRoot.querySelectorAll('.panel-icons li');
    this.#newGameBtn = this.shadowRoot.querySelector('.btn-new-game');
  }

  #bindEvents() {
    // Panel toggle icons
    this.#panelIcons.forEach(icon => {
      icon.addEventListener('click', () => {
        const panelName = icon.dataset.panel;
        this.#togglePanel(panelName);
        audioService.play(audioService.enabled ? 'minimize5' : null);
      });
    });

    // New game button
    this.#newGameBtn.addEventListener('click', () => {
      this.#confirmNewGame();
    });
  }

  #togglePanel(panelName) {
    const icon = this.shadowRoot.querySelector(`[data-panel="${panelName}"]`);
    const isActive = icon.classList.toggle('active');

    this.dispatchEvent(new CustomEvent('paneltoggle', {
      bubbles: true,
      detail: { panel: panelName, visible: !isActive }
    }));
  }

  #confirmNewGame() {
    const confirmed = confirm('Start a new game? Current progress will be lost.');
    if (confirmed) {
      gameState.reset();
      audioService.play('woosh');

      this.dispatchEvent(new CustomEvent('newgame', {
        bubbles: true
      }));
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get panel icon element
   * @param {string} panelName - Panel name (sheet, dice, log, options)
   * @returns {HTMLElement|null}
   */
  getIcon(panelName) {
    return this.shadowRoot.querySelector(`[data-panel="${panelName}"]`);
  }

  /**
   * Set panel icon active state
   * @param {string} panelName
   * @param {boolean} active
   */
  setIconActive(panelName, active) {
    const icon = this.getIcon(panelName);
    if (icon) {
      icon.classList.toggle('active', active);
    }
  }

  /**
   * Get all icon elements
   * @returns {NodeList}
   */
  get icons() {
    return this.#panelIcons;
  }
}

customElements.define('yambo-toolbar', YamboToolbar);
