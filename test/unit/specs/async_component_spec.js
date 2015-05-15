var Vue = require('../../../src/vue')
var _ = Vue.util

describe('Async components', function () {

  var el
  beforeEach(function () {
    el = document.createElement('div')
    document.body.appendChild(el)
    spyOn(_, 'warn')
  })

  afterEach(function () {
    document.body.removeChild(el)
  })

  describe('v-component', function () {

    it('normal', function (done) {
      var vm = new Vue({
        el: el,
        template: '<test></test>',
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'ok'
              })
              next()
            }, 0)
          }
        }
      })
      function next () {
        expect(el.textContent).toBe('ok')
        done()
      }
    })

    it('dynamic', function (done) {
      var vm = new Vue({
        el: el,
        template: '<component type="{{view}}"></component>',
        data: {
          view: 'a'
        },
        components: {
          a: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'A'
              })
              step1()
            }, 0)
          },
          b: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'B'
              })
              step2()
            }, 0)
          }
        }
      })
      var aCalled = false
      function step1 () {
        // ensure A is resolved only once
        expect(aCalled).toBe(false)
        aCalled = true
        expect(el.textContent).toBe('A')
        vm.view = 'b'
      }
      function step2 () {
        expect(el.textContent).toBe('B')
        vm.view = 'a'
        _.nextTick(function () {
          expect(el.textContent).toBe('A')
          done()
        })
      }
    })

    it('invalidate pending on dynamic switch', function (done) {
      var vm = new Vue({
        el: el,
        template: '<component type="{{view}}"></component>',
        data: {
          view: 'a'
        },
        components: {
          a: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'A'
              })
              step1()
            }, 100)
          },
          b: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'B'
              })
              step2()
            }, 200)
          }
        }
      })
      expect(el.textContent).toBe('')
      vm.view = 'b'
      function step1 () {
        // called after A resolves, but A should have been
        // invalidated so not cotrId should be set
        expect(vm._directives[0].ctorId).toBe(null)
      }
      function step2 () {
        // B should resolve successfully
        expect(el.textContent).toBe('B')
        done()
      }
    })

    it('invalidate pending on teardown', function (done) {
      var vm = new Vue({
        el: el,
        template: '<test></test>',
        data: {
          view: 'a'
        },
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: 'A'
              })
              next()
            }, 100)
          }
        }
      })
      expect(el.textContent).toBe('')
      // cache directive isntance before destroy
      var dir = vm._directives[0]
      vm.$destroy()
      function next () {
        // called after A resolves, but A should have been
        // invalidated so not cotrId should be set
        expect(dir.ctorId).toBe(null)
        done()
      }
    })

    it('avoid duplicate requests', function (done) {
      var factoryCallCount = 0
      var instanceCount = 0
      var vm = new Vue({
        el: el,
        template:
          '<test></test>' +
          '<test></test>',
        components: {
          test: factory
        }
      })
      function factory (resolve) {
        factoryCallCount++
        setTimeout(function () {
          resolve({
            template: 'A',
            created: function () {
              instanceCount++
            }
          })
          next()
        }, 0)
      }
      function next () {
        expect(factoryCallCount).toBe(1)
        expect(el.textContent).toBe('AA')
        expect(instanceCount).toBe(2)
        done()
      }
    })
  })

  describe('v-repeat', function () {
    // - normal
    // - invalidate on teardown
    // - warn for dynamic

    it('normal', function (done) {
      var vm = new Vue({
        el: el,
        template: '<test v-repeat="list"></test>',
        data: {
          list: [1, 2, 3]
        },
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: '{{$value}}'
              })
              next()
            }, 0)
          }
        }
      })
      function next () {
        expect(el.textContent).toBe('123')
        done()
      }
    })

    it('only resolve once', function (done) {
      var vm = new Vue({
        el: el,
        template: '<test v-repeat="list"></test>',
        data: {
          list: [1, 2, 3]
        },
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: '{{$value}}'
              })
              next()
            }, 100)
          }
        }
      })
      // hijack realUpdate - this should only be called once
      // spyOn doesn't work here
      var update = vm._directives[0].realUpdate
      var callCount = 0
      vm._directives[0].realUpdate = function () {
        callCount++
        update.apply(this, arguments)
      }
      vm.list = [2, 3, 4]
      function next () {
        expect(el.textContent).toBe('234')
        expect(callCount).toBe(1)
        done()
      }
    })

    it('invalidate on teardown', function (done) {
      var vm = new Vue({
        el: el,
        template: '<test v-repeat="list"></test>',
        data: {
          list: [1, 2, 3]
        },
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: '{{$value}}'
              })
              next()
            }, 0)
          }
        }
      })
      var dir = vm._directives[0]
      vm.$destroy()
      function next () {
        expect(el.textContent).toBe('')
        expect(dir.Ctor).toBe(null)
        done()
      }
    })

    it('warn when used with dynamic v-repeat', function () {
      var vm = new Vue({
        el: el,
        template: '<component v-repeat="list" type="{{c}}"></component>',
        data: {
          list: [1, 2, 3],
          c: 'test'
        },
        components: {
          test: function (resolve) {
            setTimeout(function () {
              resolve({
                template: '{{$value}}'
              })
            }, 0)
          }
        }
      })
      expect(hasWarned(_, 'Async resolution is not supported')).toBe(true)
    })
  })

})