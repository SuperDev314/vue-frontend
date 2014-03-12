var utils      = require('../utils'),
    config     = require('../config'),
    transition = require('../transition')

module.exports = {

    on        : require('./on'),
    repeat    : require('./repeat'),
    model     : require('./model'),
    'if'      : require('./if'),
    'with'    : require('./with'),
    html      : require('./html'),
    style     : require('./style'),
    partial   : require('./partial'),
    view      : require('./view'),

    component : {
        isLiteral: true,
        bind: function () {
            if (!this.el.vue_vm) {
                this.component = new this.Ctor({
                    el: this.el,
                    parent: this.vm
                })
            }
        },
        unbind: function () {
            if (this.component) {
                this.component.$destroy()
            }
        }
    },

    attr: {
        bind: function () {
            var params = this.vm.$options.paramAttributes
            this.isParam = params && params.indexOf(this.arg) > -1
        },
        update: function (value) {
            if (value || value === 0) {
                this.el.setAttribute(this.arg, value)
            } else {
                this.el.removeAttribute(this.arg)
            }
            if (this.isParam) {
                this.vm[this.arg] = utils.checkNumber(value)
            }
        }
    },

    text: {
        bind: function () {
            this.attr = this.el.nodeType === 3
                ? 'nodeValue'
                : 'textContent'
        },
        update: function (value) {
            this.el[this.attr] = utils.guard(value)
        }
    },

    show: function (value) {
        var el = this.el,
            target = value ? '' : 'none',
            change = function () {
                el.style.display = target
            }
        transition(el, value ? 1 : -1, change, this.compiler)
    },

    'class': function (value) {
        if (this.arg) {
            utils[value ? 'addClass' : 'removeClass'](this.el, this.arg)
        } else {
            if (this.lastVal) {
                utils.removeClass(this.el, this.lastVal)
            }
            if (value) {
                utils.addClass(this.el, value)
                this.lastVal = value
            }
        }
    },

    cloak: {
        isEmpty: true,
        bind: function () {
            var el = this.el
            this.compiler.observer.once('hook:ready', function () {
                el.removeAttribute(config.prefix + '-cloak')
            })
        }
    },

    ref: {
        isLiteral: true,
        bind: function () {
            var id = this.expression
            if (id) {
                this.vm.$parent.$[id] = this.vm
            }
        },
        unbind: function () {
            var id = this.expression
            if (id) {
                delete this.vm.$parent.$[id]
            }
        }
    }

}