var config          = require('./config'),
    Emitter         = require('emitter'),
    Binding         = require('./binding'),
    Directive       = require('./directive'),
    TextParser      = require('./text-parser')

var slice           = Array.prototype.slice,
    ctrlAttr        = config.prefix + '-controller',
    eachAttr        = config.prefix + '-each'

var depsObserver    = new Emitter(),
    parsingDeps     = false

/*
 *  The main ViewModel class
 *  scans a node and parse it to populate data bindings
 */
function Seed (el, options) {

    if (typeof el === 'string') {
        el = document.querySelector(el)
    }

    this.el         = el
    el.seed         = this
    this._bindings  = {}
    this._computed  = []

    // copy options
    options = options || {}
    for (var op in options) {
        this[op] = options[op]
    }

    // check if there's passed in data
    var dataAttr = config.prefix + '-data',
        dataId = el.getAttribute(dataAttr),
        data = (options && options.data) || config.datum[dataId] || {}
    el.removeAttribute(dataAttr)

    // if the passed in data is the scope of a Seed instance,
    // make a copy from it
    if (data.$seed instanceof Seed) {
        data = data.$dump()
    }

    // initialize the scope object
    var scope = this.scope = {}

    scope.$el       = el
    scope.$seed     = this
    scope.$destroy  = this._destroy.bind(this)
    scope.$dump     = this._dump.bind(this)
    scope.$index    = options.index
    scope.$parent   = options.parentSeed && options.parentSeed.scope

    // copy data
    for (var key in data) {
        scope[key] = data[key]
    }

    // if has controller function, apply it so we have all the user definitions
    var ctrlID = el.getAttribute(ctrlAttr)
    if (ctrlID) {
        el.removeAttribute(ctrlAttr)
        var factory = config.controllers[ctrlID]
        if (factory) {
            factory(this.scope)
        } else {
            console.warn('controller ' + ctrlID + ' is not defined.')
        }
    }

    // add event listener to update corresponding binding
    // when a property is set
    var self = this
    this.on('set', function (key, value) {
        self._bindings[key].update(value)
    })

    // now parse the DOM
    this._compileNode(el, true)

    // extract dependencies for computed properties
    parsingDeps = true
    this._computed.forEach(parseDeps)
    this._computed.forEach(injectDeps)
    delete this._computed
    parsingDeps = false
}

/*
 *  Compile a DOM node (recursive)
 */
Seed.prototype._compileNode = function (node, root) {
    var seed = this

    if (node.nodeType === 3) { // text node

        seed._compileTextNode(node)

    } else if (node.nodeType === 1) {

        var eachExp = node.getAttribute(eachAttr),
            ctrlExp = node.getAttribute(ctrlAttr)

        if (eachExp) { // each block

            var directive = Directive.parse(eachAttr, eachExp)
            if (directive) {
                directive.el = node
                seed._bind(directive)
            }

        } else if (ctrlExp && !root) { // nested controllers

            new Seed(node, {
                child: true,
                parentSeed: seed
            })

        } else { // normal node

            // parse if has attributes
            if (node.attributes && node.attributes.length) {
                // forEach vs for loop perf comparison: http://jsperf.com/for-vs-foreach-case
                // takeaway: not worth it to wrtie manual loops.
                slice.call(node.attributes).forEach(function (attr) {
                    if (attr.name === ctrlAttr) return
                    var valid = false
                    attr.value.split(',').forEach(function (exp) {
                        var directive = Directive.parse(attr.name, exp)
                        if (directive) {
                            valid = true
                            directive.el = node
                            seed._bind(directive)
                        }
                    })
                    if (valid) node.removeAttribute(attr.name)
                })
            }

            // recursively compile childNodes
            if (node.childNodes.length) {
                slice.call(node.childNodes).forEach(function (child) {
                    seed._compileNode(child)
                })
            }
        }
    }
}

/*
 *  Compile a text node
 */
Seed.prototype._compileTextNode = function (node) {
    var tokens = TextParser.parse(node)
    if (!tokens) return
    var seed = this,
        dirname = config.prefix + '-text'
    tokens.forEach(function (token) {
        var el = document.createTextNode()
        if (token.key) {
            var directive = Directive.parse(dirname, token.key)
            if (directive) {
                directive.el = el
                seed._bind(directive)
            }
        } else {
            el.nodeValue = token
        }
        node.parentNode.insertBefore(el, node)
    })
    node.parentNode.removeChild(node)
}

/*
 *  Add a directive instance to the correct binding & scope
 */
Seed.prototype._bind = function (directive) {

    var key = directive.key,
        seed = directive.seed = this

    if (this.each) {
        if (this.eachPrefixRE.test(key)) {
            key = directive.key = key.replace(this.eachPrefixRE, '')
        } else {
            seed = this.parentSeed
        }
    }

    seed = getScopeOwner(directive, seed)
    var binding = seed._bindings[key] || seed._createBinding(key)

    // add directive to this binding
    binding.instances.push(directive)
    directive.binding = binding

    // invoke bind hook if exists
    if (directive.bind) {
        directive.bind(binding.value)
    }

    // set initial value
    directive.update(binding.value)

}

/*
 *  Create binding and attach getter/setter for a key to the scope object
 */
Seed.prototype._createBinding = function (key) {

    var binding = new Binding()
    binding.set(this.scope[key])
    this._bindings[key] = binding
    if (binding.isComputed) this._computed.push(binding)

    var seed = this
    Object.defineProperty(this.scope, key, {
        get: function () {
            if (parsingDeps) {
                depsObserver.emit('get', binding)
            }
            seed.emit('get', key)
            return binding.isComputed
                ? binding.value.get()
                : binding.value
        },
        set: function (value) {
            if (value === binding.value) return
            seed.emit('set', key, value)
        }
    })

    return binding
}

/*
 *  Call unbind() of all directive instances
 *  to remove event listeners, destroy child seeds, etc.
 */
Seed.prototype._unbind = function () {
    var unbind = function (instance) {
        if (instance.unbind) {
            instance.unbind()
        }
    }
    for (var key in this._bindings) {
        this._bindings[key].instances.forEach(unbind)
    }
}

/*
 *  Unbind and remove element
 */
Seed.prototype._destroy = function () {
    this._unbind()
    this.el.parentNode.removeChild(this.el)
}

/*
 *  Dump a copy of current scope data, excluding seed-exposed properties.
 */
Seed.prototype._dump = function () {
    var dump = {}, binding, val,
        subDump = function (scope) {
            return scope.$dump()
        }
    for (var key in this._bindings) {
        binding = this._bindings[key]
        val = binding.value
        if (!val) continue
        if (Array.isArray(val)) {
            dump[key] = val.map(subDump)
        } else if (typeof val !== 'function') {
            dump[key] = val
        } else if (binding.isComputed) {
            dump[key] = val.get()
        }
    }
    return dump
}

// Helpers --------------------------------------------------------------------

/*
 *  Auto-extract the dependencies of a computed property
 *  by recording the getters triggered when evaluating it.
 *
 *  However, the first pass will contain duplicate dependencies
 *  for computed properties. It is therefore necessary to do a
 *  second pass in injectDeps()
 */
function parseDeps (binding) {
    binding.dependencies = []
    depsObserver.on('get', function (dep) {
        binding.dependencies.push(dep)
    })
    binding.value.get()
    depsObserver.off('get')
}

/*
 *  The second pass of dependency extraction.
 *  Only include dependencies that don't have dependencies themselves.
 */
function injectDeps (binding) {
    binding.dependencies.forEach(function (dep) {
        if (!dep.dependencies || !dep.dependencies.length) {
            dep.dependents.push.apply(dep.dependents, binding.instances)
        }
    })
}

/*
 *  determine which scope a key belongs to based on nesting symbols
 */
function getScopeOwner (key, seed) {
    if (key.nesting) {
        var levels = key.nesting
        while (seed.parentSeed && levels--) {
            seed = seed.parentSeed
        }
    } else if (key.root) {
        while (seed.parentSeed) {
            seed = seed.parentSeed
        }
    }
    return seed
}

Emitter(Seed.prototype)

module.exports = Seed