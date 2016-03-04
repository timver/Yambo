## Yambo

Yambo is a dice game based on the game Yathzee.

Big difference: 
- You're playing in 5 columns at the same time.
- Each column has slightly different rules and value.
- The player with the highest `Total` in a column wins that column.
- The player with the highest column count in points wins the game.

## Rules

### Columns

- **1st column**: *worth 3 points* - Chronological order, maximum 3 tries. You'll have to start by rolling for `Ones`, then `Twos` and so on.
- **2nd column**: *worth 2 points* - Random order, maximum 3 tries.
- **3th column**: *worth 4 points* - Chronological order, maximum 3 tries. You'll have to start by rolling a `YAMBO!`, then `Chance-` and so on.
- **4th column**: *worth 3 points* - Random order, maximum 1 try.
- **5th column**: *worth 3 points* - Random order, maximum 2 tries.

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

Yambo is developped using HTML5, javaScript (ECMA5), CSS3.
In the future this will also use Node.js to deal with multiplayer support.

### IDE

- Visual Studio 2015
- ASP.NET 5 Scripts Task Runner
- NPM Scripts Task Runner (installs node_modules => package.json)
- Package Installer (install bower_components => bower.json)
- Node.js Tools
- Bundler & Minifier (bundleconfig.json)
- Web Compiler
- ReSharper (JavaScript validation)

### JavaScript Libaries

- jQuery
- jQuery UI
- Modernizr
- Uniform
