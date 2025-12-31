/**
 * Game State Service
 * Centralized state management using EventTarget for decoupled updates
 * Replaces the circular ns.instance.* pattern from legacy code
 */

export class GameState extends EventTarget {
  // Game constants
  static MAX_TURNS = 75; // 15 rows × 5 columns
  static DEFAULT_MAX_ROLLS = 3;
  static UPPER_BONUS_THRESHOLD = 63;
  static UPPER_BONUS_VALUE = 30;

  // Column max tries configuration
  static COLUMN_MAX_TRIES = {
    dn: 3,
    w: 3,
    up: 3,
    one: 1,
    two: 2
  };

  #turn = 0;
  #rollCount = 0;
  #maxRollsForTurn = 3;
  #diceValues = [1, 2, 3, 4, 5];
  #diceHeld = [false, false, false, false, false];
  #playerName = 'Player 1';
  #scores = {};
  #gameOver = false;

  constructor() {
    super();
    this.#initScores();
  }

  /**
   * Initialize empty score grid
   * 5 columns × 15 rows (ones through sixes, plus lower section)
   */
  #initScores() {
    this.#scores = {};
    for (let col = 1; col <= 5; col++) {
      this.#scores[col] = {};
    }
  }

  // ==========================================================================
  // Turn Management
  // ==========================================================================

  get turn() {
    return this.#turn;
  }

  get rollCount() {
    return this.#rollCount;
  }

  get canRoll() {
    return !this.#gameOver && this.#rollCount < this.#maxRollsForTurn;
  }

  get maxRollsForTurn() {
    return this.#maxRollsForTurn;
  }

  set maxRollsForTurn(value) {
    this.#maxRollsForTurn = Math.max(1, Math.min(3, value));
    this.#emit('maxRollsChange', { maxRolls: this.#maxRollsForTurn });
  }

  /**
   * Calculate max rolls based on available columns
   * @param {string[]} availableColumns - Array of column IDs with empty cells
   */
  updateMaxRollsFromColumns(availableColumns) {
    if (!availableColumns || availableColumns.length === 0) {
      this.#maxRollsForTurn = 0;
      return;
    }

    // Find the highest max tries among available columns
    let maxTries = 0;
    for (const colId of availableColumns) {
      const tries = GameState.COLUMN_MAX_TRIES[colId] || 0;
      if (tries > maxTries) {
        maxTries = tries;
      }
    }
    this.#maxRollsForTurn = maxTries;
    this.#emit('maxRollsChange', { maxRolls: this.#maxRollsForTurn });
  }

  get isGameOver() {
    return this.#gameOver;
  }

  /**
   * Increment turn counter
   * @returns {number} New turn count
   */
  nextTurn() {
    this.#turn++;
    this.#rollCount = 0;
    this.#diceHeld = [false, false, false, false, false];

    if (this.#turn >= GameState.MAX_TURNS) {
      this.#gameOver = true;
      this.#emit('gameOver', { turn: this.#turn });
    }

    this.#emit('turnChange', { turn: this.#turn, rollCount: this.#rollCount });
    return this.#turn;
  }

  /**
   * Increment roll counter within current turn
   * @returns {number} New roll count
   */
  incrementRoll() {
    if (this.canRoll) {
      this.#rollCount++;
      this.#emit('rollChange', { rollCount: this.#rollCount });
    }
    return this.#rollCount;
  }

  /**
   * Check if current turn is valid (can still roll or save)
   * @returns {boolean}
   */
  isValidTurn() {
    return !this.#gameOver && this.#turn < GameState.MAX_TURNS;
  }

  // ==========================================================================
  // Dice State
  // ==========================================================================

  get diceValues() {
    return [...this.#diceValues];
  }

  set diceValues(values) {
    if (Array.isArray(values) && values.length === 5) {
      this.#diceValues = [...values];
      this.#emit('diceChange', { values: this.diceValues });
    }
  }

  get diceHeld() {
    return [...this.#diceHeld];
  }

  /**
   * Toggle hold state for a die
   * @param {number} index - Die index (0-4)
   * @returns {boolean} New hold state
   */
  toggleHold(index) {
    if (index >= 0 && index < 5) {
      this.#diceHeld[index] = !this.#diceHeld[index];
      this.#emit('diceHoldChange', { index, held: this.#diceHeld[index] });
    }
    return this.#diceHeld[index];
  }

  /**
   * Set hold state for a die
   * @param {number} index - Die index (0-4)
   * @param {boolean} held - Hold state
   */
  setHold(index, held) {
    if (index >= 0 && index < 5) {
      this.#diceHeld[index] = held;
      this.#emit('diceHoldChange', { index, held });
    }
  }

  /**
   * Check if a die is held
   * @param {number} index - Die index (0-4)
   * @returns {boolean}
   */
  isHeld(index) {
    return this.#diceHeld[index] ?? false;
  }

  /**
   * Get indices of unheld dice (to be rolled)
   * @returns {number[]}
   */
  getUnheldIndices() {
    return this.#diceHeld
      .map((held, i) => held ? -1 : i)
      .filter(i => i >= 0);
  }

  /**
   * Update specific dice values (for rolling unheld dice)
   * @param {Object} updates - Map of index -> new value
   */
  updateDice(updates) {
    for (const [index, value] of Object.entries(updates)) {
      const i = parseInt(index);
      if (i >= 0 && i < 5 && value >= 1 && value <= 6) {
        this.#diceValues[i] = value;
      }
    }
    this.#emit('diceChange', { values: this.diceValues });
  }

  // ==========================================================================
  // Player
  // ==========================================================================

  get playerName() {
    return this.#playerName;
  }

  set playerName(name) {
    this.#playerName = name || 'Player 1';
    this.#emit('playerNameChange', { name: this.#playerName });
  }

  // ==========================================================================
  // Scores
  // ==========================================================================

  /**
   * Get score for a specific cell
   * @param {number} column - Column (1-5)
   * @param {string} row - Row identifier (e.g., 'ones', 'fullHouse')
   * @returns {number|null} Score or null if not set
   */
  getScore(column, row) {
    return this.#scores[column]?.[row] ?? null;
  }

  /**
   * Set score for a specific cell
   * @param {number} column - Column (1-5)
   * @param {string} row - Row identifier
   * @param {number} value - Score value
   */
  setScore(column, row, value) {
    if (!this.#scores[column]) {
      this.#scores[column] = {};
    }
    this.#scores[column][row] = value;
    this.#emit('scoreChange', { column, row, value });
  }

  /**
   * Check if a cell has a score
   * @param {number} column - Column (1-5)
   * @param {string} row - Row identifier
   * @returns {boolean}
   */
  hasScore(column, row) {
    return this.#scores[column]?.[row] !== undefined;
  }

  /**
   * Get all scores for a column
   * @param {number} column - Column (1-5)
   * @returns {Object}
   */
  getColumnScores(column) {
    return { ...this.#scores[column] };
  }

  /**
   * Get all scores
   * @returns {Object}
   */
  getAllScores() {
    const result = {};
    for (let col = 1; col <= 5; col++) {
      result[col] = { ...this.#scores[col] };
    }
    return result;
  }

  // ==========================================================================
  // Game Control
  // ==========================================================================

  /**
   * Reset game to initial state
   */
  reset() {
    this.#turn = 0;
    this.#rollCount = 0;
    this.#maxRollsForTurn = GameState.DEFAULT_MAX_ROLLS;
    this.#diceValues = [1, 2, 3, 4, 5];
    this.#diceHeld = [false, false, false, false, false];
    this.#gameOver = false;
    this.#initScores();
    this.#emit('reset', {});
  }

  // ==========================================================================
  // Event Helpers
  // ==========================================================================

  /**
   * Emit a custom event
   * @param {string} type - Event type
   * @param {Object} detail - Event detail
   */
  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Subscribe to state changes
   * @param {string} type - Event type
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(type, callback) {
    this.addEventListener(type, callback);
    return () => this.removeEventListener(type, callback);
  }
}

// Singleton instance for convenience
export const gameState = new GameState();
