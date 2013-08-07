var config     = require('./config'),
    directives = require('./directives'),
    filters    = require('./filters')

var KEY_RE          = /^[^\|<]+/,
    ARG_RE          = /([^:]+):(.+)$/,
    FILTERS_RE      = /\|[^\|<]+/g,
    FILTER_TOKEN_RE = /[^\s']+|'[^']+'/g,
    DEPS_RE         = /<[^<\|]+/g,
    INVERSE_RE      = /^!/
    NESTING_RE      = /^\^+/

// parse a key, extract argument and nesting/root info
function parseKey (rawKey) {

    var res = {},
        argMatch = rawKey.match(ARG_RE)

    res.key = argMatch
        ? argMatch[2].trim()
        : rawKey.trim()

    res.arg = argMatch
        ? argMatch[1].trim()
        : null

    res.inverse = INVERSE_RE.test(res.key)
    if (res.inverse) {
        res.key = res.key.slice(1)
    }

    var nesting = res.key.match(NESTING_RE)
    res.nesting = nesting
        ? nesting[0].length
        : false

    res.root = res.key.charAt(0) === '$'

    if (res.nesting) {
        res.key = res.key.replace(NESTING_RE, '')
    } else if (res.root) {
        res.key = res.key.slice(1)
    }

    return res
}

function parseFilter (filter) {

    var tokens = filter.slice(1)
        .match(FILTER_TOKEN_RE)
        .map(function (token) {
            return token.replace(/'/g, '').trim()
        })

    return {
        name  : tokens[0],
        apply : filters[tokens[0]],
        args  : tokens.length > 1
                ? tokens.slice(1)
                : null
    }
}

function Directive (directiveName, expression) {

    var prop, directive = directives[directiveName]
    if (typeof directive === 'function') {
        this._update = directive
    } else {
        for (prop in directive) {
            if (prop === 'update') {
                this['_update'] = directive.update
            } else {
                this[prop] = directive[prop]
            }
        }
    }

    this.directiveName = directiveName
    this.expression = expression

    var rawKey   = expression.match(KEY_RE)[0],
        keyInfo  = parseKey(rawKey)

    for (prop in keyInfo) {
        this[prop] = keyInfo[prop]
    }
    
    var filterExps = expression.match(FILTERS_RE)
    this.filters = filterExps
        ? filterExps.map(parseFilter)
        : null
}

// called when a dependency has changed
Directive.prototype.refresh = function () {
    var getter = this.value
    if (getter && typeof getter === 'function') {
        var value = getter.call(this.seed.scope)
        if (this.inverse) value = !value
        this._update(
            this.filters
            ? this.applyFilters(value)
            : value
        )
    }
    this.binding.emitChange()
}

// called when a new value is set
Directive.prototype.update = function (value) {
    if (value && (value === this.value)) return
    this.value = value
    // computed property
    if (typeof value === 'function' && !this.fn) {
        value = value()
    }
    if (this.inverse) value = !value
    this._update(
        this.filters
        ? this.applyFilters(value)
        : value
    )
    if (this.binding.isComputed) {
        this.refresh()
    }
}

Directive.prototype.applyFilters = function (value) {
    var filtered = value
    this.filters.forEach(function (filter) {
        if (!filter.apply) throw new Error('Unknown filter: ' + filter.name)
        filtered = filter.apply(filtered, filter.args)
    })
    return filtered
}

module.exports = {

    // make sure the directive and value is valid
    parse: function (dirname, expression) {

        var prefix = config.prefix
        if (dirname.indexOf(prefix) === -1) return null
        dirname = dirname.slice(prefix.length + 1)

        var dir   = directives[dirname],
            valid = KEY_RE.test(expression)

        if (!dir) console.warn('unknown directive: ' + dirname)
        if (!valid) console.warn('invalid directive expression: ' + expression)

        return dir && valid
            ? new Directive(dirname, expression)
            : null
    }
}