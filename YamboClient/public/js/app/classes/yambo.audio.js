/**
 * @author       [Tim Vermaelen] - sidewalk.be
 * @date         [26.01.2016]
 * @link         [http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html]
 * @namespace    [Yambo.Audio]
 * @requires     [jQuery, Yambo]
 * @revision     [0.1]
 */

/**
 * @param {Function} $: jQuery
 * @param {Object} modernizr: Modernizr
 * @param {Object} ns: Yambo namespace
 */
window.Yambo = (function ($, modernizr, ns) {

    // ECMA-262/5
    'use strict';

    // CONFIG
    var cfg = {
        fx: {
            fullh: 'fullhouse',
            threeofakind: 'threeofakind',
            fourofakind: 'fourofakind',
            street: 'street',
            yambo: 'yam',
            rolldice: 'rolldice2',
            juggledice: 'juggledice3',
            selectdice: 'select3',
            deselectdice: 'deselect4',
            save: 'save5',
            scratch: 'shit',
            minimize: 'minimize5',
            maximize: 'maximize',
            timer: 'clock',
            woosh: 'woosh',
            error: 'error5'
        },
        options: {
            path: 'audio'
        }
    };

    ns.Audio = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    ns.Audio.prototype = {
        /**
         * Determine the file extension to be used for audio files
         * @returns {String} wav|mp3|ogg
         */
        extension: (function () {
            return modernizr && modernizr.audio.mp3
                ? 'mp3'
                : modernizr.audio.ogg
                ? 'ogg'
                : 'wav';
        }()),

        isSupported: (function() {
            return modernizr.xhr2 && modernizr.dataview && modernizr.audio;
        }()),

        init: function () {
            this.cache();

            if (this.isSupported) {
                this.activate();
            }
        },

        cache: function () {
            this.context = undefined;
            this.source = undefined;
            this.buffer = [];
        },

        activate: function () {
            var settings = this.settings,
                fx = settings.fx;

            this.context = new AudioContext();

            for (var filename in fx) {
                if (fx.hasOwnProperty(filename)) {
                    this.loadFile(filename);
                }
            }
        },

        loadFile: function (filename) {
            var self = this,
                settings = this.settings,
                options = settings.options,
                fx = settings.fx,
                filepath = [[options.path, this.extension, fx[filename]].join('/'), this.extension].join('.'),
                request = new XMLHttpRequest;

            request.open('GET', filepath, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                self.context.decodeAudioData(request.response, function (audio) {
                    self.buffer[fx[filename]] = audio;
                });
            };

            request.send();
        },

        /**
         * Plays an audio buffered file
         * @param {String} id : audio file id
         * @param {Boolean} isLoop : set to true to play the audio file in a loop
         */
        play: function (id, isLoop) {
            var audiofx;

            if (id && ns.instance.options.isSoundOn()) {
                audiofx = this.buffer[id];
                
                if (audiofx) {
                    this.source = this.context.createBufferSource();
                    this.source.buffer = audiofx;
                    this.source.loop = isLoop;
                    this.source.connect(this.context.destination);
                    this.source.start(0);
                }
            }
        },

        stop: function () {
            this.source.stop(0);
        },

        /**
         * Plays the audio for the special combinations
         */
        playCombinations: function () {
            var settings = this.settings,
                fx = settings.fx,
                instance = ns.instance,
                dice = instance.dice,
                log = instance.log,
                isPlaySound = false,
                msgOptions = {
                    message: '',
                    isTimed: false,
                    isError: false,
                    isNewline: true
                };

            // full house
            if (dice.isFullhouse() && !dice.isYam()) {
                isPlaySound = true;
                msgOptions.message = ' -- You rolled a Full house --';
                this.play(fx.fullh);
            }

            // street
            if (dice.isStreet()) {
                isPlaySound = true;
                msgOptions.message = ' -- You rolled a Street --';
                this.play(fx.street);
            }

            // yambo
            if (dice.isYam()) {
                isPlaySound = true;
                msgOptions.message = ' -- Yambo Yambo Yambo!!! --';
                this.play(fx.yambo);
            }

            // three of a kind
            if (dice.isThreeOfaKind() && !dice.isFullhouse()) {
                isPlaySound = true;
                msgOptions.message = ' -- Three of a Kind --';
                this.play(fx.threeofakind);
            }

            // four of a kind
            if (dice.isFourOfaKind()) {
                isPlaySound = true;
                msgOptions.message = ' -- Four of a Kind --';
                this.play(fx.fourofakind);
            }

            if (isPlaySound) {
                log.addMessage(msgOptions);
            }
        }
    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Modernizr, window.Yambo || {}));