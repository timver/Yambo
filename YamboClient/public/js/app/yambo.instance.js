window.Yambo = (function ($, ns) {

    // ECMA-262/5
    'use strict';

    // PRIVATE CONFIG
    var cfg = {
        version: '2.0.0 b&egrave;ta',
        modules: {
            draggable: '.ui-draggable',
            minimizable: '.panel',
            resizable: '.panel',
            uniform: '.uniform',
            version: '.version'
        }
    };

    // PRIVATE FUNCTIONS
    function loadModules() {
        $(cfg.modules.uniform).uniform();
        //$(cfg.modules.minimizable).minimizable();
        //$(cfg.modules.minimizable).draggable({ stack: cfg.modules.draggable });
        //$(cfg.modules.resizable).resizable();
        $(cfg.modules.version).html(cfg.version);
    }

    // INSTANCE CROSS-REFERENCE
    ns.version = cfg.version;
    ns.instance = {
        toolbar: new ns.Toolbar,
        sheet: new ns.Sheet,
        options: new ns.Options,
        dice: new ns.Dice,
        log: new ns.Log,
        audio: new ns.Audio
    };

    // ON DOM READY
    $(function () {
        loadModules();
    });

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));