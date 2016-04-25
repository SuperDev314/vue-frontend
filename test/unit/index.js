import Vue from 'vue'

Vue.config.preserveWhitespace = false

if (typeof console === 'undefined') {
  window.console = {
    error: function () {}
  }
}

function hasWarned (msg) {
  var count = console.error.calls.count()
  var args
  while (count--) {
    args = console.error.calls.argsFor(count)
    if (args.some(containsMsg)) {
      return true
    }
  }

  function containsMsg (arg) {
    if (arg instanceof Error) throw arg
    return typeof arg === 'string' && arg.indexOf(msg) > -1
  }
}

// define custom matcher for warnings
beforeEach(function () {
  spyOn(console, 'error')
  jasmine.addMatchers({
    toHaveBeenWarned: function () {
      return {
        compare: function (msg) {
          var warned = Array.isArray(msg)
            ? msg.some(hasWarned)
            : hasWarned(msg)
          return {
            pass: warned,
            message: warned
              ? 'Expected message "' + msg + '" not to have been warned'
              : 'Expected message "' + msg + '" to have been warned'
          }
        }
      }
    }
  })
})

// require all test files
var testsContext = require.context('./', true, /\.spec$/)
testsContext.keys().forEach(testsContext)
