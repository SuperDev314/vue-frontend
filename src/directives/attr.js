var _ = require('../util')

// xlink
var xlinkNS = 'http://www.w3.org/1999/xlink'
var xlinkRE = /^xlink:/

// these input element attributes should also set their
// corresponding properties
var inputProps = {
  value: 1,
  checked: 1,
  selected: 1
}

// these attributes should set a hidden property for
// binding v-model to object values
var modelProps = {
  value: '_value',
  'true-value': '_trueValue',
  'false-value': '_falseValue'
}

// check for attribtues that prohibit interpolations
var disallowedInterpAttrRE = /^v-|^:|^@|^(is|transition|transition-mode|debounce|track-by|stagger|enter-stagger|leave-stagger)$/

module.exports = {

  priority: 850,

  update: function (value) {
    if (this.arg) {
      if (process.env.NODE_ENV !== 'production') {
        if (disallowedInterpAttrRE.test(this.arg)) {
          _.deprecation.ATTR_INVALID(this.arg)
        }
      }
      this.setAttr(this.arg, value)
    } else if (typeof value === 'object') {
      // TODO no longer need to support object in 1.0.0
      this.objectHandler(value)
    }
  },

  objectHandler: function (value) {
    // cache object attrs so that only changed attrs
    // are actually updated.
    var cache = this.cache || (this.cache = {})
    var attr, val
    for (attr in cache) {
      if (!(attr in value)) {
        this.setAttr(attr, null)
        delete cache[attr]
      }
    }
    for (attr in value) {
      val = value[attr]
      if (val !== cache[attr]) {
        cache[attr] = val
        this.setAttr(attr, val)
      }
    }
  },

  setAttr: function (attr, value) {
    if (inputProps[attr] && attr in this.el) {
      this.el[attr] = value
    }
    // set model props
    var modelProp = modelProps[attr]
    if (modelProp) {
      this.el[modelProp] = value
      // update v-model if present
      var model = this.el.__v_model
      if (model) {
        model.listener()
      }
    }
    // do not set value attribute for textarea
    if (attr === 'value' && this.el.tagName === 'TEXTAREA') {
      this.el.removeAttribute(attr)
      return
    }
    // update attribute
    if (value != null && value !== false) {
      if (xlinkRE.test(attr)) {
        this.el.setAttributeNS(xlinkNS, attr, value)
      } else {
        this.el.setAttribute(attr, value)
      }
    } else {
      this.el.removeAttribute(attr)
    }
  }
}
