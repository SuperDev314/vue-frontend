var nextTick = require('../utils').nextTick

module.exports = {

    bind: function () {
        if (this.el.vue_vm) {
            this.subVM = this.el.vue_vm
            var compiler = this.subVM.$compiler
            if (!compiler.bindings[this.arg]) {
                compiler.createBinding(this.arg)
            }
        } else if (this.isEmpty) {
            this.build()
        }
    },

    update: function (value, init) {
        var vm = this.subVM,
            key = this.arg || '$data'
        if (!vm) {
            this.build(value)
        } else if (!this.lock && vm[key] !== value) {
            vm[key] = value
        }
        if (init) {
            // watch after first set
            this.watch()
            // The v-with directive can have multiple expressions,
            // and we want to make sure when the ready hook is called
            // on the subVM, all these clauses have been properly set up.
            // So this is a hack that sniffs whether we have reached
            // the last expression. We hold off the subVM's ready hook
            // until we are actually ready.
            if (this.last) {
                this.subVM.$compiler.execHook('ready')
            }
        }
    },

    build: function (value) {
        var data = value
        if (this.arg) {
            data = {}
            data[this.arg] = value
        }
        var Ctor = this.compiler.resolveComponent(this.el, data)
        this.subVM = new Ctor({
            el     : this.el,
            data   : data,
            parent : this.vm,
            compilerOptions: {
                // it is important to delay the ready hook
                // so that when it's called, all `v-with` wathcers
                // would have been set up.
                delayReady: !this.last
            }
        })
    },

    /**
     *  For inhertied keys, need to watch
     *  and sync back to the parent
     */
    watch: function () {
        if (!this.arg) return
        var self    = this,
            key     = self.key,
            ownerVM = self.binding.compiler.vm
        this.subVM.$compiler.observer.on('change:' + this.arg, function (val) {
            if (!self.lock) {
                self.lock = true
                nextTick(function () {
                    self.lock = false
                })
            }
            ownerVM.$set(key, val)
        })
    },

    unbind: function () {
        // all watchers are turned off during destroy
        // so no need to worry about it
        this.subVM.$destroy()
    }

}