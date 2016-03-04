/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.Log]
 * @requires     [jQuery, Yambo]
 * @revision     [0.1]
 */

/**
 * @param {Function} $: jQuery
 * @param {Object} ns: Yambo namespace
 */
window.Yambo = (function ($, ns) {

    // ECMA-262/5
    'use strict';

    // CONFIG
    var cfg = {
        selectors: {
            app: '[data-app="log"]',
            fieldClock: '#clock',
            fieldTurn: '#turn',
            areaMessage: '#message'
        },
        log: {
            error: {
                notfound: 'The log could not be found.'
            }
        }
    };

    /**
     * @constructor Yambo.Log
     * @param {Object} options : cfg like object
     */
    ns.Log = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @extends Yambo.Log
     */
    ns.Log.prototype = {

        /**
         * Intitialise app
         * @constant {Object} this.settings : cfg like object
         */
        init: function () {
            var settings = this.settings,
                selectors = settings.selectors,
                options = settings.options,
                log = settings.log;

            this.cache(selectors);

            if (this.app.length) {
                this.create(options);
            } else {
                console.warn(log.error.notfound);
            }
        },

        /**
         * Cache app selectors
         * @param {Object} selectors : cfg.selectors like object
         */
        cache: function (selectors) {
            this.app = $(selectors.app);
            this.fieldClock = $(selectors.fieldClock);
            this.fieldTurn = $(selectors.fieldTurn);
            this.areaMessage = $(selectors.areaMessage);
        },

        /**
         * Create app
         */
        create: function () {
            // Date protoype
            Object.defineProperty(Date.prototype, 'formatTime', {
                value: function () {
                    var i = 0,
                        time = [],
                        len = time.push(this.getHours(), this.getMinutes(), this.getSeconds());

                    for (; i < len; i += 1) {
                        var tick = time[i];
                        time[i] = tick < 10 ? '0' + tick : tick;
                    }

                    return time.join(':');
                }
            });

            // start the timer
            this.startTime();
        },

        /**
         * Gets the field value of your turn
         * @returns {Integer} of the current turn
         * @defaultvalue {Integer} 0
         */
        getTurn: function () {
            return parseInt(this.fieldTurn.val(), 10) || 0;
        },

        /**
         * Validate your turn
         * @returns {Boolean} true when all requirements are met
         */
        isValidTurn: function () {
            var turn = this.getTurn(),
                diceLen = ns.instance.dice.filter(false).length;

            if (turn === 3 || diceLen === 5) {
                return false;
            } else if (turn === 2 && ns.instance.sheet.isComplete3Col() && !ns.instance.sheet.isComplete2Col()) {
                return false;
            } else if (turn === 1 && ns.instance.sheet.isComplete3Col() && ns.instance.sheet.isComplete2Col()) {
                return false;
            }

            return true;
        },

        /**
         * Changes the turn value and displays a message
         * @returns {Boolean} true when no error messages were created
         */
        handleTurn: function () {
            var btn = ns.instance.dice.roll,
                turn = this.getTurn(),
                diceLen = ns.instance.dice.filter(false).length,
                msgOptions = {
                    message: ' -- Save your score --',
                    isTimed: false,
                    isError: true,
                    isNewline: true
                };

            if (diceLen !== 5) {
                // increase the turn value
                if (turn < 4) {
                    turn += 1;
                }

                // handle errors
                if (ns.instance.sheet.isGameOver()) {
                    msgOptions.message = ' -- GAME OVER --';
                } else if (turn > 3) {
                    turn = 3;
                } else if (turn > 2 && ns.instance.sheet.isComplete3Col() && !ns.instance.sheet.isComplete2Col()) {
                    turn = 2;
                } else if (turn > 1 && ns.instance.sheet.isComplete3Col() && ns.instance.sheet.isComplete2Col()) {
                    turn = 1;
                } else {
                    msgOptions.isTimed = true;
                    msgOptions.isError = false;
                    msgOptions.isNewline = false;

                    switch (turn) {
                        case 1:
                            msgOptions.message = 'First roll';
                            btn.val('2nd roll');
                            ns.instance.dice.dice.removeClass('checked');
                            break;
                        case 2:
                            msgOptions.message = 'Second roll';
                            btn.val('3rd roll');
                            break;
                        case 3:
                            msgOptions.message = 'Last roll';
                            btn.val('roll dice');
                            break;
                    }

                    msgOptions.isError = false;
                }

                // set the turn
                this.fieldTurn.val(turn);
            } else {
                msgOptions.message = '-- Deselect a die --';
            }

            // output
            this.addMessage(msgOptions);

            return !msgOptions.isError;
        },

        /**
         * Displays time
         */
        startTime: function () {
            var now = new Date().formatTime();

            this.fieldClock.val(now);
            setTimeout(this.startTime.bind(this), 1000);
        },

        /**
         * Add a message to the gamelog
         * @param {Object} options : allows custom output
         * @param {String} options.message : the message to display
         * @param {Boolean} options.isTimed : does the message has a timestamp in front of it?
         * @param {Boolean} options.isError : is the message an error?
         * @param {Boolean} options.isNewline : start the message on a new line
         */
        addMessage: function (options) {
            var instance = ns.instance,
                audio = instance.audio,
                audiofx = audio.settings.fx,
                history = this.areaMessage.val();

            // isTimed?
            options.message = options.isTimed
                ? history + this.fieldClock.val() + ': ' + options.message
                : history + options.message;

            // isNewline?
            if (options.isNewline) {
                options.message = options.message + '\n';
            }

            // message
            this.areaMessage.val(options.message);
            this.scrollTop(this.areaMessage);

            // isError?
            if (options.isError) {
                audio.play(audiofx.error);
            }
        },

        /**
         * Automatically scroll down (from the top)
         * @param {Object} target : jQuery object
         */
        scrollTop: function (target) {
            target.scrollTop(99999);
            target.scrollTop(target.scrollTop() * 12);
        }

    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));