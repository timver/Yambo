window.Yambo = (function ($, ns) {

    // ECMA-262/5
    'use strict';

    /**
     * @private
     * @constant
     */
    var cfg = {
        version: '2.0.0 b&egrave;ta',
        modules: {
            draggable: '.ui-draggable',
            minimizable: '.panel',
            resizable: '.ui-resizable',
            version: '.version'
        },
        options: {
            draggable: {
                stack: '.panel',
                snap: true,
                snapMode: 'both',
                handle: '.ui-dialog-titlebar'
            }
        }
    };

    /**
     * @private
     * @function
     */
    function loadModules() {
        var mod = cfg.modules,
            opt = cfg.options;

        //$(mod.minimizable).minimizable();
        //$(mod.draggable).draggable(opt.draggable);
        dragula([document.querySelector('.col.g45'), document.querySelector('.col.g55')]);
        //$(mod.resizable).resizable();
        $(mod.version).html(cfg.version);
    }

    /**
     * @instance
     */
    ns.version = cfg.version;
    ns.instance = {
        toolbar: new ns.Toolbar,
        sheet: new ns.Sheet,
        options: new ns.Options,
        dice: new ns.Dice,
        log: new ns.Log,
        audio: new ns.Audio
    };

    /**
     * @event DOM ready
     */
    $(function () {
        loadModules();
    });

    // EXPOSE NAMESPACE
    return ns;

}(window.jQuery, window.Yambo || {}));