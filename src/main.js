var config      = require('./config'),
    ViewModel   = require('./viewmodel'),
    directives  = require('./directives'),
    filters     = require('./filters'),
    textParser  = require('./text-parser'),
    utils       = require('./utils')

var eventbus    = utils.eventbus,
    api         = {}

/*
 *  expose utils
 */
api.utils = utils

/*
 *  broadcast event
 */
api.broadcast = function () {
    eventbus.emit.apply(eventbus, arguments)
}

/*
 *  Allows user to create a custom directive
 */
api.directive = function (name, fn) {
    if (!fn) return directives[name]
    directives[name] = fn
}

/*
 *  Allows user to create a custom filter
 */
api.filter = function (name, fn) {
    if (!fn) return filters[name]
    filters[name] = fn
}

/*
 *  Set config options
 */
api.config = function (opts) {
    if (opts) {
        for (var key in opts) {
            config[key] = opts[key]
        }
    }
    textParser.buildRegex()
}

/*
 *  Angular style bootstrap
 */
api.bootstrap = function (el) {
    el = (typeof el === 'string'
        ? document.querySelector(el)
        : el) || document.body
    var Ctor = ViewModel,
        vmAttr = config.prefix + '-viewmodel',
        vmExp = el.getAttribute(vmAttr)
    if (vmExp) {
        Ctor = utils.getVM(vmExp)
        el.removeAttribute(vmAttr)
    }
    return new Ctor({ el: el })
}

/*
 *  Expose the main ViewModel class
 *  and add extend method
 */
api.ViewModel = ViewModel

ViewModel.extend = function (options) {
    var ExtendedVM = function (opts) {
        opts = opts || {}
        if (options.init) {
            opts.init = options.init
        }
        ViewModel.call(this, opts)
    }
    var p = ExtendedVM.prototype = Object.create(ViewModel.prototype)
    p.constructor = ExtendedVM
    if (options.props) {
        for (var prop in options.props) {
            p[prop] = options.props[prop]
        }
    }
    if (options.id) {
        utils.registerVM(options.id, ExtendedVM)
    }
    return ExtendedVM
}

// collect templates on load
utils.collectTemplates()

module.exports = api