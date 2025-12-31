# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yambo is a browser-based dice game inspired by Yahtzee, with 5 simultaneous columns each with different rules. Fully modernized to ES6+ modules with Web Components.

## Build Commands

All commands run from `YamboClient/` directory:

```bash
npm install          # Install dependencies
npm run dev          # Development (watch + serve on localhost:3000)
npm run build        # Production build (JS + CSS)
npm run deploy       # Build and copy to IIS (C:\inetpub\wwwroot\dev.yambo.be)
npm run clean        # Remove built files
```

## Technology Stack

- **Bundler**: esbuild (config in `esbuild.config.js`)
- **CSS**: dart-sass + PostCSS + Autoprefixer
- **JavaScript**: ES6+ modules, no TypeScript
- **UI**: Vanilla Web Components with Shadow DOM
- **Animations**: GSAP
- **Framework**: Bootstrap 5 (selective SCSS imports)
- **Theming**: 8 themes via CSS Custom Properties
- **Server**: IIS with `web.config`

## Architecture

```
YamboClient/src/
  main.js                  # Entry point, wires components together

  components/              # Web Components (Custom Elements + Shadow DOM)
    yambo-sheet.js         # Score grid - most complex component
    yambo-dice.js          # Dice rolling with hold/release mechanics
    yambo-log.js           # Turn counter, clock, messages
    yambo-options.js       # Settings panel, theme picker
    yambo-toolbar.js       # Control buttons

  services/                # Pure logic (no DOM dependencies)
    dice-engine.js         # Dice math: isFullhouse, isStreet, isYam, etc.
    audio-service.js       # Web Audio API for sound effects
    game-state.js          # Centralized EventTarget-based state
    theme-manager.js       # Theme switching via CSS classes

  utils/
    dom-helpers.js         # querySelector wrappers
    animation-helpers.js   # GSAP dice roll animation

  styles/
    main.scss              # Entry point
    _variables.scss        # CSS custom properties
    _bootstrap.scss        # Selective Bootstrap 5 imports
    themes/                # 8 theme files (_tron, _ocean, etc.)
```

## Key Patterns

**State Management** - `GameState` extends `EventTarget`:
```javascript
import { gameState } from './services/game-state.js';
gameState.on('diceChange', (e) => console.log(e.detail.dice));
gameState.on('turnChange', (e) => console.log(e.detail.turn));
```

**Component Communication** - Custom events bubble up:
```javascript
// yambo-dice emits 'rollcomplete', yambo-sheet listens
this.dispatchEvent(new CustomEvent('rollcomplete', { bubbles: true, detail: { dice } }));
```

**Dynamic Max Rolls** - Columns have different try limits (1, 2, or 3). When 3-try columns are full, max rolls reduces dynamically based on remaining columns.

## Game Rules

5 columns played simultaneously:
| Column | Symbol | Max Tries | Order | Points |
|--------|--------|-----------|-------|--------|
| 1st | ↓ | 3 | Top to bottom | 3 |
| 2nd | W | 3 | Random | 2 |
| 3rd | ↑ | 3 | Bottom to top | 4 |
| 4th | 1 | 1 | Random | 3 |
| 5th | 2 | 2 | Random | 3 |

Upper total of 63+ earns 30 bonus points.

## Deployment

- **Local dev**: `npm run dev` serves on `localhost:3000`
- **IIS**: `npm run deploy` copies `public/` to `C:\inetpub\wwwroot\dev.yambo.be`
- **VS 2025**: Open `dev.yambo.be.sln`, F5 runs `npm run serve`, Release build auto-deploys
