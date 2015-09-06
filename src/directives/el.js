var _ = require('../util')

module.exports = {

  isLiteral: true,
  priority: 1500,

  bind: function () {
    if (this.arg) {
      this._isDynamicLiteral = true
    } else {
      this.update(this.expression)
    }
  },

  update: function (id) {
    if (this.id) {
      this.unbind()
    }
    this.id = id
    var refs = (this._scope || this.vm).$$
    if (refs.hasOwnProperty(id)) {
      refs[id] = this.el
    } else {
      _.defineReactive(refs, id, this.el)
    }
  },

  unbind: function () {
    var refs = (this._scope || this.vm).$$
    if (refs[this.id] === this.el) {
      refs[this.id] = null
    }
  }
}
