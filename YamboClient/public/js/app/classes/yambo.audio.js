/**
 * @author Tim Vermaelen<tim.vermaelen@telenet.be>
 * @namespace Yambo.Audio
 * @description The Audio Object handles browser support, loading and decoding, audio context and buffering
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

    /**
     * Creates new Audio
     * @class
     * @param {Object} options - cfg alike
     */
    ns.Audio = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @augments Audio
     */
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

        /**
         * See if browser supports audio
         * @returns {Boolean} true if audio can be decoded and played
         */
        isSupported: (function () {
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

        /**
         * Creates an audio context and starts loading audio files
         */
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

        /**
         * Load a single audio file and decode it
         * @param {String} fileName audio to load
         */
        loadFile: function (fileName) {
            var self = this,
                settings = this.settings,
                options = settings.options,
                fx = settings.fx,
                filepath = [[options.path, this.extension, fx[fileName]].join('/'), this.extension].join('.'),
                request = new XMLHttpRequest;

            request.open('GET', filepath, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                self.context.decodeAudioData(request.response, function (audio) {
                    self.buffer[fx[fileName]] = audio;
                });
            };

            request.send();
        },

        /**
         * Plays an audio buffered file
         * @param {String} fileName : audio file name
         * @param {Boolean} isLoop : set to true to play the audio file in a loop
         */
        play: function (fileName, isLoop) {
            var audiofx;

            if (fileName && ns.instance.options.isSoundOn()) {
                audiofx = this.buffer[fileName];

                if (audiofx) {
                    this.source = this.context.createBufferSource();
                    this.source.buffer = audiofx;
                    this.source.loop = isLoop;
                    this.source.connect(this.context.destination);
                    this.source.start(0);
                }
            }
        },

        /**
         * Stops the audio
         */
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