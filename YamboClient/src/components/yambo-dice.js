/**
 * Yambo Dice Component
 * Handles dice rolling, selection, and display
 */

import { gameState } from '../services/game-state.js';
import { diceEngine } from '../services/dice-engine.js';
import { audioService } from '../services/audio-service.js';
import { themeManager } from '../services/theme-manager.js';
import { rollDie, stopDice } from '../utils/animation-helpers.js';

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

    .dice-container {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .die {
      width: 60px;
      height: 60px;
      border: 0 solid transparent;
      border-radius: 8px;
      cursor: pointer;
      background-image: url('art/spr_dice.png');
      background-repeat: no-repeat;
      background-position: 0 -300px; /* Default white dice */
      transition: border-color 0.2s, transform 0.1s;
    }

    .die:hover {
      transform: scale(1.05);
    }

    .die.held {
      border-color: var(--brand-color1, #009933);
      box-shadow: 0 0 8px var(--brand-color1, #009933);
    }

    .roll-button-container {
      text-align: center;
    }

    .roll-button {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: bold;
      border: 2px solid var(--brand-color1, #009933);
      border-radius: 8px;
      background: var(--brand-color2, #2f2727);
      color: var(--text-color, #fff);
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      text-transform: uppercase;
    }

    .roll-button:hover:not(:disabled) {
      background: var(--brand-color1, #009933);
    }

    .roll-button:active:not(:disabled) {
      transform: scale(0.98);
    }

    .roll-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .roll-button.rolling {
      background: var(--brand-color1, #009933);
    }

    .dice-info {
      text-align: center;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--label-color, #fff);
      opacity: 0.8;
    }
  </style>

  <fieldset>
    <legend>Dice</legend>
    <div class="dice-container">
      <button type="button" class="die" data-index="0" data-value="1"></button>
      <button type="button" class="die" data-index="1" data-value="2"></button>
      <button type="button" class="die" data-index="2" data-value="3"></button>
      <button type="button" class="die" data-index="3" data-value="4"></button>
      <button type="button" class="die" data-index="4" data-value="5"></button>
    </div>
    <div class="roll-button-container">
      <button type="button" class="roll-button">Roll Dice</button>
    </div>
    <div class="dice-info">Click dice to hold them</div>
  </fieldset>
`;

export class YamboDice extends HTMLElement {
  #dice;
  #rollButton;
  #infoText;
  #isRolling = false;
  #juggleTime = 200;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#cacheElements();
    this.#bindEvents();
    this.#updateDiceDisplay();
  }

  #cacheElements() {
    this.#dice = [...this.shadowRoot.querySelectorAll('.die')];
    this.#rollButton = this.shadowRoot.querySelector('.roll-button');
    this.#infoText = this.shadowRoot.querySelector('.dice-info');
  }

  #bindEvents() {
    // Dice click - toggle hold
    this.#dice.forEach(die => {
      die.addEventListener('click', (e) => this.#handleDieClick(e));
    });

    // Roll button - mousedown starts, mouseup ends
    this.#rollButton.addEventListener('mousedown', (e) => this.#startRoll(e));
    this.#rollButton.addEventListener('mouseup', () => this.#endRoll());

    // Touch support
    this.#rollButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.#startRoll(e);
    });
    this.#rollButton.addEventListener('touchend', () => this.#endRoll());

    // Listen for game state changes
    gameState.on('reset', () => this.#reset());
    gameState.on('rollChange', () => this.#updateButtonText());

    // Listen for dice color changes
    themeManager.on('diceColorChange', () => this.#updateDiceDisplay());
  }

  #handleDieClick(e) {
    if (this.#isRolling) return;

    const die = e.currentTarget;
    const index = parseInt(die.dataset.index, 10);
    const isHeld = die.classList.toggle('held');

    gameState.setHold(index, isHeld);

    // Play sound
    if (isHeld) {
      audioService.play('select3');
    } else {
      audioService.play('deselect4');
    }

    // Multi-select with Ctrl/Cmd - select all dice with same value
    if (e.ctrlKey || e.metaKey) {
      const value = parseInt(die.dataset.value, 10);
      this.#dice.forEach((d, i) => {
        if (parseInt(d.dataset.value, 10) === value) {
          d.classList.toggle('held', isHeld);
          gameState.setHold(i, isHeld);
        }
      });
    }
  }

  #startRoll(e) {
    e.preventDefault();

    if (this.#isRolling) return;

    if (!gameState.canRoll) {
      audioService.playError();
      return;
    }

    this.#isRolling = true;
    this.#rollButton.classList.add('rolling');

    // Start juggle sound
    audioService.startJuggle();

    // Start rolling animation on unheld dice
    const unheldDice = this.#dice.filter((_, i) => !gameState.isHeld(i));
    unheldDice.forEach(die => {
      rollDie(die, {
        colorOffset: themeManager.diceColorOffset,
        keepJuggling: true,
        duration: 100
      });
    });
  }

  async #endRoll() {
    if (!this.#isRolling) return;

    this.#isRolling = false;
    audioService.stopJuggle();

    // Get unheld dice
    const unheldDice = this.#dice.filter((_, i) => !gameState.isHeld(i));

    // Stop animations and get final values
    stopDice(unheldDice);

    // Roll each unheld die with final animation
    const rollPromises = unheldDice.map(die => {
      return new Promise(resolve => {
        rollDie(die, {
          colorOffset: themeManager.diceColorOffset,
          keepJuggling: false,
          duration: this.#juggleTime
        }, (value) => {
          die.dataset.value = value;
          resolve(value);
        });
      });
    });

    await Promise.all(rollPromises);

    // Update game state with new values
    const newValues = this.#dice.map(d => parseInt(d.dataset.value, 10));
    gameState.diceValues = newValues;
    gameState.incrementRoll();

    // Play roll sound
    audioService.playRoll();

    // Check for combinations and play sounds
    this.#checkCombinations(newValues);

    // Update button state
    this.#rollButton.classList.remove('rolling');
    this.#updateButtonText();

    // Emit roll complete event
    this.dispatchEvent(new CustomEvent('rollcomplete', {
      bubbles: true,
      detail: { values: newValues, combinations: diceEngine.getCombinations(newValues) }
    }));
  }

  #checkCombinations(values) {
    const combos = diceEngine.getCombinations(values);

    if (combos.yambo) {
      audioService.playCombination('yambo');
      this.#emitCombination('Yambo!!!');
    } else if (combos.straight) {
      audioService.playCombination('straight');
      this.#emitCombination('Straight');
    } else if (combos.fullHouse) {
      audioService.playCombination('fullHouse');
      this.#emitCombination('Full House');
    } else if (combos.fourOfAKind) {
      audioService.playCombination('fourOfAKind');
      this.#emitCombination('Four of a Kind');
    } else if (combos.threeOfAKind) {
      audioService.playCombination('threeOfAKind');
      this.#emitCombination('Three of a Kind');
    }
  }

  #emitCombination(name) {
    this.dispatchEvent(new CustomEvent('combination', {
      bubbles: true,
      detail: { name }
    }));
  }

  #updateButtonText() {
    const roll = gameState.rollCount;
    if (roll === 0) {
      this.#rollButton.textContent = 'Roll Dice';
    } else if (roll === 1) {
      this.#rollButton.textContent = '2nd Roll';
    } else if (roll === 2) {
      this.#rollButton.textContent = 'Last Roll';
    } else {
      this.#rollButton.textContent = 'Roll Dice';
    }
  }

  #updateDiceDisplay() {
    const colorOffset = themeManager.diceColorOffset;
    this.#dice.forEach(die => {
      const value = parseInt(die.dataset.value, 10) || 1;
      const xOffset = (value - 1) * -60;
      die.style.backgroundPosition = `${xOffset}px ${colorOffset}px`;
    });
  }

  #reset() {
    // Reset all dice
    this.#dice.forEach((die, i) => {
      die.dataset.value = i + 1;
      die.classList.remove('held');
    });
    this.#updateDiceDisplay();
    this.#updateButtonText();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current dice values
   * @returns {number[]}
   */
  get values() {
    return this.#dice.map(d => parseInt(d.dataset.value, 10));
  }

  /**
   * Set dice values
   * @param {number[]} values
   */
  set values(values) {
    values.forEach((val, i) => {
      if (this.#dice[i]) {
        this.#dice[i].dataset.value = val;
      }
    });
    this.#updateDiceDisplay();
    gameState.diceValues = values;
  }

  /**
   * Get dice total
   * @returns {number}
   */
  get total() {
    return diceEngine.getTotal(this.values);
  }

  /**
   * Get count of a specific value
   * @param {number} value
   * @returns {number}
   */
  getCount(value) {
    return diceEngine.getCount(this.values, value);
  }

  /**
   * Check if full house
   * @returns {boolean}
   */
  get isFullHouse() {
    return diceEngine.isFullHouse(this.values);
  }

  /**
   * Check if straight
   * @returns {boolean}
   */
  get isStraight() {
    return diceEngine.isStraight(this.values);
  }

  /**
   * Check if yambo
   * @returns {boolean}
   */
  get isYambo() {
    return diceEngine.isYambo(this.values);
  }

  /**
   * Set juggle/roll time
   * @param {number} ms
   */
  set juggleTime(ms) {
    this.#juggleTime = ms;
  }

  /**
   * Get juggle/roll time
   * @returns {number}
   */
  get juggleTime() {
    return this.#juggleTime;
  }

  /**
   * Clear all held dice
   */
  clearHeld() {
    this.#dice.forEach((die, i) => {
      die.classList.remove('held');
      gameState.setHold(i, false);
    });
  }

  /**
   * Get unheld dice elements
   * @returns {HTMLElement[]}
   */
  getUnheldDice() {
    return this.#dice.filter((_, i) => !gameState.isHeld(i));
  }

  /**
   * Get held dice elements
   * @returns {HTMLElement[]}
   */
  getHeldDice() {
    return this.#dice.filter((_, i) => gameState.isHeld(i));
  }
}

customElements.define('yambo-dice', YamboDice);
