var config      = require('./config'),
    ViewModel   = require('./viewmodel'),
    directives  = require('./directives'),
    filters     = require('./filters'),
    textParser  = require('./text-parser'),
    utils       = require('./utils'),
    api         = {}

/*
 *  Set config options
 */
api.config = function (opts) {
    if (opts) {
        utils.extend(config, opts)
        textParser.buildRegex()
    }
}

/*
 *  Allows user to register/retrieve a directive definition
 */
api.directive = function (id, fn) {
    if (!fn) return directives[id]
    directives[id] = fn
}

/*
 *  Allows user to register/retrieve a filter function
 */
api.filter = function (id, fn) {
    if (!fn) return filters[id]
    filters[id] = fn
}

/*
 *  Allows user to register/retrieve a ViewModel constructor
 */
api.vm = function (id, Ctor) {
    if (!Ctor) return utils.vms[id]
    utils.vms[id] = Ctor
}

/*
 *  Allows user to register/retrieve a template partial
 */
api.partial = function (id, partial) {
    if (!partial) return utils.partials[id]
    utils.partials[id] = partial
}

api.ViewModel = ViewModel
ViewModel.extend = extend

/*
 *  Expose the main ViewModel class
 *  and add extend method
 */
function extend (options) {
    var ParentVM = this
    // inherit options
    options = inheritOptions(options, ParentVM.options, true)
    var ExtendedVM = function (opts) {
        opts = inheritOptions(opts, options, true)
        ParentVM.call(this, opts)
    }
    // inherit prototype props
    var proto = ExtendedVM.prototype = Object.create(ParentVM.prototype)
    utils.defProtected(proto, 'constructor', ExtendedVM)
    // copy prototype props
    if (options.props) {
        utils.extend(proto, options.props, function (key) {
            // do not overwrite the ancestor ViewModel prototype methods
            return !(key in ViewModel.prototype)
        })
    }
    // convert template to documentFragment
    if (options.template) {
        options.templateFragment = templateToFragment(options.template)
    }
    // allow extended VM to be further extended
    ExtendedVM.extend = extend
    ExtendedVM.super = ParentVM
    ExtendedVM.options = options
    return ExtendedVM
}

/*
 *  Inherit options
 *
 *  For options such as `data`, `vms`, `directives`, 'partials',
 *  they should be further extended. However extending should only
 *  be done at top level.
 *  
 *  `props` is an exception because it's handled directly on the
 *  prototype.
 *
 *  `el` is an exception because it's not allowed as an
 *  extension option, but only as an instance option.
 */
function inheritOptions (child, parent, topLevel) {
    child = child || {}
    if (!parent) return child
    for (var key in parent) {
        if (key === 'el' || key === 'props') continue
        if (!child[key]) { // child has priority
            child[key] = parent[key]
        } else if (topLevel && utils.typeOf(child[key]) === 'Object') {
            inheritOptions(child[key], parent[key], false)
        }
    }
    return child
}

/*
 *  Convert a string template to a dom fragment
 */
function templateToFragment (template) {
    if (template.charAt(0) === '#') {
        var templateNode = document.querySelector(template)
        if (!templateNode) return
        template = templateNode.innerHTML
    }
    var node = document.createElement('div'),
        frag = document.createDocumentFragment(),
        child
    node.innerHTML = template.trim()
    /* jshint boss: true */
    while (child = node.firstChild) {
        frag.appendChild(child)
    }
    return frag
}

module.exports = api