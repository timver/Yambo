/**
 * @author Tim Vermaelen<tim.vermaelen@telenet.be>
 * @namespace Yambo.Options
 * @description The Options panel handles the client UI preferences
 * @requires jQuery, Modernizr, Yambo
 */
window.Yambo = (function ($, modernizr, ns) {

    // ECMA-262/5
    'use strict';

    /**
     * @default
     * @global
     */
    var cfg = {
        selectors: {
            app: '[data-app="options"]',
            fieldPlayerName: '#playerName',
            buttonPlayer: '.btn.player',
            hiddenPlayerCount: '#playercount',
            selectColor: '#dicecolor',
            selectTheme: '#theme',
            selectJuggleTime: '#juggletime',
            radioSoundFx: '#soundfx',
            radioTooltips: '#tooltips'
        },
        events: {
            button: 'click',
            select: 'change',
            radio: 'change'
        },
        options: {
            selected: -300,
            colors: {
                red: 0,
                yellow: -60,
                green: -120,
                blue: -180,
                pink: -240,
                white: -300,
                black: -360
            }
        },
        log: {
            error: {
                notFound: 'The options could not be found.',
                notImplemented: 'Function not implemented'
            }
        }
    };

    /**
     * Creates a new Options panel
     * @class
     * @param {Object} options - cfg alike
     */
    ns.Options = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @augments Options
     */
    ns.Options.prototype = {

        init: function () {
            var settings = this.settings,
                selectors = settings.selectors,
                events = settings.events,
                log = settings.log;

            this.cache(selectors);

            if (this.app.length) {
                this.bind(events);
            } else {
                console.warn(log.error.notFound);
            }
        },

        /**
         * Cache app selectors
         * @param {Object} selectors : settings.selectors
         */
        cache: function (selectors) {
            this.body = $(document.body);
            this.app = $(selectors.app);
            this.button = $(selectors.buttonPlayer);
            this.fldPlayerName = $(selectors.fieldPlayerName);
            this.fldPlayerCount = $(selectors.hiddenPlayerCount);
            this.selectTheme = $(selectors.selectTheme);
            this.selectColor = $(selectors.selectColor);
            this.selectJuggleTime = $(selectors.selectJuggleTime);
            this.radioSoundFx = $(selectors.radioSoundFx);
            this.radioTooltips = $(selectors.radioTooltips);
        },

        /**
         * Bind options to events
         * @param {Object} events : settings.events
         */
        bind: function (events) {
            this.button.on(events.button, this.addPlayer.bind(this));
            this.selectTheme.on(events.select, this.setTheme.bind(this));
            this.selectColor.on(events.select, this.setDiceColor.bind(this));
            this.selectJuggleTime.on(events.select, this.setJuggleTime.bind(this));
            this.radioTooltips.on(events.radio, this.enableTooltips.bind(this));
        },

        /**
         * Add a player
         * @desc Increase the player count and set the player name
         */
        addPlayer: function () {
            var playerCount = this.getPlayerCount(),
                playerName = this.getPlayerName();

            this.setPlayerName(playerName);
            this.setPlayerCount(playerCount + 1);
        },

        /**
         * Get player name
         * @returns {String} player name
         */
        getPlayerName: function () {
            return this.fldPlayerName.val();
        },

        /**
         * Set player name
         * @param {String} playerName : the name of the player
         */
        setPlayerName: function (playerName) {
            var instance = ns.instance,
                sheet = instance.sheet;

            if (playerName) {
                sheet.columnPlayerName.text(playerName);
                this.fldPlayerName.val('');
            }
        },

        /**
         * Determine how many players
         * @returns {Integer} player count
         */
        getPlayerCount: function () {
            return parseInt(this.fldPlayerCount.val(), 10) || 0;
        },

        /**
         * Set player count
         * @param {Integer|String} n : number between 0 and max. allowed player
         */
        setPlayerCount: function (n) {
            if (n > 0 && n <= 5) {
                this.fldPlayerCount.val(n);
            } else {
                this.fldPlayerName.prop({ disabled: true });
            }
        },

        /**
         * Get selected theme
         * @returns {String} theme
         */
        getTheme: function () {
            return this.selectTheme.find(':selected').val();
        },

        /**
         * Set the selected theme from the options panel
         */
        setTheme: function () {
            this.body.prop('class', this.getTheme());
        },

        /**
         * Get the selected dice color's background Y position
         * @returns {Integer} multitude of 60
         */
        getDiceColor: function () {
            return parseInt(this.selectColor.find(':selected').val(), 10);
        },

        /**
         * Set the selected background Y position (multitude of 60)
         * @description In case of lacking browser support we have to set XY-position
         */
        setDiceColor: function () {
            var settings = this.settings,
                options = settings.options,
                dice = ns.instance.dice,
                diceColor = this.getDiceColor(),
                values, len, i = 0;

            // change selected cfg for later use while rolling dice
            options.selected = diceColor !== 0 ? diceColor * -1 : 0;

            // css
            if (modernizr.bgpositionxy) {
                dice.dice.css({ backgroundPositionY: options.selected + 'px' });
            } else {
                values = dice.getDiceValues();
                len = values.length;

                for (; i < len; i += 1) {
                    dice.dice.eq(i).css({ backgroundPosition: (values[i] - 1) * -60 + 'px ' + options.selected + 'px' });
                }
            }

            // html
            //dice.dice.prop('class', ns.fn.getObjectProperty(options.colors, options.selected));
        },

        /**
         * Get the dice juggle time
         * @returns {Integer} amount in milliseconds to slow down dice juggle
         */
        getJuggleTime: function () {
            return parseInt(this.selectJuggleTime.find(':selected').val(), 10);
        },

        /**
         * Set the dice juggle time
         */
        setJuggleTime: function () {
            console.warn(this.settings.log.error.notImplemented);
        },

        /**
         * Check if sound is active
         * @returns {Boolean} true if the sound option is checked
         */
        isSoundOn: function () {
            return this.radioSoundFx.prop('checked');
        },

        /**
         * Check if tooltips are enabled
         * @returns {Boolean} true if the tooltips option is checked
         */
        isTooltipsOn: function () {
            return this.radioTooltips.prop('checked');
        },

        /**
         * Enable tooltips
         */
        enableTooltips: function () {
            ns.instance.sheet.app.tooltip({ disabled: !this.isTooltipsOn() });
        }

    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Modernizr, window.Yambo || {}));