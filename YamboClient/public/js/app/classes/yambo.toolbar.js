/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.Toolbar]
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
            app: '[data-app="toolbar"]',
            minimizable: '.minimizable',
            icons: '.toolbar ul li',
            handle: '> span'
        },
        classes: {
            minimized: 'minimized'
        },
        options: {
            animation: {
                duration: 200,
                easing: 'easeInQuad'
            },
            draggable: {
                opacity: 0.5,
                helper: 'clone'
            }
        },
        log: {
            error: {
                notfound: 'The toolbar could not be found.'
            }
        }
    };

    /**
     * @constructor Yambo.Toolbar
     * @param {Object} options : cfg like object
     */
    ns.Toolbar = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @extends Yambo.Toolbar
     */
    ns.Toolbar.prototype = {

        /**
         * Intitialise app
         * @constant {Object} this.settings : cfg like object
         */
        init: function () {
            var settings = this.settings,
                selectors = settings.selectors,
                log = settings.log;

            this.cache(selectors);

            if (this.app.length) {
                this.activate();
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
            this.minimizable = $(selectors.minimizable);
            this.icons = $(selectors.icons);
        },

        activate: function () {
            var self = this,
                settings = this.settings,
                selectors = settings.selectors,
                classes = settings.classes,
                options = settings.options;

            $(function() {
                self.create(selectors, classes, options);
                self.bind(options.draggable);
            });
            
        },

        /**
         * Create app options
         * @param {Object} selectors : cfg.selectors like object
         * @param {Object} classes : cfg.classes like object
         * @param {Object} options : cfg.options like object
         */
        create: function (selectors, classes, options) {
            var self = this,
                audio = ns.instance.audio,
                audiofx = audio.settings.fx;

            options.animation = $.extend({}, options.animation, {
                complete: function () {
                    var el,
                        handle,
                        isMinimized,
                        toolBarOffset,
                        position,
                        x,
                        y,
                        len = self.minimizable.length;

                    while (len--) {
                        el = self.minimizable.eq(len);
                        handle = el.find(selectors.handle);
                        isMinimized = handle.hasClass(classes.minimized);

                        if (isMinimized) {
                            toolBarOffset = self.icons.eq(len).offset();
                            position = el.position();
                            x = toolBarOffset.left - position.left - 15;
                            y = toolBarOffset.top - position.top - 15;

                            handle.animate({ left: x, top: y }, { duration: 200 });
                        }
                    }

                    audio.play(audiofx.woosh);
                }
            });

            options.draggable = $.extend({}, options.draggable, {
                stop: function (event, obj) {
                    var posxy = obj.helper.position();

                    $(event.target).animate({ top: posxy.top, left: posxy.left }, options.animation);
                }
            });
        },

        /**
         * Bind options to events
         * @param {Object} options: cfg.options like object
         */
        bind: function (options) {
            this.app.draggable(options);
        }

    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));