/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.Sheet]
 * @requires     [jQuery, Yambo]
 * @revision     [0.1]
 */

/**
 * @param {Function} $: jQuery
 * @param {Object} ns: Yambo
 */
window.Yambo = (function ($, ns) {

    // ECMA-262/5
    'use strict';

    // CONFIG
    var cfg = {
        selectors: {
            app: '[data-app="sheet"]',
            thead: 'thead td',
            tbody: 'tbody td',
            columnPlayerName: '#colplayer',
            tok1: 'input.tok1',
            tok2: 'input.tok2',
            tok3: 'input.tok3',
            tok4: 'input.tok4',
            tok5: 'input.tok5',
            tok6: 'input.tok6',
            fullhouse: 'input.fullhouse',
            street: 'input.street',
            chanceplus: 'input.chanceplus',
            chancemin: 'input.chancemin',
            yam: 'input.yam',
            totaltop: 'input.totaltop',
            totalbtm: 'input.totalbtm',
            subtotal: 'input.subtotal',
            bonus: 'input.bonus',
            fldsave: 'input.save',
            dnsave: 'td.dn input.save:first',
            upsave: 'td.up input.save:last',
            dnsaved: 'td.dn input.saved',
            wsaved: 'td.w input.saved',
            upsaved: 'td.up input.saved',
            onesaved: 'td.one input.saved',
            twosaved: 'td.two input.saved'
        },
        classes: {
            low: 'low',
            high: 'high',
            save: 'save',
            saved: 'saved',
            checked: 'checked'
        },
        events: {
            click: 'click'
        },
        options: {

        },
        sound: {
            save: 'save5',
            scratch: 'shit',
            timer: 'clock'
        },
        log: {
            error: {
                notfound: 'The sheet could not be found.'
            }
        }
    };

    /**
     * @constructor Yambo.Sheet
     * @param {Object} options : cfg like object
     */
    ns.Sheet = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @extends Yambo.Sheet
     */
    ns.Sheet.prototype = {

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
                this.bind(events, selectors);
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
            this.columns = this.app.find(selectors.thead).slice(1);
            this.columnPlayerName = this.app.find(selectors.columnPlayerName);
        },

        /**
         * Bind options to events
         * @param {Object} events : settings.events
         * @param {Object} selectors : settings.selectors
         */
        bind: function (events, selectors) {
            this.app.on(events.click, selectors.fldsave, this.saveScore.bind(this));
            this.columns.on(events.click, this.toggleColumnState.bind(this));
        },

        /**
         * Event handler to switch between column state
         * @param {Object} ev : event arguments
         */
        toggleColumnState: function (ev) {
            var settings = this.settings,
                classes = settings.classes,
                audio = ns.instance.audio,
                audiofx = audio.settings.fx,
                arrClasses = [classes.low, classes.high, ''];

            ev.currentTarget.className = arrClasses[($.inArray(ev.currentTarget.className, arrClasses) + 1) % arrClasses.length];
            this.addScores(ev.currentTarget.className === classes.low);
            audio.play(audiofx.save);
        },

        /**
         * Add possible scores to the sheet
         * @param {Boolean} isCleanup : clear the possible scores 
         */
        addScores: function (isCleanup) {
            var settings = this.settings,
                selectors = settings.selectors,
                tok1 = $(selectors.tok1).filter('.save').val(''),
                tok2 = $(selectors.tok2).filter('.save').val(''),
                tok3 = $(selectors.tok3).filter('.save').val(''),
                tok4 = $(selectors.tok4).filter('.save').val(''),
                tok5 = $(selectors.tok5).filter('.save').val(''),
                tok6 = $(selectors.tok6).filter('.save').val(''),
                fullhouse = $(selectors.fullhouse).filter('.save').val(''),
                street = $(selectors.street).filter('.save').val(''),
                chanceplus = $(selectors.chanceplus).filter('.save').val(''),
                chancemin = $(selectors.chancemin).filter('.save').val(''),
                yam = $(selectors.yam).filter('.save').val('');

            if (!isCleanup) {
                try {
                    var dicetotal = ns.instance.dice.getDiceTotal(),
                        dicecounts = ns.instance.dice.getDiceCounts();

                    // top rows
                    this.filterCells(tok1).val(dicecounts[0] || '');
                    this.filterCells(tok2).val(dicecounts[1] * 2 || '');
                    this.filterCells(tok3).val(dicecounts[2] * 3 || '');
                    this.filterCells(tok4).val(dicecounts[3] * 4 || '');
                    this.filterCells(tok5).val(dicecounts[4] * 5 || '');
                    this.filterCells(tok6).val(dicecounts[5] * 6 || '');

                    // full house
                    if (ns.instance.dice.isFullhouse()) {
                        this.filterCells(fullhouse).val(20);
                    }

                    // street
                    if (ns.instance.dice.isStreet()) {
                        this.filterCells(street).val(30);
                    }

                    // chance +/-
                    this.filterCells(chanceplus).val(dicetotal);
                    this.filterCells(chancemin).val(dicetotal);

                    // yambo
                    if (ns.instance.dice.isYam()) {
                        this.filterCells(yam).val(40);
                    }
                } catch (e) {
                    ns.instance.log.addMessage({ message: 'jquery.yambo.js > addScores: ' + e, isTimed: true, isError: true, isNewline: true });
                }
            }
        },

        /**
         * Save score on the sheet
         * @param {Object} ev : event arguments
         */
        saveScore: function (ev) {
            var instance = ns.instance,
                dice = instance.dice,
                log = instance.log,
                audio = instance.audio,
                audiofx = audio.settings.fx,
                settings = this.settings,
                classes = settings.classes,
                msgOptions = {
                    message: '',
                    isTimed: true,
                    isError: false,
                    isNewline: true
                },
                el = ev.currentTarget,
                isValid = ev.hasOwnProperty('isValidate') || this.validSave(el);

            // disable input edit mode
            el.blur();

            if (isValid) {
                // change to saved state
                if (!el.value) {
                    $(el).val('\u00D7');
                    $(el).parent().removeClass(classes.high).addClass(classes.low);
                    msgOptions.message = 'scratched ' + this.getRowElement(el).text() + ' in column ' + this.getColElement(el).prop('title') + '\n';
                    audio.play(audiofx.scratch);
                } else {
                    $(el).parent().addClass(classes.high);
                    msgOptions.message = 'Added ' + ($(el).val() || 0) + ' of ' + this.getRowElement(el).text() + ' in column ' + this.getColElement(el).prop('title') + '\n';
                }

                $(el).removeClass(classes.save).addClass(classes.saved);
                $(dice.dice).removeClass(classes.checked);
                $(dice.button).val('First roll');
                $(log.fieldTurn).val(0);
                $.uniform.update(dice.button);

                this.addScores(true);
                this.calcTotal(el);

                ns.instance.log.addMessage(msgOptions);
                //audio.pause(audiofx.timer);
                audio.play(audiofx.save);
            }
        },

        /**
         * Determine whether a save is valid
         * @param {Object} el : settings.selectors.fldsave
         * @returns {Boolean} true when all requirements are met to save a score
         */
        validSave: function (el) {
            var settings = this.settings,
                selectors = settings.selectors,
                turn = ns.instance.log.getTurn(),
                up = el.id.indexOf('up') > -1,
                arr = $(selectors.fldsave),
                idx = $(el).parent().index() - 1,
                totalbtm = $(selectors.totalbtm).eq(idx),
                subtotal = $(selectors.subtotal).eq(idx),
                elValid,
                topval,
                plus,
                min,
                corr,
                msgOptions = {
                    message: '',
                    isTimed: false,
                    isError: false,
                    isNewline: true
                };

            // error: new turn
            if (turn < 1) {
                msgOptions.message = ' -- Roll the dice';
                msgOptions.isError = true;
            }

            // error: column one
            if (el.id.indexOf('one') > -1 && turn !== 1 && !this.isColSaved(el)) {
                msgOptions.message = ' -- You can\'t save this in turn ' + turn;
                msgOptions.isError = true;
            }

            if (el.id.indexOf('one') > -1 && turn > 1 && this.isColSaved(el)) {
                msgOptions.message = ' -- You can\'t scratch this in turn ' + turn;
                msgOptions.isError = true;
            }

            // error: column two
            if (el.id.indexOf('two') > -1 && turn !== 2 && !this.isColSaved(el)) {
                msgOptions.message = ' -- You can\'t save this in turn ' + turn;
                msgOptions.isError = true;
            }

            if (el.id.indexOf('two') > -1 && turn > 2 && this.isColSaved(el)) {
                msgOptions.message = ' -- You can\'t scratch this in turn ' + turn;
                msgOptions.isError = true;
            }

            // error: column dn, up
            if ((el.id.indexOf('dn') > -1 || el.id.indexOf('up') > -1) && !this.isColSaved(el)) {
                // pick the bottom free element in the up column
                if (up) {
                    arr = $.grep(arr, function (item) {
                        return item.id.indexOf('up') > -1;
                    });
                    elValid = arr[arr.length - 1];
                }
                    // pick the top free element in the dn column
                else {
                    arr = $.grep(arr, function (item) {
                        return item.id.indexOf('dn') > -1;
                    });
                    elValid = arr[0];
                }

                // do we have the same element?
                if (elValid.id !== el.id) {
                    msgOptions.message = ' -- You must save ' + $(elValid).parent().siblings(':first').text() + ' first.';
                    msgOptions.isError = true;
                }
            }

            if (msgOptions.isError) {
                ns.instance.log.addMessage(msgOptions);
                return false;
            }

            // correction: row chance
            if (el.id.indexOf('chance') > -1) {
                topval = el.id.indexOf('plus') > -1;
                plus = topval ? $(el) : $('#' + el.id.replace('min', 'plus'));
                min = !topval ? $(el) : $('#' + el.id.replace('plus', 'min'));
                corr = !topval ? parseInt(plus.val(), 10) : parseInt(min.val(), 10);

                if ((min.hasClass('saved') || plus.hasClass('saved')) && parseInt(min.val(), 10) >= parseInt(plus.val(), 10)) {
                    // correct sub + lower total
                    totalbtm.val(parseInt(totalbtm.val(), 10) - corr);
                    subtotal.val(parseInt(subtotal.val(), 10) - corr);
                    // scratch values
                    min.val('');
                    plus.val('');
                    this.saveScore({ currentTarget: min.get(0), isValidate: false });
                    this.saveScore({ currentTarget: plus.get(0), isValidate: false });

                    return false;
                }
            }

            return true;
        },

        /**
         * Filter cells in cols and in rows
         * @param {Object} obj : jQuery object of cells
         * @returns {Object} jQuery object of empty cells
         */
        filterCells: function (obj) {
            var self = this,
                settings = this.settings,
                selectors = settings.selectors,
                classes = settings.classes;

            // cols
            obj = $.grep(obj, function (el) {
                var valid = false;

                // did you scratch a column?
                if (!self.getColElement(el).hasClass(classes.low)) {
                    switch (ns.instance.log.getTurn()) {
                        case 3:
                            valid = el.id.indexOf('two') === -1 && el.id.indexOf('one') === -1;
                            break;
                        case 2:
                            valid = el.id.indexOf('one') === -1;
                            break;
                        case 1:
                            valid = el.id.indexOf('two') === -1;
                            break;
                    }
                }

                return valid;
            });

            // rows
            obj = $.grep(obj, function (el) {
                var valid = false;

                try {
                    if (el.id.indexOf('dn') > -1 && $(selectors.dnsave).prop('id') === el.id) {
                        valid = true;
                    } else if (el.id.indexOf('up') > -1 && $(selectors.upsave).prop('id') === el.id) {
                        valid = true;
                    } else if (el.id.indexOf('dn') === -1 && el.id.indexOf('up') === -1) {
                        valid = true;
                    }
                } catch (e) {
                    ns.instance.log.addMessage({ message: 'yambo.js > filterCells rows:' + e, isTimed: true, isError: true, isNewline: true });
                }

                return valid;
            });

            return $(obj);
        },

        /**
         * Calculate the total after saving a score
         * @param {Object} el : last saved cell
         */
        calcTotal: function (el) {
            var settings = this.settings,
                selectors = settings.selectors,
                idx = $(el).parent().index() - 1,
                isTopElement = $(el).parents('.top').length,
                totaltop = $(selectors.totaltop).eq(idx),
                totalbtm = $(selectors.totalbtm).eq(idx),
                bonus = $(selectors.bonus).eq(idx),
                subtotal = $(selectors.subtotal).eq(idx),
                newvaltop = parseInt(totaltop.val(), 10) || 0,
                newvalbtm = parseInt(totalbtm.val(), 10) || 0,
                newvalbon = parseInt(bonus.val(), 10) || 0;

            try {
                if (isTopElement) {
                    newvaltop += parseInt(el.value, 10) || 0;

                    if (newvaltop) {
                        totaltop.val(newvaltop);
                    }
                } else {
                    newvalbtm += parseInt(el.value, 10) || 0;

                    if (newvalbtm) {
                        totalbtm.val(newvalbtm);
                    }
                }

                // bonus
                if (newvaltop > 62) {
                    bonus.val(30);
                    newvalbon = 30;
                }

                // subtotal
                subtotal.val(newvaltop + newvalbtm + newvalbon);
            } catch (e) {
                ns.instance.log.addMessage({ message: 'yambo.js > calcTotal' + e, isTimed: true, isError: true, isNewline: true });
            }
        },

        /**
         * Get the column from a cell
         * @param {Object} el : the active cell
         * @returns {Object} the column element
         */
        getColElement: function (el) {
            return this.app.find(this.settings.selectors.thead).eq($(el).parent().index());
        },

        /**
         * Get the row from a cell
         * @param {Object} el : the active cell
         * @returns {Object} the row element
         */
        getRowElement: function (el) {
            return $(el).parent().siblings(':first');
        },

        /**
         * Determine whether the column is saved
         * @param {Object} el : the active cell
         * @returns {Boolean} true when a columns state has changed to "saved"
         */
        isColSaved: function (el) {
            return this.getColElement(el).hasClass(this.settings.classes.low);
        },

        /**
         * Determine whether the columns "in 3 turns" are complete
         * @returns {Boolean} true if all cells are saved, in all 3 columns (down, willy, up)
         */
        isComplete3Col: function () {
            var settings = this.settings,
                selectors = settings.selectors;

            return $([selectors.dnsaved, selectors.wsaved, selectors.upsaved].join(',')).length === 33;
        },

        /**
         * Determine whether the column "in 2 turns" are complete
         * @returns {Boolean} true if all cells are saved in the 2-column
         */
        isComplete2Col: function () {
            return this.app.find(this.settings.selectors.twosaved).length === 11;
        },

        /**
         * Determine whether the column "in 1 turn" is complete
         * @returns {Boolean} true if all cells are saved in the 1-column
         */
        isComplete1Col: function () {
            return this.app.find(this.settings.selectors.onesaved).length === 11;
        },

        /**
         * Determine whether all columns are complete
         * @returns {Boolean} true if all cells of all columns are saved
         */
        isGameOver: function () {
            return this.isComplete3Col() && this.isComplete2Col() && this.isComplete1Col();
        }

    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));