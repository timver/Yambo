/**
 * @author Tim Vermaelen<tim.vermaelen@telenet.be>
 * @namespace Yambo.Log
 * @description The Log panel shows game messages and handles your turn
 * @requires jQuery, Yambo
 */
window.Yambo = (function ($, draggable, ns) {

    // ECMA-262/5
    'use strict';

    /**
     * @default
     * @global
     */
    var cfg = {
        selectors: {
            app: '[data-app="log"]',
            fieldClock: '.clock',
            fieldTurn: '.turn',
            areaMessage: '.message'
        },
        classes: {
            checked: 'checked'
        },
        log: {
            error: {
                notfound: 'The log could not be found.'
            }
        }
    };

    /**
     * Creates a new Log panel
     * @class
     * @param {Object} options - cfg alike
     */
    ns.Log = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @augments Log
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
            this.fieldClock = this.app.find(selectors.fieldClock);
            this.fieldTurn = this.app.find(selectors.fieldTurn);
            this.areaMessage = this.app.find(selectors.areaMessage);
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
            var instance = ns.instance,
                dice = instance.dice,
                sheet = instance.sheet,
                turn = this.getTurn(),
                diceLen = dice.filter(false).length;

            if (turn === 3 || diceLen === 5) {
                return false;
            } else if (turn === 2 && sheet.isComplete3Col() && !sheet.isComplete2Col()) {
                return false;
            } else if (turn === 1 && sheet.isComplete3Col() && sheet.isComplete2Col()) {
                return false;
            }

            return true;
        },

        /**
         * Changes the turn value and displays a message
         * @returns {Boolean} true when no error messages were created
         */
        handleTurn: function () {
            var instance = ns.instance,
                dice = instance.dice,
                sheet = instance.sheet,
                settings = this.settings,
                classes = settings.classes,
                turn = this.getTurn(),
                diceLen = dice.filter(false).length,
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
                if (sheet.isGameOver()) {
                    msgOptions.message = ' -- GAME OVER --';
                } else if (turn > 3) {
                    turn = 3;
                } else if (turn > 2 && sheet.isComplete3Col() && !sheet.isComplete2Col()) {
                    turn = 2;
                } else if (turn > 1 && sheet.isComplete3Col() && sheet.isComplete2Col()) {
                    turn = 1;
                } else {
                    msgOptions.isTimed = true;
                    msgOptions.isError = false;
                    msgOptions.isNewline = false;

                    switch (turn) {
                        case 1:
                            msgOptions.message = 'First roll';
                            dice.button.val('2nd roll');
                            dice.dice.removeClass(classes.checked);
                            break;
                        case 2:
                            msgOptions.message = 'Second roll';
                            dice.button.val('3rd roll');
                            break;
                        case 3:
                            msgOptions.message = 'Last roll';
                            dice.button.val('roll dice');
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

        /**         * Displays time
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
                history = this.areaMessage.html();

            // isTimed?
            options.message = options.isTimed
                ? history + this.fieldClock.val() + ': ' + options.message
                : history + options.message;

            // isNewline?
            if (options.isNewline) {
                options.message = options.message + '<br />';
            }

            // message
            this.areaMessage.html(options.message);
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

}(window.jQuery, window.Draggable, window.Yambo || {}));