var config = require('./config')

/**
 * Defer a task to the start of the next event loop
 *
 * @param {Function} fn
 */

var defer = typeof window === 'undefined'
  ? setTimeout
  : (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    setTimeout)

exports.nextTick = function (fn) {
  return defer(fn, 0)
}

/**
 * Convert an Array-like object to a real Array.
 *
 * @param {Array-like} list
 * @param {Number} [i] - start index
 */

var slice = [].slice

exports.toArray = function (list, i) {
  return slice.call(list, i || 0)
}

/**
 * Mix properties into target object.
 *
 * @param {Object} to
 * @param {Object} from
 */

exports.mixin = function (to, from) {
  for (var key in from) {
    if (to[key] !== from[key]) {
      to[key] = from[key]
    }
  }
}

/**
 * Mixin including non-enumerables, and copy property descriptors.
 *
 * @param {Object} to
 * @param {Object} from
 */

exports.deepMixin = function (to, from) {
  Object.getOwnPropertyNames(from).forEach(function (key) {
    var descriptor = Object.getOwnPropertyDescriptor(from, key)
    Object.defineProperty(to, key, descriptor)
  })
}

/**
 * Proxy a property on one object to another.
 *
 * @param {Object} to
 * @param {Object} from
 * @param {String} key
 */

exports.proxy = function (to, from, key) {
  if (to.hasOwnProperty(key)) return
  Object.defineProperty(to, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      return from[key]
    },
    set: function (val) {
      from[key] = val
    }
  })
}

/**
 * Object type check. Only returns true
 * for plain JavaScript objects.
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isObject = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * Array type check.
 *
 * @param {*} obj
 * @return {Boolean}
 */

exports.isArray = function (obj) {
  return Array.isArray(obj)
}

/**
 * Define a non-enumerable property
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 * @param {Boolean} [enumerable]
 */

exports.define = function (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value        : val,
    enumerable   : !!enumerable,
    writable     : true,
    configurable : true
  })
}

/**
 * Augment an target Object or Array by either
 * intercepting the prototype chain using __proto__,
 * or copy over property descriptors
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */

if ('__proto__' in {}) {
  exports.augment = function (target, proto) {
    target.__proto__ = proto
  }
} else {
  exports.augment = exports.deepMixin
}

/**
 * Merge two option objects.
 *
 * @param {Object} parent
 * @param {Object} child
 * @param {Boolean} noRecurse
 */

exports.mergeOptions = function (parent, child, noRecurse) {
  // TODO
  // - merge lifecycle hooks
  // - merge asset registries
  // - else override
  // - use prototypal inheritance where appropriate
}

/**
 * Insert el before target
 *
 * @param {Element} el
 * @param {Element} target 
 */

exports.before = function (el, target) {
  target.parentNode.insertBefore(el, target)
}

/**
 * Insert el after target
 *
 * @param {Element} el
 * @param {Element} target 
 */

exports.after = function (el, target) {
  if (target.nextSibling) {
    exports.before(el, target.nextSibling)
  } else {
    target.parentNode.appendChild(el)
  }
}

/**
 * Remove el from DOM
 *
 * @param {Element} el
 */

exports.remove = function (el) {
  el.parentNode.removeChild(el)
}

/**
 * Prepend el to target
 *
 * @param {Element} el
 * @param {Element} target 
 */

exports.prepend = function (el, target) {
  if (target.firstChild) {
    exports.before(el, target.firstChild)
  } else {
    target.appendChild(el)
  }
}

/**
 * Copy attributes from one element to another.
 *
 * @param {Element} from
 * @param {Element} to
 */

exports.copyAttributes = function (from, to) {
  if (from.hasAttributes()) {
    var attrs = from.attributes
    for (var i = 0, l = attrs.length; i < l; i++) {
      var attr = attrs[i]
      to.setAttribute(attr.name, attr.value)
    }
  }
}

/**
 * Enable debug utilities. The enableDebug() function and all
 * _.log() & _.warn() calls will be dropped in the minified
 * production build.
 */

enableDebug()

function enableDebug () {

  var hasConsole = typeof console !== 'undefined'
  
  /**
   * Log a message.
   *
   * @param {String} msg
   */

  exports.log = function (msg) {
    if (hasConsole && config.debug) {
      console.log(msg)
    }
  }

  /**
   * We've got a problem here.
   *
   * @param {String} msg
   */

  exports.warn = function (msg) {
    if (hasConsole && !config.silent) {
      console.warn(msg)
      if (config.debug && console.trace) {
        console.trace(msg)
      }
    }
  }

}