/**
 * @author Tim Vermaelen<tim.vermaelen@telenet.be>
 * @namespace Yambo.Grid
 * @description Handles the responsiveness of the grid
 * @requires jQuery, TweenLite, Draggable, Yambo
 */
window.Yambo = (function ($, tl, draggable, ns) {

    // ECMA-262/5
    'use strict';

    /**
     * @default
     * @global
     */
    var cfg = {
        selectors: {
            app: '#add',
            list: '#list',
            mode: 'input[name="layout"]'
        },
        classes: {

        },
        events: {
            resize: 'resize',
            click: 'click',
            change: 'change'
        },
        options: {
            rowSize: 100,
            colSize: 100,
            gutter: 7,         // Spacing between tiles
            numTiles: 25,      // Number of tiles to initially populate the grid with
            fixedSize: false,  // When true, each tile's colspan will be fixed to 1
            oneColumn: false,  // When true, grid will only have 1 column and tiles have fixed colspan of 1
            threshold: '50%'   // This is amount of overlap between tiles needed to detect a collision
        },
        log: {
            error: {
                notfound: 'The grid could not be found.'
            }
        }
    };

    /**
     * Creates a new responsive Grid layout
     * @class
     * @param {Object} options - cfg alike
     */
    ns.Grid = function (options) {
        this.settings = $.extend(true, {}, cfg, options);
        this.init();
    };

    /**
     * @augments Dice
     */
    ns.Grid.prototype = {

        /**
         * Intitialise app
         */
        init: function () {
            var settings = this.settings,
                selectors = settings.selectors,
                events = settings.events,
                options = settings.options,
                log = settings.log;

            this.cache(selectors, options);

            if (this.app.length) {
                this.bind(events);
                this.activate(options);
            } else {
                console.warn(log.error.notfound);
            }
        },

        /**
         * Cache app selectors
         * @param {Object} selectors : settings.selectors
         * @param {Object} options : settings.options
         */
        cache: function (selectors, options) {
            this.app = $(selectors.app);
            this.list = $(selectors.list);
            this.mode = $(selectors.mode);

            this.tiles = this.list.get(0).getElementsByClassName('tile');
            this.label = 1;
            this.zIndex = 1000;
            this.startWidth = '100%';
            this.startSize = options.colSize;
            this.singleWidth = options.colSize * 3;
            this.colCount = null;
            this.rowCount = null;
            this.gutterStep = null;
            this.shadow1 = '0 1px 3px  0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.6)';
            this.shadow2 = '0 6px 10px 0 rgba(0, 0, 0, 0.3), 0 2px 2px 0 rgba(0, 0, 0, 0.2)';
        },

        /**
         * Bind options to events
         * @param {Object} events : settings.events
         */
        bind: function (events) {
            $(window).on(events.resize, this.resize.bind(this));
            this.app.on(events.click, this.createTile.bind(this));
            this.mode.change(events.change, this.activate.bind(this));
        },

        /**
         * @param {Object} options : settings.options
         */
        activate: function (options) {
            var self = this,
                width = this.startWidth;

            options = options || this.settings.options;

            function populateBoard() {

                self.label = 1;
                self.resize();

                for (var i = 0; i < options.numTiles; i++) {
                    self.createTile();
                }
            }

            // This value is defined when this function 
            // is fired by a radio button change event
            switch (this.value) {

                case 'mixed':
                    options.fixedSize = false;
                    options.oneColumn = false;
                    options.colSize = this.startSize;
                    break;

                case 'fixed':
                    options.fixedSize = true;
                    options.oneColumn = false;
                    options.colSize = this.startSize;
                    break;

                case 'column':
                    options.fixedSize = false;
                    options.oneColumn = true;
                    width = singleWidth;
                    options.colSize = this.singleWidth;
                    break;
            }

            this.settings.options = options;
            $('.tile').remove();

            tl.to($list, 0.2, { width: width });
            tl.delayedCall(0.25, populateBoard);
        },

        resize: function () {
            var settings = this.settings,
                options = settings.options;

            this.colCount = options.oneColumn ? 1 : Math.floor(this.list.outerWidth() / (options.colSize + options.gutter));
            this.gutterStep = this.colCount === 1 ? options.gutter : (options.gutter * (this.colCount - 1) / options.colCount);
            this.rowCount = 0;

            this.layoutInvalidated();
        },

        changePosition: function (from, to, rowToUpdate) {
            var $tiles = $('.tile');
            var insert = from > to ? 'insertBefore' : 'insertAfter';

            // Change DOM positions
            $tiles.eq(from)[insert]($tiles.eq(to));

            this.layoutInvalidated(rowToUpdate);
        },

        createTile: function () {
            var self = this,
                settings = this.settings,
                options = settings.options,
                colspan = options.fixedSize || options.oneColumn ? 1 : Math.floor(Math.random() * 2) + 1,
                element = $('<div></div>').addClass('tile').html(this.label++),
                lastX = 0,
                tile = {
                    col: null,
                    colspan: colspan,
                    element: element,
                    height: 0,
                    inBounds: true,
                    index: null,
                    isDragging: false,
                    lastIndex: null,
                    newTile: true,
                    positioned: false,
                    row: null,
                    rowspan: 1,
                    width: 0,
                    x: 0,
                    y: 0
                };

            function onPress() {

                lastX = this.x;
                tile.isDragging = true;
                tile.lastIndex = tile.index;

                tl.to(element, 0.2, {
                    autoAlpha: 0.75,
                    boxShadow: self.shadow2,
                    scale: 0.95,
                    zIndex: '+=1000'
                });
            }

            function onDrag() {

                // Move to end of list if not in bounds
                if (!this.hitTest(self.list, 0)) {
                    tile.inBounds = false;
                    self.changePosition(tile.index, tiles.length - 1);
                    return;
                }

                tile.inBounds = true;

                for (var i = 0; i < tiles.length; i++) {

                    // Row to update is used for a partial layout update
                    // Shift left/right checks if the tile is being dragged 
                    // towards the the tile it is testing
                    var testTile = tiles[i].tile;
                    var onSameRow = (tile.row === testTile.row);
                    var rowToUpdate = onSameRow ? tile.row : -1;
                    var shiftLeft = onSameRow ? (this.x < lastX && tile.index > i) : true;
                    var shiftRight = onSameRow ? (this.x > lastX && tile.index < i) : true;
                    var validMove = (testTile.positioned && (shiftLeft || shiftRight));

                    if (this.hitTest(tiles[i], threshold) && validMove) {
                        self.changePosition(tile.index, i, rowToUpdate);
                        break;
                    }
                }

                lastX = this.x;
            }

            function onRelease() {

                // Move tile back to last position if released out of bounds
                this.hitTest($list, 0)
                    ? self.layoutInvalidated()
                    : self.changePosition(tile.index, tile.lastIndex);

                tl.to(element, 0.2, {
                    autoAlpha: 1,
                    boxShadow: self.settings.options.shadow1,
                    scale: 1,
                    x: tile.x,
                    y: tile.y,
                    zIndex: ++self.zIndex
                });

                tile.isDragging = false;
            }

            draggable.create(element, {
                onDrag: onDrag,
                onPress: onPress,
                onRelease: onRelease,
                zIndexBoost: false
            });

            // Add tile properties to our element for quick lookup
            element[0].tile = tile;

            self.list.append(element);
            self.layoutInvalidated();
        },

        layoutInvalidated: function (rowToUpdate) {
            var self = this,
                settings = this.settings,
                options = settings.options,
                timeline = new TimelineMax(),
                partialLayout = (rowToUpdate > -1),
                height = 0,
                col = 0,
                row = 0,
                time = 0.35;

            $('.tile').each(function (index, element) {

                var tile = this.tile;
                var oldRow = tile.row;
                var oldCol = tile.col;
                var newTile = tile.newTile;

                // PARTIAL LAYOUT: This condition can only occur while a tile is being 
                // dragged. The purpose of this is to only swap positions within a row, 
                // which will prevent a tile from jumping to another row if a space
                // is available. Without this, a large tile in column 0 may appear 
                // to be stuck if hit by a smaller tile, and if there is space in the 
                // row above for the smaller tile. When the user stops dragging the 
                // tile, a full layout update will happen, allowing tiles to move to
                // available spaces in rows above them.
                if (partialLayout) {
                    row = tile.row;
                    if (tile.row !== rowToUpdate) return;
                }

                // Update trackers when colCount is exceeded 
                if (col + tile.colspan > colCount) {
                    col = 0; row++;
                }

                $.extend(tile, {
                    col: col,
                    row: row,
                    index: index,
                    x: col * self.gutterStep + (col * options.colSize),
                    y: row * self.gutterStep + (row * options.rowSize),
                    width: tile.colspan * options.colSize + ((tile.colspan - 1) * self.gutterStep),
                    height: tile.rowspan * options.rowSize
                });

                col += tile.colspan;

                // If the tile being dragged is in bounds, set a new
                // last index in case it goes out of bounds
                if (tile.isDragging && tile.inBounds) {
                    tile.lastIndex = index;
                }

                if (newTile) {

                    // Clear the new tile flag
                    tile.newTile = false;

                    var from = {
                        autoAlpha: 0,
                        boxShadow: self.shadow1,
                        height: tile.height,
                        scale: 0,
                        width: tile.width
                    };

                    var to = {
                        autoAlpha: 1,
                        scale: 1,
                        zIndex: self.zIndex
                    }

                    timeline.fromTo(element, time, from, to, 'reflow');
                }

                // Don't animate the tile that is being dragged and
                // only animate the tiles that have changes
                if (!tile.isDragging && (oldRow !== tile.row || oldCol !== tile.col)) {

                    var duration = newTile ? 0 : time;

                    // Boost the z-index for tiles that will travel over 
                    // another tile due to a row change
                    if (oldRow !== tile.row) {
                        timeline.set(element, { zIndex: ++self.zIndex }, 'reflow');
                    }

                    timeline.to(element, duration, {
                        x: tile.x,
                        y: tile.y,
                        onComplete: function () { tile.positioned = true; },
                        onStart: function () { tile.positioned = false; }
                    }, 'reflow');
                }
            });

            // If the row count has changed, change the height of the container
            if (row !== rowCount) {
                self.rowCount = row;
                height = self.rowCount * self.gutterStep + (++row * options.rowSize);
                timeline.to(self.list, 0.2, { height: height }, 'reflow');
            }
        }

    };

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.TweenLite, window.Draggable, window.Yambo || {}));