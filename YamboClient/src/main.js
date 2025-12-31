/**
 * Yambo - Modern Entry Point
 * ES6+ modules with Web Components
 */

// Services (Phase 1)
import { DiceEngine, diceEngine } from './services/dice-engine.js';
import { AudioService, audioService } from './services/audio-service.js';
import { GameState, gameState } from './services/game-state.js';
import { ThemeManager, themeManager } from './services/theme-manager.js';

// Utils (Phase 2)
import * as dom from './utils/dom-helpers.js';
import * as animation from './utils/animation-helpers.js';

// Components (Phase 3)
import { YamboLog } from './components/yambo-log.js';
import { YamboOptions } from './components/yambo-options.js';
import { YamboToolbar } from './components/yambo-toolbar.js';
import { YamboDice } from './components/yambo-dice.js';
import { YamboSheet } from './components/yambo-sheet.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Yambo Modern v3.0.0 loaded');

  // Initialize theme (applies saved theme to body)
  themeManager.init();

  // Initialize audio (requires user interaction for autoplay policy)
  // Audio will be initialized on first user interaction
  document.addEventListener('click', async () => {
    await audioService.init();
  }, { once: true });

  // Wire up component interactions
  const diceComponent = document.querySelector('yambo-dice');
  const sheetComponent = document.querySelector('yambo-sheet');
  const logComponent = document.querySelector('yambo-log');
  const optionsComponent = document.querySelector('yambo-options');

  // When dice are rolled, update sheet
  diceComponent?.addEventListener('rollcomplete', (e) => {
    sheetComponent?.updateScores();
    const values = e.detail.values;
    logComponent?.logRoll(gameState.rollCount, values);
  });

  // When a combination is rolled, log it
  diceComponent?.addEventListener('combination', (e) => {
    logComponent?.logCombination(e.detail.name);
  });

  // When score is saved, log it and advance turn
  sheetComponent?.addEventListener('scoresaved', (e) => {
    const { row, value, column } = e.detail;
    logComponent?.logSave(row, value);
    gameState.nextTurn();
    diceComponent?.clearHeld();
  });

  // When game is over
  sheetComponent?.addEventListener('gameover', () => {
    logComponent?.logGameOver();
  });

  // When options change
  optionsComponent?.addEventListener('optionchange', (e) => {
    if (e.detail.setting === 'juggleTime' && diceComponent) {
      diceComponent.juggleTime = e.detail.value;
    }
  });

  // Log initialization complete
  console.log('Yambo components initialized:', {
    dice: !!diceComponent,
    sheet: !!sheetComponent,
    log: !!logComponent,
    options: !!optionsComponent
  });
});

// Export for use in other modules and bridge
export {
  // Services
  DiceEngine,
  diceEngine,
  AudioService,
  audioService,
  GameState,
  gameState,
  ThemeManager,
  themeManager,
  // Utils
  dom,
  animation,
  // Components
  YamboLog,
  YamboOptions,
  YamboToolbar,
  YamboDice,
  YamboSheet
};
