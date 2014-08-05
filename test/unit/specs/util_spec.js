var _ = require('../../../src/util')
var config = require('../../../src/config')
config.silent = true

describe('Util', function () {

  describe('Language Enhancement', function () {

    it('bind', function () {
      var original = function (a) {
        return this.a + a
      }
      var ctx = { a: 'ctx a ' }
      var bound = _.bind(original, ctx)
      var res = bound('arg a')
      expect(res).toBe('ctx a arg a')
    })
    
    it('toArray', function () {
      // should make a copy of original array
      var arr = [1,2,3]
      var res = _.toArray(arr)
      expect(Array.isArray(res)).toBe(true)
      expect(res.toString()).toEqual('1,2,3')
      expect(res).not.toBe(arr)

      // should work on arguments
      ;(function () {
        var res = _.toArray(arguments)
        expect(Array.isArray(res)).toBe(true)
        expect(res.toString()).toEqual('1,2,3')
      })(1,2,3)
    })

    it('extend', function () {
      var from = {a:1,b:2}
      var to = {}
      _.extend(to, from)
      expect(to.a).toBe(from.a)
      expect(to.b).toBe(from.b)
    })

    it('deepMixin', function () {
      var from = Object.create({c:123})
      var to = {}
      Object.defineProperty(from, 'a', {
        enumerable: false,
        configurable: true,
        get: function () {
          return 'AAA'
        }
      })
      Object.defineProperty(from, 'b', {
        enumerable: true,
        configurable: false,
        value: 'BBB'
      })
      _.deepMixin(to, from)
      var descA = Object.getOwnPropertyDescriptor(to, 'a')
      var descB = Object.getOwnPropertyDescriptor(to, 'b')

      expect(descA.enumerable).toBe(false)
      expect(descA.configurable).toBe(true)
      expect(to.a).toBe('AAA')

      expect(descB.enumerable).toBe(true)
      expect(descB.configurable).toBe(false)
      expect(to.b).toBe('BBB')

      expect(to.c).toBeUndefined()
    })

    it('proxy', function () {
      var to = { test2: 'to' }
      var from = { test2: 'from' }
      var val = '123'
      Object.defineProperty(from, 'test', {
        get: function () {
          return val
        },
        set: function (v) {
          val = v
        }
      })
      _.proxy(to, from, 'test')
      expect(to.test).toBe(val)
      to.test = '234'
      expect(val).toBe('234')
      expect(to.test).toBe(val)
      // should not overwrite existing property
      _.proxy(to, from, 'test2')
      expect(to.test2).toBe('to')

    })

    it('isObject', function () {
      expect(_.isObject({})).toBe(true)
      expect(_.isObject([])).toBe(false)
      expect(_.isObject(null)).toBe(false)
      if (_.inBrowser) {
        expect(_.isObject(window)).toBe(false)
      }
    })

    it('isArray', function () {
      expect(_.isArray([])).toBe(true)
      expect(_.isArray({})).toBe(false)
      expect(_.isArray(arguments)).toBe(false)
    })

    it('define', function () {
      var obj = {}
      _.define(obj, 'test', 123)
      expect(obj.test).toBe(123)
      var desc = Object.getOwnPropertyDescriptor(obj, 'test')
      expect(desc.enumerable).toBe(false)

      _.define(obj, 'test2', 123, true)
      expect(obj.test2).toBe(123)
      var desc = Object.getOwnPropertyDescriptor(obj, 'test2')
      expect(desc.enumerable).toBe(true)
    })

    it('augment', function () {
      if ('__proto__' in {}) {
        var target = {}
        var proto = {}
        _.augment(target, proto)
        expect(target.__proto__).toBe(proto)
      } else {
        expect(_.augment).toBe(_.deepMixin)
      }
    })

  })

  if (_.inBrowser) {

    describe('DOM', function () {

      var parent, child, target

      function div () {
        return document.createElement('div')
      }

      beforeEach(function () {
        parent = div()
        child = div()
        target = div()
        parent.appendChild(child) 
      })
      
      it('before', function () {
        _.before(target, child)
        expect(target.parentNode).toBe(parent)
        expect(target.nextSibling).toBe(child)
      })

      it('after', function () {
        _.after(target, child)
        expect(target.parentNode).toBe(parent)
        expect(child.nextSibling).toBe(target)
      })

      it('after with sibling', function () {
        var sibling = div()
        parent.appendChild(sibling)
        _.after(target, child)
        expect(target.parentNode).toBe(parent)
        expect(child.nextSibling).toBe(target)
      })

      it('remove', function () {
        _.remove(child)
        expect(child.parentNode).toBeNull()
        expect(parent.childNodes.length).toBe(0)
      })

      it('prepend', function () {
        _.prepend(target, parent)
        expect(target.parentNode).toBe(parent)
        expect(parent.firstChild).toBe(target)
      })

      it('prepend to empty node', function () {
        parent.removeChild(child)
        _.prepend(target, parent)
        expect(target.parentNode).toBe(parent)
        expect(parent.firstChild).toBe(target)
      })

      it('copyAttributes', function () {
        parent.setAttribute('test1', 1)
        parent.setAttribute('test2', 2)
        _.copyAttributes(parent, target)
        expect(target.attributes.length).toBe(2)
        expect(target.getAttribute('test1')).toBe('1')
        expect(target.getAttribute('test2')).toBe('2')
      })
    })
  }

  if (typeof console !== undefined) {

    describe('Debug', function () {

      beforeEach(function () {
        spyOn(console, 'log')
        spyOn(console, 'warn')
        if (console.trace) {
          spyOn(console, 'trace')
        }
      })
      
      it('log when debug is true', function () {
        config.debug = true
        _.log('hello', 'world')
        expect(console.log).toHaveBeenCalledWith('hello', 'world')
      })

      it('not log when debug is false', function () {
        config.debug = false
        _.log('bye', 'world')
        expect(console.log.callCount).toBe(0)
      })

      it('warn when silent is false', function () {
        config.silent = false
        _.warn('oops', 'ops')
        expect(console.warn).toHaveBeenCalledWith('oops', 'ops')
      })

      it('not warn when silent is ture', function () {
        config.silent = true
        _.warn('oops', 'ops')
        expect(console.warn.callCount).toBe(0)
      })

      if (console.trace) {
        it('trace when not silent and debugging', function () {
          config.debug = true
          config.silent = false
          _.warn('haha')
          expect(console.trace).toHaveBeenCalled()
          config.debug = false
          config.silent = true
        })
      }
    })
  }

  describe('Option merging', function () {

    var merge = _.mergeOptions
    
    it('default strat', function () {
      // child undefined
      var res = merge({replace:true}, {}).replace
      expect(res).toBe(true)
      // child overwrite
      var res = merge({replace:true}, {replace:false}).replace
      expect(res).toBe(false)
    })

    it('hooks & paramAttributes', function () {
      var fn1 = function () {}
      var fn2 = function () {}
      var res
      // parent undefined
      res = merge({}, {created: fn1}).created
      expect(Array.isArray(res)).toBe(true)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(fn1)
      // child undefined
      res = merge({created: [fn1]}, {}).created
      expect(Array.isArray(res)).toBe(true)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(fn1)
      // both defined
      res = merge({created: [fn1]}, {created: fn2}).created
      expect(Array.isArray(res)).toBe(true)
      expect(res.length).toBe(2)
      expect(res[0]).toBe(fn1)
      expect(res[1]).toBe(fn2)
    })

    it('events', function () {

      var fn1 = function () {}
      var fn2 = function () {}
      var fn3 = function () {}
      var parent = {
        events: {
          'fn1': [fn1, fn2],
          'fn2': [fn2]
        }
      }
      var child = {
        events: {
          'fn1': fn3,
          'fn3': fn3
        }
      }
      var res = merge(parent, child).events
      assertRes(res.fn1, [fn1, fn2, fn3])
      assertRes(res.fn2, [fn2])
      assertRes(res.fn3, [fn3])
      
      function assertRes (res, expected) {
        expect(Array.isArray(res)).toBe(true)
        expect(res.length).toBe(expected.length)
        var i = expected.length
        while (i--) {
          expect(res[i]).toBe(expected[i])
        }
      }

    })

    it('normal object hashes', function () {
      var fn1 = function () {}
      var fn2 = function () {}
      var res
      // parent undefined
      res = merge({}, {methods: {test: fn1}}).methods
      expect(res.test).toBe(fn1)
      // child undefined
      res = merge({methods: {test: fn1}}, {}).methods
      expect(res.test).toBe(fn1)
      // both defined
      var parent = {methods: {test: fn1}}
      res = merge(parent, {methods: {test2: fn2}}).methods
      expect(res.test).toBe(fn1)
      expect(res.test2).toBe(fn2)
    })

    it('assets', function () {
      var asset1 = {}
      var asset2 = {}
      var asset3 = {}
      // mock vm
      var vm = {
        $parent: {
          $options: {
            directives: {
              c: asset3
            }
          }
        }
      }
      var res = merge(
        { directives: { a: asset1 }},
        { directives: { b: asset2 }},
        vm
      ).directives
      expect(res.a).toBe(asset1)
      expect(res.b).toBe(asset2)
      expect(res.c).toBe(asset3)
      // test prototypal inheritance
      var asset4 = vm.$parent.$options.directives.d = {}
      expect(res.d).toBe(asset4)
    })

    it('ignore el, data & parent when inheriting', function () {
      var res = merge({}, {el:1, data:2, parent:3})
      expect(res.el).toBeUndefined()
      expect(res.data).toBeUndefined()
      expect(res.parent).toBeUndefined()

      res = merge({}, {el:1, data:2, parent:3}, {})
      expect(res.el).toBe(1)
      expect(res.data).toBe(2)
      expect(res.parent).toBe(3)
    })

  })

})