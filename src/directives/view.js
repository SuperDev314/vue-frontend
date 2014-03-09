module.exports = {

    bind: function () {

        // track position in DOM with a ref node
        var el       = this.raw = this.el,
            parent   = el.parentNode,
            ref      = this.ref = document.createComment('v-view')
        parent.insertBefore(ref, el)
        parent.removeChild(el)

        // cache original content
        /* jshint boss: true */
        var node,
            frag = this.inner = document.createDocumentFragment()
        while (node = el.firstChild) {
            frag.appendChild(node)
        }

    },

    update: function(value) {

        if (this.childVM) {
            this.childVM.$destroy()
        }

        var Ctor  = this.compiler.getOption('components', value)
        if (!Ctor) return

        var inner = this.inner.cloneNode(true)

        this.childVM = new Ctor({
            el: this.raw.cloneNode(true),
            parent: this.vm,
            created: function () {
                this.$compiler.rawContent = inner
            }
        })

        this.el = this.childVM.$el
        if (this.compiler.init) {
            this.ref.parentNode.insertBefore(this.el, this.ref)
        } else {
            this.childVM.$before(this.ref)
        }

    },

    unbind: function() {
        if (this.childVM) {
            this.childVM.$destroy()
        }
    }

}