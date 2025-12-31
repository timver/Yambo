/**
 * Yambo Sheet Component
 * Score sheet with 5 columns and scoring logic
 *
 * Column rules:
 * - Column 1 (dn): Chronological top-to-bottom, 3 tries
 * - Column 2 (one): Random order, 1 try only
 * - Column 3 (w): Random order, 3 tries
 * - Column 4 (two): Random order, 2 tries
 * - Column 5 (up): Chronological bottom-to-top, 3 tries
 */

import { gameState, GameState } from '../services/game-state.js';
import { diceEngine } from '../services/dice-engine.js';
import { audioService } from '../services/audio-service.js';

// Row definitions
const UPPER_ROWS = [
  { id: 'ones', label: 'Ones', multiplier: 1 },
  { id: 'twos', label: 'Twos', multiplier: 2 },
  { id: 'threes', label: 'Threes', multiplier: 3 },
  { id: 'fours', label: 'Fours', multiplier: 4 },
  { id: 'fives', label: 'Fives', multiplier: 5 },
  { id: 'sixes', label: 'Sixes', multiplier: 6 }
];

const LOWER_ROWS = [
  { id: 'fullHouse', label: 'Full House', fixedScore: 20 },
  { id: 'straight', label: 'Straight', fixedScore: 30 },
  { id: 'chancePlus', label: 'Chance +', useTotal: true },
  { id: 'chanceMinus', label: 'Chance -', useTotal: true },
  { id: 'yambo', label: 'YAMBO!', fixedScore: 40 }
];

const COLUMNS = [
  { id: 'dn', label: '↓', maxTries: 3, order: 'down' },
  { id: 'w', label: 'W', maxTries: 3, order: 'random' },
  { id: 'up', label: '↑', maxTries: 3, order: 'up' },
  { id: 'one', label: '1', maxTries: 1, order: 'random' },
  { id: 'two', label: '2', maxTries: 2, order: 'random' }
];

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .sheet-container {
      background: var(--fieldset-bg, rgba(0, 0, 0, 0.8));
      border: var(--panel-border-width, 2px) solid var(--fieldset-border-color, #2f2727);
      border-radius: var(--fieldset-border-radius, 10px);
      padding: 1rem;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    th, td {
      padding: 0.25rem;
      text-align: center;
      border: 1px solid var(--fieldset-border-color, #2f2727);
    }

    th {
      background: var(--brand-color2, #2f2727);
      color: var(--text-color, #fff);
      cursor: pointer;
      user-select: none;
    }

    th:first-child {
      cursor: default;
      text-align: left;
      width: 80px;
    }

    th.scratched {
      opacity: 0.5;
      text-decoration: line-through;
    }

    td:first-child {
      text-align: left;
      color: var(--label-color, #fff);
      font-weight: bold;
    }

    .section-divider td {
      background: var(--brand-color1, #009933);
      height: 2px;
      padding: 0;
    }

    .total-row td {
      background: var(--brand-color2, #2f2727);
      font-weight: bold;
    }

    input {
      width: 100%;
      max-width: 50px;
      padding: 0.25rem;
      border: 1px solid transparent;
      border-radius: 4px;
      text-align: center;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-color, #fff);
    }

    input.available {
      background: rgba(255, 255, 255, 0.9);
      color: #000;
      cursor: pointer;
      border-color: var(--brand-color1, #009933);
    }

    input.available:hover {
      background: var(--brand-color1, #009933);
      color: #fff;
    }

    input.saved {
      background: rgba(0, 153, 51, 0.3);
      cursor: default;
    }

    input.scratched {
      color: #ff6a00;
      background: rgba(255, 106, 0, 0.2);
    }

    input:read-only {
      cursor: default;
    }

    .player-name {
      color: var(--brand-color1, #009933);
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
  </style>

  <div class="sheet-container">
    <div class="player-name"></div>
    <table>
      <thead></thead>
      <tbody></tbody>
    </table>
  </div>
`;

export class YamboSheet extends HTMLElement {
  #table;
  #thead;
  #tbody;
  #playerNameEl;
  #cells = {};
  #columnStates = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#cacheElements();
    this.#buildTable();
    this.#bindEvents();
    // Initialize max rolls based on all columns being available
    this.#updateMaxRollsForAvailableColumns();
  }

  #cacheElements() {
    this.#table = this.shadowRoot.querySelector('table');
    this.#thead = this.shadowRoot.querySelector('thead');
    this.#tbody = this.shadowRoot.querySelector('tbody');
    this.#playerNameEl = this.shadowRoot.querySelector('.player-name');
  }

  #buildTable() {
    // Build header
    let headerHtml = '<tr><th></th>';
    COLUMNS.forEach(col => {
      headerHtml += `<th data-col="${col.id}" title="${col.label}">${col.label}</th>`;
      this.#columnStates[col.id] = { scratched: false };
    });
    headerHtml += '</tr>';
    this.#thead.innerHTML = headerHtml;

    // Build body
    let bodyHtml = '';

    // Upper section
    UPPER_ROWS.forEach(row => {
      bodyHtml += this.#buildRow(row, 'upper');
    });

    // Upper total row
    bodyHtml += '<tr class="total-row"><td>Upper Total</td>';
    COLUMNS.forEach(col => {
      bodyHtml += `<td><input type="text" class="upper-total" data-col="${col.id}" readonly /></td>`;
    });
    bodyHtml += '</tr>';

    // Bonus row
    bodyHtml += '<tr class="total-row"><td>Bonus (63+)</td>';
    COLUMNS.forEach(col => {
      bodyHtml += `<td><input type="text" class="bonus" data-col="${col.id}" readonly /></td>`;
    });
    bodyHtml += '</tr>';

    // Divider
    bodyHtml += '<tr class="section-divider"><td colspan="6"></td></tr>';

    // Lower section
    LOWER_ROWS.forEach(row => {
      bodyHtml += this.#buildRow(row, 'lower');
    });

    // Lower total row
    bodyHtml += '<tr class="total-row"><td>Lower Total</td>';
    COLUMNS.forEach(col => {
      bodyHtml += `<td><input type="text" class="lower-total" data-col="${col.id}" readonly /></td>`;
    });
    bodyHtml += '</tr>';

    // Grand total row
    bodyHtml += '<tr class="total-row"><td><strong>TOTAL</strong></td>';
    COLUMNS.forEach(col => {
      bodyHtml += `<td><input type="text" class="grand-total" data-col="${col.id}" readonly /></td>`;
    });
    bodyHtml += '</tr>';

    this.#tbody.innerHTML = bodyHtml;

    // Cache cell references
    this.#cacheCells();
  }

  #buildRow(row, section) {
    let html = `<tr data-row="${row.id}" data-section="${section}"><td>${row.label}</td>`;
    COLUMNS.forEach(col => {
      const cellId = `${col.id}-${row.id}`;
      html += `<td><input type="text" id="${cellId}" data-col="${col.id}" data-row="${row.id}" data-section="${section}" readonly /></td>`;
    });
    html += '</tr>';
    return html;
  }

  #cacheCells() {
    this.#cells = {};
    this.shadowRoot.querySelectorAll('input[data-row]').forEach(input => {
      const col = input.dataset.col;
      const row = input.dataset.row;
      if (!this.#cells[col]) this.#cells[col] = {};
      this.#cells[col][row] = input;
    });
  }

  #bindEvents() {
    // Column header click - toggle scratch state
    this.#thead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-col]');
      if (th) {
        this.#toggleColumnScratch(th.dataset.col);
      }
    });

    // Cell click - save score
    this.#tbody.addEventListener('click', (e) => {
      const input = e.target.closest('input.available');
      if (input) {
        this.#saveScore(input);
      }
    });

    // Game state events
    gameState.on('playerNameChange', (e) => {
      this.#playerNameEl.textContent = e.detail.name;
    });

    gameState.on('reset', () => this.#reset());

    gameState.on('diceChange', () => this.#updateAvailableCells());
  }

  #toggleColumnScratch(colId) {
    const th = this.#thead.querySelector(`th[data-col="${colId}"]`);
    const state = this.#columnStates[colId];
    state.scratched = !state.scratched;
    th.classList.toggle('scratched', state.scratched);
    audioService.playSave();
    this.#updateAvailableCells();
  }

  #updateAvailableCells() {
    const values = gameState.diceValues;
    const rollCount = gameState.rollCount;

    // Clear all available states
    this.shadowRoot.querySelectorAll('input.available').forEach(input => {
      input.classList.remove('available');
      if (!input.classList.contains('saved') && !input.classList.contains('scratched')) {
        input.value = '';
      }
    });

    if (rollCount === 0) return;

    // Calculate potential scores
    const scores = this.#calculateScores(values);

    // Update available cells based on column rules
    COLUMNS.forEach(col => {
      if (this.#columnStates[col.id]?.scratched) return;

      // Check if column is valid for current roll count
      if (!this.#isColumnValidForRoll(col, rollCount)) return;

      // Get next available cell for ordered columns
      const nextCell = this.#getNextAvailableCell(col);

      // Update cells
      [...UPPER_ROWS, ...LOWER_ROWS].forEach(row => {
        const cell = this.#cells[col.id]?.[row.id];
        if (!cell || cell.classList.contains('saved') || cell.classList.contains('scratched')) return;

        // For ordered columns, only show the next cell
        if (col.order !== 'random') {
          if (nextCell && cell.id !== nextCell.id) return;
        }

        const score = scores[row.id];
        if (score !== undefined) {
          cell.value = score || '';
          cell.classList.add('available');
        }
      });
    });
  }

  #calculateScores(values) {
    const counts = diceEngine.getCounts(values);
    const total = diceEngine.getTotal(values);
    const scores = {};

    // Upper section
    UPPER_ROWS.forEach((row, i) => {
      scores[row.id] = counts[i] * row.multiplier;
    });

    // Lower section
    scores.fullHouse = diceEngine.isFullHouse(values) ? 20 : 0;
    scores.straight = diceEngine.isStraight(values) ? 30 : 0;
    scores.chancePlus = total;
    scores.chanceMinus = total;
    scores.yambo = diceEngine.isYambo(values) ? 40 : 0;

    return scores;
  }

  #isColumnValidForRoll(col, rollCount) {
    // Columns with max tries restriction
    if (col.maxTries === 1 && rollCount !== 1) return false;
    if (col.maxTries === 2 && rollCount > 2) return false;
    return true;
  }

  #getNextAvailableCell(col) {
    const allRows = [...UPPER_ROWS, ...LOWER_ROWS];
    const rows = col.order === 'up' ? [...allRows].reverse() : allRows;

    for (const row of rows) {
      const cell = this.#cells[col.id]?.[row.id];
      if (cell && !cell.classList.contains('saved') && !cell.classList.contains('scratched')) {
        return cell;
      }
    }
    return null;
  }

  #saveScore(input) {
    const col = input.dataset.col;
    const row = input.dataset.row;
    const section = input.dataset.section;
    const value = parseInt(input.value, 10) || 0;

    // Validate chance+/- rules
    if (row === 'chancePlus' || row === 'chanceMinus') {
      if (!this.#validateChance(col, row, value)) return;
    }

    // Save the score
    if (value === 0) {
      input.value = '×';
      input.classList.add('scratched');
      audioService.playScratch();
    } else {
      input.classList.add('saved');
      audioService.playSave();
    }

    input.classList.remove('available');
    gameState.setScore(COLUMNS.findIndex(c => c.id === col) + 1, row, value);

    // Recalculate totals
    this.#calculateTotals(col);

    // Clear available cells and reset turn
    this.#clearAvailableCells();

    // Update max rolls for next turn based on remaining columns
    this.#updateMaxRollsForAvailableColumns();

    // Emit save event
    this.dispatchEvent(new CustomEvent('scoresaved', {
      bubbles: true,
      detail: { column: col, row, value, section }
    }));

    // Check game over
    if (this.#isGameOver()) {
      this.dispatchEvent(new CustomEvent('gameover', { bubbles: true }));
    }
  }

  #validateChance(col, row, value) {
    const plusCell = this.#cells[col]?.chancePlus;
    const minusCell = this.#cells[col]?.chanceMinus;

    if (row === 'chanceMinus' && plusCell?.classList.contains('saved')) {
      const plusValue = parseInt(plusCell.value, 10) || 0;
      if (value >= plusValue) {
        // Invalid - chance- must be less than chance+
        audioService.playError();
        return false;
      }
    }

    if (row === 'chancePlus' && minusCell?.classList.contains('saved')) {
      const minusValue = parseInt(minusCell.value, 10) || 0;
      if (value <= minusValue) {
        // Invalid - chance+ must be greater than chance-
        audioService.playError();
        return false;
      }
    }

    return true;
  }

  #calculateTotals(col) {
    let upperTotal = 0;
    let lowerTotal = 0;

    // Sum upper section
    UPPER_ROWS.forEach(row => {
      const cell = this.#cells[col]?.[row.id];
      if (cell?.classList.contains('saved')) {
        upperTotal += parseInt(cell.value, 10) || 0;
      }
    });

    // Sum lower section
    LOWER_ROWS.forEach(row => {
      const cell = this.#cells[col]?.[row.id];
      if (cell?.classList.contains('saved')) {
        lowerTotal += parseInt(cell.value, 10) || 0;
      }
    });

    // Calculate bonus
    const bonus = upperTotal >= GameState.UPPER_BONUS_THRESHOLD ? GameState.UPPER_BONUS_VALUE : 0;

    // Update totals
    const upperTotalInput = this.shadowRoot.querySelector(`.upper-total[data-col="${col}"]`);
    const bonusInput = this.shadowRoot.querySelector(`.bonus[data-col="${col}"]`);
    const lowerTotalInput = this.shadowRoot.querySelector(`.lower-total[data-col="${col}"]`);
    const grandTotalInput = this.shadowRoot.querySelector(`.grand-total[data-col="${col}"]`);

    if (upperTotalInput) upperTotalInput.value = upperTotal || '';
    if (bonusInput) bonusInput.value = bonus || '';
    if (lowerTotalInput) lowerTotalInput.value = lowerTotal || '';
    if (grandTotalInput) grandTotalInput.value = upperTotal + bonus + lowerTotal || '';
  }

  #clearAvailableCells() {
    this.shadowRoot.querySelectorAll('input.available').forEach(input => {
      input.classList.remove('available');
      input.value = '';
    });
  }

  #getAvailableColumns() {
    // Get columns that still have at least one empty cell (not saved or scratched)
    const available = [];
    COLUMNS.forEach(col => {
      if (this.#columnStates[col.id]?.scratched) return;

      // Check if column has any empty cells
      const hasEmpty = [...UPPER_ROWS, ...LOWER_ROWS].some(row => {
        const cell = this.#cells[col.id]?.[row.id];
        return cell && !cell.classList.contains('saved') && !cell.classList.contains('scratched');
      });

      if (hasEmpty) {
        available.push(col.id);
      }
    });
    return available;
  }

  #updateMaxRollsForAvailableColumns() {
    const availableColumns = this.#getAvailableColumns();
    gameState.updateMaxRollsFromColumns(availableColumns);
  }

  #isGameOver() {
    const allCells = this.shadowRoot.querySelectorAll('input[data-row]');
    const savedOrScratched = this.shadowRoot.querySelectorAll('input[data-row].saved, input[data-row].scratched');
    return allCells.length === savedOrScratched.length;
  }

  #reset() {
    // Clear all cells
    this.shadowRoot.querySelectorAll('input').forEach(input => {
      input.value = '';
      input.classList.remove('available', 'saved', 'scratched');
    });

    // Reset column states
    this.#thead.querySelectorAll('th.scratched').forEach(th => {
      th.classList.remove('scratched');
    });
    Object.keys(this.#columnStates).forEach(col => {
      this.#columnStates[col].scratched = false;
    });

    this.#playerNameEl.textContent = '';

    // Reset max rolls to default (all columns available)
    this.#updateMaxRollsForAvailableColumns();
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Update available cells with current dice values
   */
  updateScores() {
    this.#updateAvailableCells();
  }

  /**
   * Get total score for a column
   * @param {string} colId - Column ID
   * @returns {number}
   */
  getColumnTotal(colId) {
    const input = this.shadowRoot.querySelector(`.grand-total[data-col="${colId}"]`);
    return parseInt(input?.value, 10) || 0;
  }

  /**
   * Get grand total across all columns
   * @returns {number}
   */
  getGrandTotal() {
    let total = 0;
    COLUMNS.forEach(col => {
      total += this.getColumnTotal(col.id);
    });
    return total;
  }

  /**
   * Check if game is over
   * @returns {boolean}
   */
  get isGameOver() {
    return this.#isGameOver();
  }

  /**
   * Set player name display
   * @param {string} name
   */
  set playerName(name) {
    this.#playerNameEl.textContent = name;
  }
}

customElements.define('yambo-sheet', YamboSheet);
