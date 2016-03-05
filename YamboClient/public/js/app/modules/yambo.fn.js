/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.fn]
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

    // jQuery extends
    $.fn.roll = function (options, callback) {
        var die = $(this),
            defaults = {
                keepJuggling: false,
                juggleTimeout: 200
            },
            init = function () {
                die.animate(
                    { zIndex: 0 },
                    {
                        step: function () {
                            options.number = Math.floor(Math.random() * 6) + 1;
                            die.css({ backgroundPosition: (options.number - 1) * -60 + 'px ' + options.color + 'px' });
                        },
                        duration: options.juggleTimeout,
                        complete: function () {
                            if (options.keepJuggling) {
                                die.roll(options);
                            } else {
                                die.stop(true, true).val(options.number);
                                callback(options.number);
                            }
                        }
                    }
                );
            };

        options = $.extend(defaults, options);

        init();
    };

    $.fn.toggleEvent = function (eventType) {
        var i = 0,
            handlers = $.makeArray(arguments).slice(1);

        return this.bind(eventType, function () {
            handlers[i].apply(this, arguments);
            i = (i + 1) % handlers.length;
        });
    };

    $.fn.toggleClick = function () {
        var i = 0,
            functions = arguments;

        return this.click(function () {
            functions[i].apply(this, arguments);
            i = (i + 1) % functions.length;
        });
    };

    $.fn.minimizable = function () {
        var instance = ns.instance,
            toolbar = instance.toolbar,
            audio = instance.audio,
            positions = [];

        $(this).each(function (idx) {
            // store draggable positions
            positions.push($(this).position());

            $(this)
                .find('.minimize')
                .toggleClick(
                    function () {
                        // toolbar icon position
                        var icon = toolbar.icons.eq(idx).offset(),
                            coords = $(this).parent().position(),
                            x = icon.left - coords.left - 15,
                            y = icon.top - coords.top - 15;

                        // ui fx
                        $(this).next().hide(200);
                        $(this).addClass('minimized').animate({ left: x, top: y }, { duration: 200, easing: 'easeOutBounce' });

                        // sound fx
                        audio.play(audio.settings.fx.minimize);
                    },
                    function () {
                        $(this).next().show(200);
                        $(this).removeClass('minimized').animate({ left: -24, top: -22 }, { duration: 200, easing: 'easeOutCubic' });

                        audio.play(audio.settings.fx.maximize);
                    }
                )
                .hover(
                    function () {
                        $(this).addClass('hover');
                    },
                    function () {
                        $(this).removeClass('hover');
                    }
                );
        });

        $(this).each(function (idx) {
            $(this).css({ position: 'absolute', top: positions[idx].top, left: positions[idx].left });
        });

    };

    // Namespace extends
    ns.fn = {
        /**
         * @description delay events with the same id, good for window resize events, scroll, keystroke, etc ...
         * @param {Function} func : callback function to be run when done
         * @param {Integer} wait : integer in milliseconds
         * @param {String} id : unique event id
         */
        debounce: (function () {
            var timers = {};

            return function (func, wait, id) {
                wait = wait || 200;
                id = id || 'anonymous';

                if (timers[id]) {
                    clearTimeout(timers[id]);
                }

                timers[id] = setTimeout(func, wait);
            };
        }()),

        getObjectProperty: function (obj, val) {
            var prop = '',
                item;

            for (item in obj) {
                if (obj.hasOwnProperty(item)) {
                    if (obj[item] === val) {
                        prop = item;
                    }

                    if (typeof obj[item] === 'object') {
                        this.getObjectProperty(obj[item], val);
                    }
                }
            }

            return prop;
        }
    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));