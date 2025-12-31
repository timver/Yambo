# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yambo is a browser-based dice game inspired by Yahtzee. The codebase is being modernized from ES5/jQuery to ES6+ modules with Web Components.

## Modern Stack (v3.0.0)

### Build Commands

All commands run from `YamboClient/` directory:

```bash
# Install dependencies
npm install

# Development mode (watch + serve)
npm run dev

# Production build
npm run build

# Build JavaScript only
npm run build:js

# Build CSS only
npm run build:css

# Update browserslist database
npm run update-browsers
```

### Technology Stack
- **Bundler**: esbuild
- **Dev Server**: serve
- **JavaScript**: ES6+ modules (no TypeScript)
- **UI**: Vanilla Web Components with Shadow DOM
- **Animations**: GSAP
- **Styling**: SCSS with dart-sass + PostCSS + Autoprefixer
- **CSS Framework**: Bootstrap 5 (selective imports)
- **Theming**: CSS Custom Properties

### Modern Architecture (`YamboClient/src/`)

```
src/
  main.js                  # Entry point, component wiring
  bridge.js                # Legacy compatibility (window.Yambo)

  components/              # Web Components (Shadow DOM)
    yambo-sheet.js         # Score grid component
    yambo-dice.js          # Dice rolling component
    yambo-log.js           # Game log/messages component
    yambo-options.js       # Settings panel component
    yambo-toolbar.js       # Controls component

  services/                # Pure logic (no DOM)
    dice-engine.js         # Dice calculations
    audio-service.js       # Web Audio API wrapper
    game-state.js          # Centralized state (EventTarget-based)
    theme-manager.js       # Theme switching

  utils/
    dom-helpers.js         # jQuery replacement utilities
    animation-helpers.js   # GSAP wrappers

  styles/
    main.scss              # Entry point
    _variables.scss        # CSS custom properties
    _bootstrap.scss        # Selective Bootstrap 5 imports
    partials/              # Reset, fonts, helpers
    modules/               # Shared, widgets, sublayouts
    themes/                # 8 theme files
    media/                 # Responsive breakpoints
    adaptive/              # Device-class overrides
```

### Key Patterns

**State Management**: `GameState` class extends `EventTarget` for reactive state:
```javascript
import { gameState } from './services/game-state.js';
gameState.on('turnChange', (e) => console.log(e.detail.turn));
```

**Theme Switching**: CSS Custom Properties set on `:root`, themes override via class:
```javascript
import { themeManager } from './services/theme-manager.js';
themeManager.theme = 'theme-tron';
```

**Component Events**: Web Components emit custom events for inter-component communication:
```javascript
diceComponent.addEventListener('rollcomplete', (e) => {
  sheetComponent.updateScores();
});
```

---

## Legacy Stack (v2.x)

### Build Commands (Legacy)

```bash
# Install dependencies
npm install
bower install

# Default build: clean, build Modernizr, copy bower libs
grunt default

# Watch SCSS and compile with Compass
grunt watch
```

**Note**: Requires Ruby + Compass gem (`gem install compass`).

### Legacy Architecture (`YamboClient/public/js/app/`)

All code lives under `window.Yambo` namespace:

- **yambo.instance.js** - Entry point, creates module instances
- **classes/yambo.sheet.js** - Score sheet management
- **classes/yambo.dice.js** - Dice rolling logic
- **classes/yambo.audio.js** - Web Audio API wrapper
- **classes/yambo.log.js** - Turn history, messages
- **classes/yambo.options.js** - Settings, themes
- **classes/yambo.toolbar.js** - Game controls
- **modules/yambo.fn.js** - jQuery plugin extensions

### Legacy Dependencies
- Bootstrap 4 alpha - Grid/layout
- jQuery 2.2 - DOM manipulation
- GSAP TweenMax - Animations
- Dragula - Drag-and-drop panels
- Modernizr - Feature detection

---

## Files Pending Cleanup

Once the modern stack is fully tested, these legacy files can be removed:

- `Gruntfile.js` - Grunt build config
- `bower.json` - Bower dependencies
- `public/js/lib/` - Bower-installed libraries (jquery, modernizr)
- `public/js/yambo.bundle.js` - Old bundled JS
- `public/js/yambo.bundle.min.js` - Old minified bundle
- `public/scss/` - Old SCSS (replaced by `src/styles/`)
- `bridge.js` - Once legacy compatibility not needed

---

## Game Rules Context

The game has 5 columns with different scoring rules:
- Columns 1 & 3: Chronological order (top to bottom)
- Columns 2, 4, 5: Random order (any row)
- Column 4: Only 1 roll allowed
- Column 5: Only 2 rolls allowed
- Upper total of 63+ earns 30 bonus points
