var Emitter = require('./emitter'),
    utils   = require('./utils'),
    typeOf  = utils.typeOf,
    def     = Object.defineProperty,
    slice   = Array.prototype.slice,
    methods = ['push','pop','shift','unshift','splice','sort','reverse']

// The proxy prototype to replace the __proto__ of
// an observed array
var ArrayProxy = Object.create(Array.prototype)

// Define mutation interceptors so we can emit the mutation info
methods.forEach(function (method) {
    ArrayProxy[method] = function () {
        var result = Array.prototype[method].apply(this, arguments)
        this.__observer__.emit('mutate', this.__path__, this, {
            method: method,
            args: slice.call(arguments),
            result: result
        })
        return result
    }
})

ArrayProxy.remove = function (index) {
    if (typeof index !== 'number') index = this.indexOf(index)
    return this.splice(index, 1)[0]
}
    
ArrayProxy.replace = function (index, data) {
    if (typeof index !== 'number') index = this.indexOf(index)
    return this.splice(index, 1, data)[0]
}
    
ArrayProxy.mutateFilter = function (fn) {
    var i = this.length
    while (i--) {
        if (!fn(this[i])) this.splice(i, 1)
    }
    return this
}

/*
 *  Watch an object based on type
 */
function watch (obj, path, observer) {
    var type = typeOf(obj)
    if (type === 'Object') {
        watchObject(obj, path, observer)
    } else if (type === 'Array') {
        watchArray(obj, path, observer)
    }
}

/*
 *  Watch an Object, recursive.
 */
function watchObject (obj, path, observer) {
    defProtected(obj, '__values__', {})
    defProtected(obj, '__observer__', observer)
    for (var key in obj) {
        bind(obj, key, path, obj.__observer__)
    }
}

/*
 *  Watch an Array, attach mutation interceptors
 *  and augmentations
 */
function watchArray (arr, path, observer) {
    if (path) defProtected(arr, '__path__', path)
    defProtected(arr, '__observer__', observer)
    /* jshint proto:true */
    arr.__proto__ = ArrayProxy
}

/*
 *  Define accessors for a property on an Object
 *  so it emits get/set events.
 *  Then watch the value itself.
 */
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
            observer.emit('set', fullKey, newVal)
            watch(newVal, fullKey, observer)
        }
    })
    watch(val, fullKey, observer)
}

/*
 *  Define an ienumerable property
 *  This avoids it being included in JSON.stringify
 *  or for...in loops.
 */
function defProtected (obj, key, val) {
    if (obj.hasOwnProperty(key)) return
    def(obj, key, {
        enumerable: false,
        configurable: false,
        value: val
    })
}

/*
 *  Check if a value is watchable
 */
function isWatchable (obj) {
    var type = typeOf(obj)
    return type === 'Object' || type === 'Array'
}

/*
 *  When a value that is already converted is
 *  observed again by another observer, we can skip
 *  the watch conversion and simply emit set event for
 *  all of its properties.
 */
function emitSet (obj, observer) {
    if (typeOf(obj) === 'Array') {
        observer.emit('set', 'length', obj.length)
    } else {
        emit(obj.__values__)
    }
    function emit (values, path) {
        var val
        path = path ? path + '.' : ''
        for (var key in values) {
            val = values[key]
            observer.emit('set', path + key, val)
            if (typeOf(val) === 'Object') {
                emit(val, key)
            }
        }
    }
}

module.exports = {

    // used in sd-each
    watchArray: watchArray,

    /*
     *  Observe an object with a given path,
     *  and proxy get/set/mutate events to the provided observer.
     */
    observe: function (obj, rawPath, observer) {
        if (isWatchable(obj)) {
            var path = rawPath + '.',
                ob, alreadyConverted = !!obj.__observer__
            if (!alreadyConverted) {
                defProtected(obj, '__observer__', new Emitter())
            }
            ob = obj.__observer__
            var proxies = observer.proxies[path] = {
                get: function (key) {
                    observer.emit('get', path + key)
                },
                set: function (key, val) {
                    observer.emit('set', path + key, val)
                },
                mutate: function (key, val, mutation) {
                    // if the Array is a root value
                    // the key will be null
                    var fixedPath = key ? path + key : rawPath
                    observer.emit('mutate', fixedPath, val, mutation)
                    // also emit set for Array's length when it mutates
                    var m = mutation.method
                    if (m !== 'sort' && m !== 'reverse') {
                        observer.emit('set', fixedPath + '.length', val.length)
                    }
                }
            }
            ob
                .on('get', proxies.get)
                .on('set', proxies.set)
                .on('mutate', proxies.mutate)
            if (alreadyConverted) {
                emitSet(obj, ob, rawPath)
            } else {
                watch(obj, null, ob)
            }
        }
    },

    /*
     *  Cancel observation, turn off the listeners.
     */
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