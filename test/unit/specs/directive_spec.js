var Vue = require('../../../src/vue')
var Directive = require('../../../src/directive')
var nextTick = Vue.nextTick

describe('Directive', function () {

  var el = {} // simply a mock to be able to run in Node
  var vm, def

  beforeEach(function () {
    def = {
      bind: jasmine.createSpy('bind'),
      update: jasmine.createSpy('update'),
      unbind: jasmine.createSpy('unbind')
    }
    vm = new Vue({
      data: {
        a: 1,
        b: { c: { d: 2 }}
      },
      filters: {
        test: function (v) {
          return v * 2
        }
      },
      directives: {
        test: def
      }
    })
  })

  it('normal', function (done) {
    var d = new Directive('test', el, vm, {
      expression: 'a',
      arg: 'someArg',
      filters: [{name: 'test'}]
    }, def)
    d._bind()
    // properties
    expect(d.el).toBe(el)
    expect(d.name).toBe('test')
    expect(d.vm).toBe(vm)
    expect(d.arg).toBe('someArg')
    expect(d.expression).toBe('a')
    // init calls
    expect(def.bind).toHaveBeenCalled()
    expect(def.update).toHaveBeenCalledWith(2)
    expect(d._bound).toBe(true)
    // update
    vm.a = 2
    nextTick(function () {
      expect(def.update).toHaveBeenCalledWith(4, 2)
      // teardown
      d._teardown()
      expect(def.unbind).toHaveBeenCalled()
      expect(d._bound).toBe(false)
      expect(d._watcher).toBe(null)
      done()
    })
  })

  it('static literal', function () {
    def.isLiteral = true
    var d = new Directive('test', el, vm, {
      expression: 'a'
    }, def)
    d._bind()
    expect(d._watcher).toBeUndefined()
    expect(d.expression).toBe('a')
    expect(d.bind).toHaveBeenCalled()
    expect(d.update).not.toHaveBeenCalled()
  })

  it('static literal (new syntax)', function () {
    var d = new Directive('test', el, vm, {
      expression: 'a'
    }, def, null, null, null, null, true)
    d._bind()
    expect(d._watcher).toBeUndefined()
    expect(d.expression).toBe('a')
    expect(d.bind).toHaveBeenCalled()
    expect(d.update).toHaveBeenCalledWith('a')
  })

  it('static literal, interpolate with no update', function () {
    def.isLiteral = true
    delete def.update
    var d = new Directive('test', el, vm, {
      expression: '{{a}}'
    }, def)
    d._bind()
    expect(d._watcher).toBeUndefined()
    expect(d.expression).toBe(1)
    expect(d.bind).toHaveBeenCalled()
  })

  it('dynamic literal', function (done) {
    vm.a = '' // #468 dynamic literals with falsy initial
              // should still create the watcher.
    def.isLiteral = true
    var d = new Directive('test', el, vm, {
      expression: '{{a}}'
    }, def)
    d._bind()
    expect(d._watcher).toBeDefined()
    expect(d.expression).toBe('')
    expect(def.bind).toHaveBeenCalled()
    expect(def.update).toHaveBeenCalledWith('')
    vm.a = 'aa'
    nextTick(function () {
      expect(def.update).toHaveBeenCalledWith('aa', '')
      done()
    })
  })

  it('inline statement', function () {
    def.acceptStatement = true
    var spy = jasmine.createSpy()
    vm.$options.filters.test = function (fn) {
      spy()
      return function () {
        // call it twice
        fn()
        fn()
      }
    }
    var d = new Directive('test', el, vm, {
      expression: 'a++',
      filters: [{name: 'test'}]
    }, def)
    d._bind()
    expect(d._watcher).toBeUndefined()
    expect(d.bind).toHaveBeenCalled()
    var wrappedFn = d.update.calls.argsFor(0)[0]
    expect(typeof wrappedFn).toBe('function')
    // test invoke the wrapped fn
    wrappedFn()
    expect(vm.a).toBe(3)
  })

  it('two-way', function (done) {
    def.twoWay = true
    vm.$options.filters.test = {
      write: function (v) {
        return v * 3
      }
    }
    var d = new Directive('test', el, vm, {
      expression: 'a',
      filters: [{name: 'test'}]
    }, def)
    d._bind()
    d.set(2)
    expect(vm.a).toBe(6)
    nextTick(function () {
      // should have no update calls
      expect(def.update.calls.count()).toBe(1)
      done()
    })
  })

  it('deep', function (done) {
    def.deep = true
    var d = new Directive('test', el, vm, {
      expression: 'b'
    }, def)
    d._bind()
    vm.b.c.d = 3
    nextTick(function () {
      expect(def.update.calls.count()).toBe(2)
      done()
    })
  })

  it('function def', function () {
    var d = new Directive('test', el, vm, {
      expression: 'a'
    }, def.update)
    d._bind()
    expect(d.update).toBe(def.update)
    expect(def.update).toHaveBeenCalled()
  })
})
