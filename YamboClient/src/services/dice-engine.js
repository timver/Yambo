/**
 * Dice Engine Service
 * Pure calculation logic for dice combinations and scoring
 * No DOM dependencies - can be used anywhere
 */

export class DiceEngine {
  /**
   * Calculate the total value of all dice
   * @param {number[]} values - Array of 5 dice values (1-6)
   * @returns {number} Sum of all dice
   */
  getTotal(values) {
    return values.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Count occurrences of each dice value (1-6)
   * @param {number[]} values - Array of 5 dice values
   * @returns {number[]} Array of 6 counts [count of 1s, count of 2s, ...]
   */
  getCounts(values) {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const val of values) {
      if (val >= 1 && val <= 6) {
        counts[val - 1]++;
      }
    }
    return counts;
  }

  /**
   * Count dice with a specific value
   * @param {number[]} values - Array of 5 dice values
   * @param {number} target - Value to count (1-6)
   * @returns {number} Count of dice with that value
   */
  getCount(values, target) {
    return values.filter(v => v === target).length;
  }

  /**
   * Calculate score for upper section (ones through sixes)
   * @param {number[]} values - Array of 5 dice values
   * @param {number} target - Target value (1-6)
   * @returns {number} Sum of dice matching target value
   */
  getUpperScore(values, target) {
    return this.getCount(values, target) * target;
  }

  /**
   * Check for three of a kind (3 dice with same value)
   * @param {number[]} values - Array of 5 dice values
   * @returns {boolean}
   */
  isThreeOfAKind(values) {
    return this.getCounts(values).includes(3);
  }

  /**
   * Check for four of a kind (4 dice with same value)
   * @param {number[]} values - Array of 5 dice values
   * @returns {boolean}
   */
  isFourOfAKind(values) {
    return this.getCounts(values).includes(4);
  }

  /**
   * Check for full house (3 of a kind + 2 of a kind, or 5 of a kind)
   * @param {number[]} values - Array of 5 dice values
   * @returns {boolean}
   */
  isFullHouse(values) {
    const counts = this.getCounts(values);
    return (counts.includes(3) && counts.includes(2)) || counts.includes(5);
  }

  /**
   * Check for straight (5 consecutive values)
   * Small straight: 1-2-3-4-5 or Large straight: 2-3-4-5-6
   * @param {number[]} values - Array of 5 dice values
   * @returns {boolean}
   */
  isStraight(values) {
    const has = (n) => values.includes(n);
    // Must have 2, 3, 4, 5 and either 1 or 6
    return has(2) && has(3) && has(4) && has(5) && (has(1) || has(6));
  }

  /**
   * Check for Yambo (5 of a kind - all dice same value)
   * @param {number[]} values - Array of 5 dice values
   * @returns {boolean}
   */
  isYambo(values) {
    return this.getCounts(values).includes(5);
  }

  /**
   * Get all matching combinations for current dice
   * @param {number[]} values - Array of 5 dice values
   * @returns {Object} Object with boolean flags for each combination
   */
  getCombinations(values) {
    return {
      threeOfAKind: this.isThreeOfAKind(values),
      fourOfAKind: this.isFourOfAKind(values),
      fullHouse: this.isFullHouse(values),
      straight: this.isStraight(values),
      yambo: this.isYambo(values)
    };
  }

  /**
   * Generate a random dice roll (1-6)
   * @returns {number}
   */
  roll() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /**
   * Generate 5 random dice values
   * @returns {number[]}
   */
  rollAll() {
    return Array.from({ length: 5 }, () => this.roll());
  }
}

// Singleton instance for convenience
export const diceEngine = new DiceEngine();
