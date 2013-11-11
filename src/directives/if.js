var transition = require('../transition')

module.exports = {

    bind: function () {
        this.parent = this.el.parentNode
        this.ref = document.createComment('sd-if-' + this.key)
        this.el.sd_ref = this.ref
    },

    update: function (value) {

        var el       = this.el,
            init     = this.compiler.init

        if (!this.parent) { // the node was detached when bound
            if (!el.parentNode) {
                return
            } else {
                this.parent = el.parentNode
            }
        }

        // should always have this.parent if we reach here
        var parent = this.parent,
            ref    = this.ref

        if (!value) {
            transition(el, -1, remove, init)
        } else {
            transition(el, 1, insert, init)
        }

        function remove () {
            if (!el.parentNode) return
            // insert the reference node
            var next = el.nextSibling
            if (next) {
                parent.insertBefore(ref, next)
            } else {
                parent.appendChild(ref)
            }
            parent.removeChild(el)
        }

        function insert () {
            if (el.parentNode) return
            parent.insertBefore(el, ref)
            parent.removeChild(ref)
        }
    },

    unbind: function () {
        this.el.sd_ref = null
    }
}