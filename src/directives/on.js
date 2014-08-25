var _ = require('../util')

module.exports = {

  isFn: true,

  priority: 700,

  bind: function () {
    // deal with iframes
    if (
      this.el.tagName === 'IFRAME' &&
      this.arg !== 'load'
    ) {
      var self = this
      this.iframeBind = function () {
        self.el.contentWindow.addEventListener(
          self.arg,
          self.handler
        )
      }
      this.el.addEventListener('load', this.iframeBind)
    }
  },

  update: function (handler) {
    if (typeof handler !== 'function') {
      _.warn(
        'Directive "v-on:' + this.expression + '" ' +
        'expects a function value.'
      )
      return
    }
    this.reset()
    var vm = this.vm
    var root = vm.$root
    this.handler = function (e) {
      e.targetVM = vm
      root.$event = e
      var res = handler(e)
      root.$event = null
      return res
    }
    if (this.iframeBind) {
      this.iframeBind()
    } else {
      this.el.addEventListener(this.arg, this.handler)
    }
  },

  reset: function () {
    var el = this.iframeBind
      ? this.el.contentWindow
      : this.el
    if (this.handler) {
      el.removeEventListener(this.arg, this.handler)
    }
  },

  unbind: function () {
    this.reset()
    this.el.removeEventListener('load', this.iframeBind)
  }
}