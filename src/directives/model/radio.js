var _ = require('../../util')

module.exports = {

  bind: function () {
    var self = this
    var el = this.el
    var number = this._checkParam('number') != null
    var expression = this._checkParam('exp')
    function getValue () {
      var val = el.value
      if(number) {
        val = _.toNumber(val)
      } else if (expression !== null) {
        val = self.vm.$eval(expression)
      }
      return val
    }
    this._getValue = getValue;
    this.listener = function () {
      self.set(getValue())
    }
    _.on(el, 'change', this.listener)
    if (el.checked) {
      this._initValue = getValue()
    }
  },

  update: function (value) {
    /* eslint-disable eqeqeq */
    this.el.checked = value == this._getValue()
    /* eslint-enable eqeqeq */
  },

  unbind: function () {
    _.off(this.el, 'change', this.listener)
  }
}
