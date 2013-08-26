var Emitter  = require('./emitter'),
    utils    = require('./utils'),
    observer = new Emitter()

var dummyEl = document.createElement('div'),
    ARGS_RE = /^function\s*?\((.+?)[\),]/,
    SCOPE_RE_STR = '\\.vm\\.[\\.\\w][\\.\\w$]*',
    noop = function () {}

/*
 *  Auto-extract the dependencies of a computed property
 *  by recording the getters triggered when evaluating it.
 *
 *  However, the first pass will contain duplicate dependencies
 *  for computed properties. It is therefore necessary to do a
 *  second pass in injectDeps()
 */
function catchDeps (binding) {
    utils.log('\n─ ' + binding.key)
    var depsHash = {}
    observer.on('get', function (dep) {
        if (depsHash[dep.key]) return
        depsHash[dep.key] = 1
        utils.log('  └─ ' + dep.key)
        binding.deps.push(dep)
        dep.subs.push(binding)
    })
    parseContextDependency(binding)
    binding.value.get({
        vm: createDummyVM(binding),
        el: dummyEl
    })
    observer.off('get')
}

/*
 *  We need to invoke each binding's getter for dependency parsing,
 *  but we don't know what sub-viewmodel properties the user might try
 *  to access in that getter. To avoid thowing an error or forcing
 *  the user to guard against an undefined argument, we staticly
 *  analyze the function to extract any possible nested properties
 *  the user expects the target viewmodel to possess. They are all assigned
 *  a noop function so they can be invoked with no real harm.
 */
function createDummyVM (binding) {
    var viewmodel = {},
        deps = binding.contextDeps
    if (!deps) return viewmodel
    var i = binding.contextDeps.length,
        j, level, key, path
    while (i--) {
        level = viewmodel
        path = deps[i].split('.')
        j = 0
        while (j < path.length) {
            key = path[j]
            if (!level[key]) level[key] = noop
            level = level[key]
            j++
        }
    }
    return viewmodel
}

/*
 *  Extract context dependency paths
 */
function parseContextDependency (binding) {
    var fn   = binding.rawGet,
        str  = fn.toString(),
        args = str.match(ARGS_RE)
    if (!args) return null
    var depsRE = new RegExp(args[1] + SCOPE_RE_STR, 'g'),
        matches = str.match(depsRE),
        base = args[1].length + 4
    if (!matches) return null
    var i = matches.length,
        deps = [], dep
    while (i--) {
        dep = matches[i].slice(base)
        if (deps.indexOf(dep) === -1) {
            deps.push(dep)
        }
    }
    binding.contextDeps = deps
    binding.compiler.contextBindings.push(binding)
}

module.exports = {

    /*
     *  the observer that catches events triggered by getters
     */
    observer: observer,

    /*
     *  parse a list of computed property bindings
     */
    parse: function (bindings) {
        utils.log('\nparsing dependencies...')
        observer.isObserving = true
        bindings.forEach(catchDeps)
        observer.isObserving = false
        utils.log('\ndone.')
    }
}