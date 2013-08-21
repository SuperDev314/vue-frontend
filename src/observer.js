var Emitter = require('emitter'),
    utils   = require('./utils'),
    typeOf  = utils.typeOf,
    def     = Object.defineProperty,
    slice   = Array.prototype.slice,
    methods = ['push','pop','shift','unshift','splice','sort','reverse']

var arrayMutators = {
    remove: function (index) {
        if (typeof index !== 'number') index = this.indexOf(index)
        this.splice(index, 1)
    },
    replace: function (index, data) {
        if (typeof index !== 'number') index = this.indexOf(index)
        this.splice(index, 1, data)
    }
}

methods.forEach(function (method) {
    arrayMutators[method] = function () {
        var result = Array.prototype[method].apply(this, arguments)
        this.__observer__.emit('mutate', this.__path__, this, {
            method: method,
            args: slice.call(arguments),
            result: result
        })
    }
})

function watch (obj, path, observer) {
    var type = typeOf(obj)
    if (type === 'Object') {
        watchObject(obj, path, observer)
    } else if (type === 'Array') {
        watchArray(obj, path, observer)
    }
}

function watchObject (obj, path, observer) {
    defProtected(obj, '__values__', {})
    defProtected(obj, '__observer__', observer)
    for (var key in obj) {
        bind(obj, key, path, obj.__observer__)
    }
}

function watchArray (arr, path, observer) {
    defProtected(arr, '__path__', path)
    defProtected(arr, '__observer__', observer)
    for (var method in arrayMutators) {
        defProtected(arr, method, arrayMutators[method])
    }
}

function bind (obj, key, path, observer) {
    var val = obj[key],
        watchable = isWatchable(val),
        values = obj.__values__,
        fullKey = (path ? path + '.' : '') + key
    values[fullKey] = val
    // emit set on bind
    // this means when an object is observed it will emit
    // a first batch of set events.
    observer.emit('set', fullKey, val)
    def(obj, key, {
        enumerable: true,
        get: function () {
            // only emit get on tip values
            if (!watchable) observer.emit('get', fullKey)
            return values[fullKey]
        },
        set: function (newVal) {
            values[fullKey] = newVal
            watch(newVal, fullKey, observer)
            observer.emit('set', fullKey, newVal)
        }
    })
    watch(val, fullKey, observer)
}

function defProtected (obj, key, val) {
    if (obj.hasOwnProperty(key)) return
    def(obj, key, {
        enumerable: false,
        configurable: false,
        value: val
    })
}

function isWatchable (obj) {
    var type = typeOf(obj)
    return type === 'Object' || type === 'Array'
}

function emitSet (obj, observer) {
    var values = obj.__values__
    for (var key in values) {
        observer.emit('set', key, values[key])
    }
}

module.exports = {

    observe: function (obj, path, observer) {
        if (isWatchable(obj)) {
            path = path + '.'
            var ob, alreadyConverted = !!obj.__observer__
            if (!alreadyConverted) {
                ob = new Emitter()
                defProtected(obj, '__observer__', ob)
            }
            var proxies = observer.proxies[path] = {
                get: function (key) {
                    observer.emit('get', path + key)
                },
                set: function (key, val) {
                    observer.emit('set', path + key, val)
                },
                mutate: function (key, val, mutation) {
                    observer.emit('mutate', path + key, val, mutation)
                }
            }
            obj.__observer__
                .on('get', proxies.get)
                .on('set', proxies.set)
                .on('mutate', proxies.mutate)
            if (alreadyConverted) {
                emitSet(obj, obj.__observer__)
            } else {
                watch(obj, null, ob)
            }
        }
    },

    unobserve: function (obj, path, observer) {
        if (!obj || !obj.__observer__) return
        path = path + '.'
        var proxies = observer.proxies[path]
        obj.__observer__
            .off('get', proxies.get)
            .off('set', proxies.set)
            .off('mutate', proxies.mutate)
        observer.proxies[path] = null
    }
}