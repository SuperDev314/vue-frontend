var _ = require('./util')
var Watcher = require('./watcher')
var textParser = require('./parse/text')

/**
 * A directive links a DOM element with a piece of data,
 * which is the result of evaluating an expression.
 * It registers a watcher with the expression and calls
 * the DOM update function when a change is triggered.
 *
 * @param {String} name
 * @param {Node} el
 * @param {Vue} vm
 * @param {Object} descriptor
 *                 - {String} expression
 *                 - {String} [arg]
 *                 - {Array<Object>} [filters]
 * @constructor
 */

function Directive (name, el, vm, descriptor) {
  // public
  this.name = name
  this.el = el
  this.vm = vm
  this.arg = descriptor.arg
  this.expression = descriptor.expression
  this.filters = descriptor.filters

  // private
  this._locked = false
  this._bound = false
  // init definition
  this._initDef()
  this._bind()
}

var p = Directive.prototype

/**
 * Initialize the directive instance's definition.
 */

p._initDef = function () {
  var def = this.vm.$options.directives[this.name]
  _.extend(this, def)
  // init params
  var el = this.el
  var attrs = this.paramAttributes
  if (attrs) {
    var params = this.params = {}
    attrs.forEach(function (p) {
      params[p] = el.getAttribute(p)
      el.removeAttribute(p)
    })
  }
}

/**
 * Initialize the directive, setup the watcher,
 * call definition bind() and update() if present.
 */

p._bind = function () {
  // check if this is a dynamic literal binding
  // e.g. v-component="{{currentView}}"
  var expression = this.expression
  var isDynamicLiteral = false
  if (this.literal) {
    var tokens = textParser.parse(expression)
    if (tokens) {
      if (tokens.length > 1) {
        _.warn(
          'Invalid literal directive: ' +
          this.name + '="' + expression + '"' +
          '\nDon\'t mix binding tags with plain text ' +
          'in literal directives.'
        )
      } else {
        isDynamicLiteral = true
        expression = tokens[0].value
        this.expression = this.vm.$eval(expression)
      }
    }
  }
  if (this.bind) {
    this.bind()
  }
  if (
    expression && this.update &&
    (!this.literal || isDynamicLiteral)
  ) {
    this._watcher = new Watcher(
      this.vm,
      expression,
      this._update, // callback
      this, // callback context
      this.filters,
      this.twoWay // need setter
    )
    this.update(this._watcher.value)
  }
  this._bound = true
}

/**
 * Callback for the watcher.
 * Check locked or not before calling definition update.
 *
 * @param {*} value
 * @param {*} oldValue
 */

p._update = function (value, oldValue) {
  if (!this._locked) {
    this.update(value, oldValue)
  }
}

/**
 * Teardown the watcher and call unbind.
 */

p._teardown = function () {
  if (this._bound) {
    if (this.unbind) {
      this.unbind()
    }
    this._watcher.teardown()
    this._bound = false
  }
}

/**
 * Set the corresponding value with the setter.
 * This should only be used in two-way directives
 * e.g. v-model.
 *
 * @param {*} value
 * @param {Boolean} lock - prevent wrtie triggering update.
 * @public
 */

p.set = function (value, lock) {
  if (this.twoWay) {
    if (lock) {
      this._locked = true
    }
    this._watcher.set(value)
    if (lock) {
      _.nextTick(this._unlock, this)
    }
  }
}

module.exports = Directive