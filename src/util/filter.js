var _ = require('./debug')

/**
 * Resolve read & write filters for a vm instance. The
 * filters descriptor Array comes from the directive parser.
 *
 * This is extracted into its own utility so it can
 * be used in multiple scenarios.
 *
 * @param {Vue} vm
 * @param {Array<Object>} filters
 * @param {Watcher} [target]
 * @return {Object}
 */

exports.resolveFilters = function (vm, filters, target) {
  if (!filters) {
    return
  }
  var res = target || {}
  var registry = vm.$options.filters
  filters.forEach(function (f) {
    var def = registry[f.name]
    var args = f.args
    var reader, writer
    if (!def) {
      _.warn('Failed to resolve filter: ' + f.name)
    } else if (typeof def === 'function') {
      reader = def
    } else {
      reader = def.read
      writer = def.write
    }
    if (reader) {
      if (!res.read) {
        res.read = []
      }
      res.read.push(function (value) {
        return args
          ? reader.apply(vm, [value].concat(args))
          : reader.call(vm, value)
      })
    }
    // only watchers needs write filters
    if (target && writer) {
      if (!res.write) {
        res.write = []
      }
      res.write.push(function (value) {
        return args
          ? writer.apply(vm, [value, res.value].concat(args))
          : writer.call(vm, value, res.value)
      })
    }
  })
  return res
}

/**
 * Apply filters to a value
 *
 * @param {*} value
 * @param {Array} filters
 * @param {Vue} vm
 * @return {*}
 */

exports.applyFilters = function (value, filters, vm) {
  if (!filters) {
    return value
  }
  for (var i = 0, l = filters.length; i < l; i++) {
    value = filters[i].call(vm, value)
  }
  return value
}