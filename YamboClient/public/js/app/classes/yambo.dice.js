/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.Dice]
 * @requires     [jQuery, Yambo]
 * @revision     [0.2]
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
            app: '[data-app="dice"]',
            dice: 'ul li input',
            roll: '.roll'
        },
        classes: {
            checked: 'checked'
        },
        events: {
            buttonHold: 'mousedown',
            buttonRelease: 'mouseup',
            diceClick: 'click'
        },
        props: {
            disabled: 'disabled'
        },
        log: {
            error: {
                notfound: 'The dice could not be found.'
            }
        }
    };
    
    /**
     * @constructor Yambo.Dice
     * @param {Object} options : cfg like object
     */
    ns.Dice = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };
    
    /**
     * @extends Yambo.Toolbar
     */
    ns.Dice.prototype = {
        
        /**
         * Intitialise app
         */
        init: function () {
            var settings = this.settings,
                selectors = settings.selectors,
                events = settings.events,
                log = settings.log;
            
            this.cache(selectors);
            
            if (this.app.length) {
                this.bind(events);
            } else {
                console.warn(log.error.notfound);
            }
        },
        
        /**
         * Cache app selectors
         * @param {Object} selectors : settings.selectors
         */
        cache: function (selectors) {
            this.app = $(selectors.app);
            this.dice = this.app.find(selectors.dice);
            this.roll = this.app.find(selectors.roll);
        },
        
        /**
         * Bind options to events
         * @param {Object} events : settings.events
         */
        bind: function (events) {
            this.roll.on(events.buttonHold, this.buttonHold.bind(this));
            this.roll.on(events.buttonRelease, this.buttonRelease.bind(this));
            this.dice.on(events.diceClick, this.diceClick.bind(this));
        },
        
        /**
         * Event handler to keep rolling
         * @event mousedown : settings.events.buttonHold
         */
        buttonHold: function () {
            var instance = ns.instance,
                options = instance.options,
                audio = instance.audio,
                audiofx = audio.settings.fx,
                log = instance.log;
            
            if (log.isValidTurn()) {
                this.rollDice({
                    color: options.settings.options.selected,
                    keepJuggling: true
                });
                
                audio.play(audiofx.juggledice, true);
            }
        },
        
        /**
         * Event handler to release rolling
         * @event mouseup : settings.events.buttonRelease
         */
        buttonRelease: function () {
            var self = this,
                instance = ns.instance,
                options = instance.options,
                audio = instance.audio,
                audiofx = audio.settings.fx,
                sheet = instance.sheet,
                log = instance.log,
                props = this.settings.props;
            
            if (log.handleTurn()) {
                var btn = $(this);
                
                btn.prop(props.disabled, true);
                $.uniform.update(btn);
                audio.stop();
                this.rollDice({
                    color: options.settings.options.selected,
                    juggleTimeout: options.getJuggleTime()
                }, function () {
                    sheet.addScores(false);
                    log.addMessage({ message: ' (' + self.getDiceValues().join(' : ') + ')', isTimed: false, isError: false, isNewline: true });
                    btn.prop(props.disabled, false);
                    $.uniform.update(btn);
                    audio.playCombinations();
                    audio.play(audiofx.rolldice);
                });
            }
        },
        
        /**
         * Event handler to select/keep a single die or multiple dice with the same value
         * @param {Object} ev : arguments from event
         * @event click : settings.events.dieClick
         */
        diceClick: function (ev) {
            var instance = ns.instance,
                audio = instance.audio,
                audiofx = audio.settings.fx,
                classes = this.settings.classes,
                el = $(ev.currentTarget),
                isChecked = el.hasClass(classes.checked),
                sound = !isChecked ? audiofx.deselectdice : audiofx.selectdice;
            
            ev.preventDefault();
            
            // multi select support for win + mac
            if (ev.ctrlKey || ev.metaKey) {
                el = this.getDieCount(el.val(), !isChecked);
                el.toggleClass(classes.checked, !isChecked);
            } else {
                el.toggleClass(classes.checked);
            }
            
            // sound fx
            audio.play(sound);
        },
        
        /**
         * Returns an object of all or selected dice
         * @param {Boolean} isChecked : set to true to return all the checked dice
         * @returns {Object} $(dice)
         */
        filter: function (isChecked) {
            var settings = this.settings,
                classes = settings.classes;
            
            return $($.grep(this.dice, function (el) {
                return $(el).hasClass(classes.checked) !== isChecked;
            }));
        },
        
        /**
         * Filters the selected dice and rolls them seperatly
         * @param {Object} options : a set of key/value pairs to pass to $.fn.roll()
         * @param {Function} callback : executes after dice were rolled
         */
        rollDice: function (options, callback) {
            var dice = this.filter(true),
                len = dice.length,
                i = 0,
                result = [],
                finished = function (value) {
                    result.push(value);
                    if (result.length === len && typeof callback === 'function') {
                        callback();
                    }
                };
            
            for (; i < len; i += 1) {
                dice.eq(i).roll(options, finished);
            }
        },
        
        /**
         * Gets the value of a die
         * @param {Integer} index : the index of the die
         * @returns {Integer} the value of the die
         */
        getDieValue: function (index) {
            return parseInt(this.dice.eq(index).val(), 10) || 0;
        },
        
        /**
         * Get all dice values
         * @returns {Array} an array of all the dice values
         */
        getDiceValues: function () {
            var arr = [],
                i = 0;
            
            for (; i < 5; i += 1) {
                arr[i] = this.getDieValue(i);
            }
            
            return arr;
        },
        
        /**
         * Gets the total value of all dice
         * @returns {Integer} sum of all dice
         */
        getDiceTotal: function () {
            var total = 0,
                arr = this.getDiceValues(),
                len = arr.length;
            
            for (; len--;) {
                total += arr[len];
            }
            
            return total;
        },
        
        /**
         * Gets an object of filtered dice by score and state
         * @param {Integer} value : pass a value to filter the dice
         * @param {Boolean} isChecked : allows you to filter only checked dice
         * @returns {Object} jquery object
         */
        getDieCount: function (value, isChecked) {
            var elements = this.filter(isChecked),
                i = 0,
                len = elements.length,
                arr = [];
            
            for (; i < len; i++) {
                var el = elements[i];
                
                if (el.value === value) {
                    arr.push(el);
                }
            }
            
            return $(arr);
        },
        
        /**
         * Counts the dice with the same value
         * @param {Integer} value : pass a score to filter the dice
         * @returns {Integer} sum of all dice who have the same value
         */
        getDiceCount: function (value) {
            var count = 0,
                arr = this.getDiceValues(),
                len = arr.length;
            
            for (; len--;) {
                if (arr[len] === value) {
                    count++;
                }
            }
            
            return count;
        },
        
        /**
         * Counts the dice with the same value, for all possible values
         * @returns {Array} sums of all dice who have the same value
         */
        getDiceCounts: function () {
            var arr = [];
            
            for (var i = 1; i <= 6; i++) {
                arr.push(this.getDiceCount(i));
            }
            
            return arr;
        },
        
        /**
         * 3 dice of the same value
         * @returns {Boolean} for a three-of-a-kind combo
         */
        isThreeOfaKind: function () {
            return $.inArray(3, this.getDiceCounts()) > -1;
        },
        
        /**
         * 4 dice of the same value
         * @returns {Boolean} for a four-of-a-kind combo
         */
        isFourOfaKind: function () {
            return $.inArray(4, this.getDiceCounts()) > -1;
        },
        
        /**
         * 3 + 2 dice of the same value
         * @returns {Boolean} for a full-house combo
         */
        isFullhouse: function () {
            var arr = this.getDiceCounts();
            return $.inArray(3, arr) > -1 && $.inArray(2, arr) > -1 || $.inArray(5, arr) > -1;
        },
        
        /**
         * 5 dice in order
         * @returns {Boolean} for a straight combo
         */
        isStreet: function () {
            return this.getDiceCount(2) && this.getDiceCount(3) && this.getDiceCount(4) && this.getDiceCount(5) && (this.getDiceCount(1) || this.getDiceCount(6));
        },
        
        /**
         * 5 dice of the same value
         * @returns {Boolean} for a YAM! combo
         */
        isYam: function () {
            return $.inArray(5, this.getDiceCounts()) > -1;
        }

    };
    
    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));