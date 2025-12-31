![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CSS3-CC6699?logo=sass&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02?logo=greensock&logoColor=white)
![esbuild](https://img.shields.io/badge/esbuild-0.24-FFCF00?logo=esbuild&logoColor=black)
![IIS](https://img.shields.io/badge/IIS-Server-0078D4?logo=windows&logoColor=white)

## Yambo

Yambo is a dice game based on the game Yahtzee.

Big difference:
- You're playing in 5 columns at the same time.
- Each column has slightly different rules and value.
- The player with the highest `Total` in a column wins that column.
- The player with the highest column count in points wins the game.

## Rules

### Columns

- **1st column (↓)**: *worth 3 points* - Chronological order top-to-bottom, maximum 3 tries. You'll have to start by rolling for `Ones`, then `Twos` and so on.
- **2nd column (W)**: *worth 2 points* - Random order, maximum 3 tries.
- **3rd column (↑)**: *worth 4 points* - Chronological order bottom-to-top, maximum 3 tries. You'll have to start by rolling a `YAMBO!`, then `Chance-` and so on.
- **4th column (1)**: *worth 3 points* - Random order, maximum 1 try.
- **5th column (2)**: *worth 3 points* - Random order, maximum 2 tries.

With each dice roll, you decide in which column you are playing. Just remember: if you've rolled 3 times you'll have to write down your score in one of the first 3 columns.
If you don't feel like you're going to win a column, you can scratch it. This will open up some free slots to store your bad throws.

### Upper Total

When you've thrown 3 of a kind for each `Ones` up to `Sixes`, you'll end up with 63, receiving **30 bonus points**.

- 3x1 = 3
- 3x2 = 6
- 3x3 = 9
- 3x4 = 12
- 3x5 = 15
- 3x6 = 18

=> 3 + 6 + 9 + 12 + 15 + 18 = 63 (+30)

### Lower Total

- **Full House**: 2 of a kind + 3 of a kind
- **Straight**: 5 in a row
- **Chance+**: total amount of the dice AND higher than `Chance-`
- **Chance-**: total amount of the dice AND lower than `Chance+`
- **YAMBO!**: 5 of the same

## Technology

### Stack

- **JavaScript**: ES6+ modules with Web Components
- **CSS**: SCSS with Bootstrap 5, CSS custom properties for themes
- **Build**: esbuild (JS), dart-sass + PostCSS/Autoprefixer (CSS)
- **Animation**: GSAP
- **Server**: IIS with web.config

### Development

```bash
# Install dependencies
npm install

# Development (watch + serve on localhost:3000)
npm run dev

# Production build
npm run build

# Deploy to IIS
npm run deploy
```

### IDE

- Visual Studio 2025+
- Or any editor with npm support

### Project Structure

```
YamboClient/
  src/
    components/       # Web Components (yambo-dice, yambo-sheet, etc.)
    services/         # Pure logic (audio, dice-engine, game-state, themes)
    styles/           # SCSS with themes
    utils/            # DOM and animation helpers
  public/             # Static files (deployed to IIS)
```
