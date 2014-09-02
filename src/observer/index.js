var _ = require('../util')
var Binding = require('../binding')
var arrayAugmentations = require('./array')
var objectAugmentations = require('./object')

var uid = 0

/**
 * Type enums
 */

var ARRAY  = 0
var OBJECT = 1

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 *
 * @param {Array|Object} value
 * @param {Number} type
 * @constructor
 */

function Observer (value, type) {
  this.id = ++uid
  this.value = value
  this.type = type
  this.parentCount = 0
  this.vmCount = 0
  if (value) {
    _.define(value, '__ob__', this)
    if (type === ARRAY) {
      _.augment(value, arrayAugmentations)
      this.bindings = []
      this.observeArray(value)
    } else if (type === OBJECT) {
      _.augment(value, objectAugmentations)
      this.walk(value)
    }
  }
}

Observer.target = null

var p = Observer.prototype

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 *
 * @param {*} value
 * @return {Observer|undefined}
 * @static
 */

Observer.create = function (value) {
  if (
    value &&
    value.hasOwnProperty('__ob__') &&
    value.__ob__ instanceof Observer
  ) {
    return value.__ob__
  } else if (_.isArray(value)) {
    return new Observer(value, ARRAY)
  } else if (
    _.isPlainObject(value) &&
    !value.$observer // avoid Vue instance
  ) {
    return new Observer(value, OBJECT)
  }
}

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object. Properties prefixed with `$` or `_`
 * and accessor properties are ignored.
 *
 * @param {Object} obj
 */

p.walk = function (obj) {
  var keys = Object.keys(obj)
  var i = keys.length
  var key, prefix
  while (i--) {
    key = keys[i]
    prefix = key.charCodeAt(0)
    if (prefix !== 0x24 && prefix !== 0x5F) { // skip $ or _
      this.convert(key, obj[key])
    }
  }
}

/**
 * Try to carete an observer for a child value,
 * and if value is array, link binding to the array.
 *
 * @param {*} val
 * @param {Binding} [binding]
 */

p.observe = function (val, binding) {
  var ob = Observer.create(val)
  if (ob) {
    ob.parentCount++
    if (binding && ob.type === ARRAY) {
      ob.bindings.push(binding)
    }
  }
}

/**
 * Unobserve a value.
 *
 * @param {*} val
 * @param {Binding} [binding]
 */

p.unobserve = function (val, binding) {
  var ob = val && val.__ob__
  if (ob) {
    ob.parentCount--
    if (binding && ob.type === ARRAY) {
      var i = ob.bindings.indexOf(binding)
      if (i > -1) ob.bindings.splice()
    }
    ob.tryRelease()
  }
}

/**
 * Observe a list of Array items.
 *
 * @param {Array} items
 */

p.observeArray = function (items) {
  var i = items.length
  while (i--) {
    this.observe(items[i])
  }
}

/**
 * Unobserve a list of Array items.
 *
 * @param {Array} items
 */

p.unobserveArray = function (items) {
  var i = items.length
  while (i--) {
    this.unobserve(items[i])
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
  var binding = new Binding()
  ob.observe(val, binding)
  Object.defineProperty(ob.value, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      // Observer.target is a watcher whose getter is
      // currently being evaluated.
      if (Observer.target) {
        Observer.target.addDep(binding)
      }
      return val
    },
    set: function (newVal) {
      if (newVal === val) return
      ob.unobserve(val, binding)
      ob.observe(newVal, binding)
      val = newVal
      binding.notify()
    }
  })
}

/**
 * Attempt to teardown the observer if the value is no
 * longer needed. Two requirements have to be met:
 *
 * 1. The observer has no parent obervers depending on it.
 * 2. The observer is not being used as the root $data by
 *    by a vm instance.
 *
 * This is important because each observer holds strong
 * reference to all its parents and if we don't do this
 * those parents can be leaked when a vm is destroyed.
 */

p.tryRelease = function () {
  if (!this.parentCount && !this.vmCount) {
    var value = this.value
    if (_.isArray(value)) {
      value.__ob__.bindings = null
      this.unobserveArray(value)
    } else {
      for (var key in value) {
        var val = value[key]
        this.unobserve(val)
        // release closure
        _.define(value, key, val, true)
      }
    }
    value.__ob__ = null
  }
}

module.exports = Observer