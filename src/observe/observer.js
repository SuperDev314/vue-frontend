var _ = require('../util')
var Emitter = require('../emitter')
var arrayAugmentations = require('./array-augmentations')
var objectAugmentations = require('./object-augmentations')

var uid = 0

/**
 * Type enums
 */

var ARRAY  = 0
var OBJECT = 1

/**
 * Observer class that are attached to each observed
 * object. Observers can connect to each other like nodes
 * to map the hierarchy of data objects. Once connected,
 * detected change events can propagate up the nested chain.
 *
 * The constructor can be invoked without arguments to
 * create a value-less observer that simply listens to
 * other observers.
 *
 * @constructor
 * @extends Emitter
 * @param {Array|Object} value
 * @param {Number} type
 * @param {Object} [options]
 *                 - doNotAlterProto
 *                 - callbackContext
 */

function Observer (value, type, options) {
  Emitter.call(this, options && options.callbackContext)
  this.id = ++uid
  this.value = value
  this.type = type
  this.parents = null
  this.parentsHash = null
  if (value) {
    _.define(value, '$observer', this)
    if (type === ARRAY) {
      _.augment(value, arrayAugmentations)
      this.link(value)
    } else if (type === OBJECT) {
      if (options && options.doNotAlterProto) {
        _.define(value, '$add', objectAugmentations.$add)
        _.define(value, '$delete', objectAugmentations.$delete)
      } else {
        _.augment(value, objectAugmentations)
      }
      this.walk(value)
    }
  }
}

var p = Observer.prototype = Object.create(Emitter.prototype)

/**
 * Simply concatenating the path segments with `.` cannot
 * deal with keys that happen to contain the dot.
 *
 * Instead of the dot, we use the backspace character
 * which is much less likely to appear in property keys.
 */

Observer.pathDelimiter = '\b'

/**
 * Switch to globally control whether to emit get events.
 * Only enabled during dependency collections.
 */

Observer.emitGet = false

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @param {Object} [options] - see the Observer constructor.
 * @return {Observer|undefined}
 * @static
 */

Observer.create = function (value, options) {
  if (value &&
      value.hasOwnProperty('$observer') &&
      value.$observer instanceof Observer) {
    return value.$observer
  } else if (_.isArray(value)) {
    return new Observer(value, ARRAY, options)
  } else if (
    _.isObject(value) &&
    !value.$scope // avoid Vue instance
  ) {
    return new Observer(value, OBJECT, options)
  }
}

/**
 * Walk through each property, converting them and adding
 * them as child. This method should only be called when
 * value type is Object. Properties prefixed with `$` or `_`
 * and accessor properties are ignored.
 *
 * @param {Object} obj
 */

p.walk = function (obj) {
  var key, val, descriptor, prefix
  for (key in obj) {
    prefix = key.charCodeAt(0)
    if (
      prefix === 0x24 || // $
      prefix === 0x5F    // _
    ) {
      continue
    }
    descriptor = Object.getOwnPropertyDescriptor(obj, key)
    // only process own non-accessor properties
    if (descriptor && !descriptor.get) {
      val = obj[key]
      this.observe(key, val)
      this.convert(key, val)
    }
  }
}

/**
 * Link a list of Array items to the observer.
 *
 * @param {Array} items
 */

p.link = function (items, index) {
  index = index || 0
  for (var i = 0, l = items.length; i < l; i++) {
    this.observe(i + index, items[i])
  }
}

/**
 * Unlink a list of Array items from the observer.
 *
 * @param {Array} items
 */

p.unlink = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    this.unobserve(items[i])
  }
}

/**
 * If a property is observable,
 * create an Observer for it, and register self as
 * one of its parents with the associated property key.
 *
 * @param {String} key
 * @param {*} val
 */

p.observe = function (key, val) {
  var ob = Observer.create(val)
  if (ob) {
    // register self as a parent of the child observer.
    var parents = ob.parents
    var hash = ob.parentsHash
    if (!parents) {
      ob.parents = parents = []
      ob.parentsHash = hash = {}
    }
    if (hash[this.id]) {
      _.warn('Observing duplicate key: ' + key)
      return
    }
    var p = {
      ob: this,
      key: key
    }
    parents.push(p)
    hash[this.id] = p
  }
}

/**
 * Unobserve a property, removing self from
 * its observer's parent list.
 *
 * @param {*} val
 */

p.unobserve = function (val) {
  if (val && val.$observer) {
    val.$observer.parentsHash[this.id] = null
    var parents = val.$observer.parents
    for (var i = 0, l = parents.length; i < l; i++) {
      if (parents[i].ob === this) {
        parents.splice(i, 1)
        break
      }
    }
  }
}

/**
 * Convert a property into getter/setter so we can emit
 * the events when the property is accessed/changed.
 *
 * @param {String} key
 * @param {*} val
 */

p.convert = function (key, val) {
  var ob = this
  Object.defineProperty(ob.value, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      if (Observer.emitGet) {
        ob.propagate('get', key)
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      ob.unobserve(val)
      val = newVal
      ob.observe(key, newVal)
      ob.emit('set:self', key, newVal)
      ob.propagate('set', key, newVal)
    }
  })
}

/**
 * Emit event on self and recursively propagate all parents.
 *
 * @param {String} event
 * @param {String} path
 * @param {*} val
 * @param {Object|undefined} mutation
 */

p.propagate = function (event, path, val, mutation) {
  this.emit(event, path, val, mutation)
  var parents = this.parents
  var parent, key, parentPath
  if (!parents) return
  for (var i = 0, l = parents.length; i < l; i++) {
    parent = parents[i]
    key = parent.key
    parentPath = path
      ? key + Observer.pathDelimiter + path
      : key
    parent.ob.propagate(event, parentPath, val, mutation)
  }
}

/**
 * Update child elements' parent key,
 * should only be called when value type is Array.
 */

p.updateIndices = function () {
  var arr = this.value
  var i = arr.length
  var ob
  while (i--) {
    ob = arr[i] && arr[i].$observer
    if (ob) {
      ob.parentsHash[this.id].key = i
    }
  }
}

module.exports = Observer