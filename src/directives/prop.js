var Watcher = require('../watcher')

module.exports = {

  bind: function () {

    var child = this.vm
    var parent = child.$parent
    // passed in from compiler directly
    var prop = this._descriptor
    var childKey = prop.path
    var parentKey = prop.parentPath

    // simple lock to avoid circular updates.
    // without this it would stabilize too, but this makes
    // sure it doesn't cause other watchers to re-evaluate.
    var locked = false

    if (!prop.oneWayUp) {
      this.parentWatcher = new Watcher(
        parent,
        parentKey,
        function (val) {
          if (!locked) {
            locked = true
            // all props have been initialized already
            child[childKey] = val
            locked = false
          }
        },
        { sync: true }
      )
      
      // set the child initial value first, before setting
      // up the child watcher to avoid triggering it
      // immediately.
      child.$set(childKey, this.parentWatcher.value)
    }

    // only setup two-way binding if this is not a one-way
    // binding.
    if (!prop.oneWayDown) {
      this.childWatcher = new Watcher(
        child,
        childKey,
        function (val) {
          if (!locked) {
            locked = true
            parent.$set(parentKey, val)
            locked = false
          }
        },
        { sync: true }
      )

      // set initial value for one-way up binding
      if (prop.oneWayUp) {
        parent.$set(parentKey, this.childWatcher.value)
      }
    }
  },

  unbind: function () {
    if (this.parentWatcher) {
      this.parentWatcher.teardown()
    }
    if (this.childWatcher) {
      this.childWatcher.teardown()
    }
  }
}
