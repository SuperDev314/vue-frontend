var Vue = require('../../../../src/vue')
var _ = require('../../../../src/util')
var nextTick = _.nextTick

describe('Data API', function () {

  var vm
  beforeEach(function () {
    spyOn(_, 'warn')
    vm = new Vue({
      data: {
        a: 1,
        b: {
          c: 2
        }
      },
      filters: {
        double: function (v) {
          return v * 2
        }
      }
    })
  })

  it('$get', function () {
    expect(vm.$get('a')).toBe(1)
    expect(vm.$get('b["c"]')).toBe(2)
    expect(vm.$get('a + b.c')).toBe(3)
    expect(vm.$get('c')).toBeUndefined()
    // invalid, should warn
    vm.$get('a(')
    expect(hasWarned(_, 'Invalid expression')).toBe(true)
  })

  it('$set', function () {
    vm.$set('a', 2)
    expect(vm.a).toBe(2)
    vm.$set('b["c"]', 3)
    expect(vm.b.c).toBe(3)
    // setting unexisting
    vm.$set('c.d', 2)
    expect(vm.c.d).toBe(2)
    // warn against setting unexisting
    expect(hasWarned(_, 'Consider pre-initializing')).toBe(true)
  })

  it('$set invalid', function () {
    // invalid, should throw
    if (leftHandThrows()) {
      // if creating a function with invalid left hand
      // expression throws, the exp parser will catch the
      // error and warn.
      vm.$set('c + d', 1)
      expect(hasWarned(_, 'Invalid setter function body')).toBe(true)
    } else {
      // otherwise it will throw when calling the setter.
      expect(function () {
        try {
          vm.$set('c + d', 1)
        } catch (e) {
          return true
        }
      }()).toBe(true)
    }
  })

  it('$delete', function () {
    vm._digest = jasmine.createSpy()
    vm.$delete('a')
    expect(vm.hasOwnProperty('a')).toBe(false)
    expect(vm._data.hasOwnProperty('a')).toBe(false)
    expect(vm._digest).toHaveBeenCalled()
    // reserved key should not be deleted
    vm.$delete('_data')
    expect(vm._data).toBeTruthy()
  })

  it('$watch', function (done) {
    var spy = jasmine.createSpy()
    // test immediate invoke
    var unwatch = vm.$watch('a + b.c', spy, {
      immediate: true
    })
    expect(spy).toHaveBeenCalledWith(3)
    vm.a = 2
    nextTick(function () {
      expect(spy).toHaveBeenCalledWith(4, 3)
      // unwatch
      unwatch()
      vm.a = 3
      nextTick(function () {
        expect(spy.calls.count()).toBe(2)
        done()
      })
    })
  })

  it('function $watch', function (done) {
    var spy = jasmine.createSpy()
    // test immediate invoke
    var unwatch = vm.$watch(function () {
      return this.a + this.b.c
    }, spy, { immediate: true })
    expect(spy).toHaveBeenCalledWith(3)
    vm.a = 2
    nextTick(function () {
      expect(spy).toHaveBeenCalledWith(4, 3)
      // unwatch
      unwatch()
      vm.a = 3
      nextTick(function () {
        expect(spy.calls.count()).toBe(2)
        done()
      })
    })
  })

  it('deep $watch', function (done) {
    var oldB = vm.b
    var spy = jasmine.createSpy()
    vm.$watch('b', spy, {
      deep: true
    })
    vm.b.c = 3
    nextTick(function () {
      expect(spy).toHaveBeenCalledWith(oldB, oldB)
      vm.b = { c: 4 }
      nextTick(function () {
        expect(spy).toHaveBeenCalledWith(vm.b, oldB)
        done()
      })
    })
  })

  it('$eval', function () {
    expect(vm.$eval('a')).toBe(1)
    expect(vm.$eval('b.c')).toBe(2)
    expect(vm.$eval('a + b.c | double')).toBe(6)
  })

  it('$interpolate', function () {
    expect(vm.$interpolate('abc')).toBe('abc')
    expect(vm.$interpolate('{{a}} and {{a + b.c | double}}')).toBe('1 and 6')
  })

  if (typeof console !== 'undefined') {
    it('$log', function () {
      var oldLog = console.log
      var spy = jasmine.createSpy()
      console.log = function (val) {
        expect(val.a).toBe(1)
        expect(val.b.c).toBe(2)
        spy()
      }
      vm.$log()
      expect(spy.calls.count()).toBe(1)
      console.log = function (val) {
        expect(val.c).toBe(2)
        spy()
      }
      vm.$log('b')
      expect(spy.calls.count()).toBe(2)
      console.log = oldLog
    })
  }

})

/**
 * check if creating a new Function with invalid left-hand
 * assignment would throw
 */

function leftHandThrows () {
  try {
    new Function('a + b = 1')
  } catch (e) {
    return true
  }
}
