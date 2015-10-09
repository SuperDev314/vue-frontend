var Vue = require('../../../../src/vue')
var _ = require('../../../../src/util')
var transition = require('../../../../src/transition')
var Transition = require('../../../../src/transition/transition')

if (_.inBrowser && !_.isIE9) {
  describe('Transition', function () {

    // insert a test css
    function insertCSS (text) {
      var cssEl = document.createElement('style')
      cssEl.textContent = text
      document.head.appendChild(cssEl)
    }

    var duration = '50ms'
    insertCSS(
      '.test {\
        transition: opacity ' + duration + ' ease;\
        -webkit-transition: opacity ' + duration + ' ease;}'
    )
    insertCSS('.test-enter, .test-leave { opacity: 0; }')
    insertCSS(
      '.test-anim-enter {\
        animation: test-enter ' + duration + ';\
        -webkit-animation: test-enter ' + duration + ';}\
      .test-anim-leave {\
        animation: test-leave ' + duration + ';\
        -webkit-animation: test-leave ' + duration + ';}\
      @keyframes test-enter {\
        from { opacity: 0 }\
        to { opacity: 1 }}\
      @-webkit-keyframes test-enter {\
        from { opacity: 0 }\
        to { opacity: 1 }}\
      @keyframes test-leave {\
        from { opacity: 1 }\
        to { opacity: 0 }}\
      @-webkit-keyframes test-leave {\
        from { opacity: 1 }\
        to { opacity: 0 }}'
    )

    describe('Wrapper methods', function () {

      var spy, el, target, parent, vm
      beforeEach(function () {
        el = document.createElement('div')
        target = document.createElement('div')
        parent = document.createElement('div')
        parent.appendChild(target)
        spy = jasmine.createSpy('transition skip')
        vm = new Vue()
        spyOn(transition, 'apply')
      })

      it('append', function () {
        transition.append(el, parent, vm, spy)
        expect(parent.lastChild).toBe(el)
        expect(spy).toHaveBeenCalled()
      })

      it('before', function () {
        transition.before(el, target, vm, spy)
        expect(parent.firstChild).toBe(el)
        expect(el.nextSibling).toBe(target)
        expect(spy).toHaveBeenCalled()
      })

      it('remove', function () {
        transition.remove(target, vm, spy)
        expect(parent.childNodes.length).toBe(0)
        expect(spy).toHaveBeenCalled()
      })

      it('removeThenAppend', function () {
        transition.removeThenAppend(target, el, vm, spy)
        expect(parent.childNodes.length).toBe(0)
        expect(el.firstChild).toBe(target)
        expect(spy).toHaveBeenCalled()
      })

    })

    describe('Skipping', function () {

      var el, vm, op, cb
      beforeEach(function () {
        el = document.createElement('div')
        el.textContent = 'hello'
        op = jasmine.createSpy('transition skip op')
        cb = jasmine.createSpy('transition skip cb')
        vm = new Vue()
      })

      it('skip el with no transition data', function () {
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip vm still being compiled', function () {
        el.__v_trans = new Transition(el, 'test', null, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip vm with parent still being compiled', function () {
        el.__v_trans = new Transition(el, 'test', null, vm)
        var child = new Vue({
          el: el,
          parent: vm
        })
        expect(child._isCompiled).toBe(true)
        transition.apply(el, 1, op, child, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip when css transition is not supported', function () {
        var e = _.transitionEndEvent
        _.transitionEndEvent = null
        el.__v_trans = new Transition(el, 'test', null, vm)
        vm.$mount(el)
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
        _.transitionEndEvent = e
      })

    })

    describe('CSS transitions', function () {

      var vm, el, op, cb, hooks
      beforeEach(function (done) {
        el = document.createElement('div')
        el.textContent = 'hello'
        vm = new Vue({ el: el })
        op = jasmine.createSpy('css op')
        cb = jasmine.createSpy('css cb')
        document.body.appendChild(el)
        hooks = {
          beforeEnter: jasmine.createSpy('beforeEnter'),
          enter: jasmine.createSpy('enter'),
          afterEnter: jasmine.createSpy('afterEnter'),
          beforeLeave: jasmine.createSpy('beforeLeave'),
          leave: jasmine.createSpy('leave'),
          afterLeave: jasmine.createSpy('afterLeave')
        }
        // !IMPORTANT!
        // this ensures we force a layout for every test.
        _.nextTick(done)
      })

      afterEach(function () {
        document.body.removeChild(el)
      })

      it('skip on 0s duration (execute right at next frame)', function (done) {
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        el.style.transition =
        el.style.WebkitTransition = 'opacity 0s ease'
        transition.apply(el, 1, op, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(hooks.enter).toHaveBeenCalled()
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          expect(hooks.afterEnter).toHaveBeenCalled()
          expect(el.classList.contains('test-enter')).toBe(false)
          transition.apply(el, -1, op, vm, cb)
          expect(hooks.beforeLeave).toHaveBeenCalled()
          expect(hooks.leave).toHaveBeenCalled()
          _.nextTick(function () {
            expect(op.calls.count()).toBe(2)
            expect(cb.calls.count()).toBe(2)
            expect(hooks.afterLeave).toHaveBeenCalled()
            expect(el.classList.contains('test-leave')).toBe(false)
            done()
          })
        })
      })

      it('skip when no transition available', function (done) {
        el.__v_trans = new Transition(el, 'test-no-trans', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(hooks.enter).toHaveBeenCalled()
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          expect(hooks.afterEnter).toHaveBeenCalled()
          expect(el.classList.contains('test-no-trans-enter')).toBe(false)
          // wait until transition.justEntered flag is off
          setTimeout(function () {
            transition.apply(el, -1, op, vm, cb)
            expect(hooks.beforeLeave).toHaveBeenCalled()
            expect(hooks.leave).toHaveBeenCalled()
            _.nextTick(function () {
              expect(op.calls.count()).toBe(2)
              expect(cb.calls.count()).toBe(2)
              expect(hooks.afterLeave).toHaveBeenCalled()
              expect(el.classList.contains('test-no-trans-leave')).toBe(false)
              done()
            })
          }, 17)
        })
      })

      it('transition enter', function (done) {
        document.body.removeChild(el)
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        // inline style
        el.style.transition =
        el.style.WebkitTransition = 'opacity ' + duration + ' ease'
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(hooks.enter).toHaveBeenCalled()
        expect(op).toHaveBeenCalled()
        expect(cb).not.toHaveBeenCalled()
        _.nextTick(function () {
          expect(el.classList.contains('test-enter')).toBe(false)
          expect(hooks.afterEnter).not.toHaveBeenCalled()
          _.on(el, _.transitionEndEvent, function () {
            expect(cb).toHaveBeenCalled()
            expect(hooks.afterEnter).toHaveBeenCalled()
            done()
          })
        })
      })

      it('transition leave', function (done) {
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        // cascaded class style
        el.classList.add('test')
        // force a layout here so the transition can be triggered
        var f = el.offsetHeight
        transition.apply(el, -1, op, vm, cb)
        expect(hooks.beforeLeave).toHaveBeenCalled()
        expect(hooks.leave).toHaveBeenCalled()
        _.nextTick(function () {
          expect(op).not.toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(hooks.afterLeave).not.toHaveBeenCalled()
          expect(el.classList.contains('test-leave')).toBe(true)
          _.on(el, _.transitionEndEvent, function () {
            expect(op).toHaveBeenCalled()
            expect(cb).toHaveBeenCalled()
            expect(el.classList.contains('test-leave')).toBe(false)
            expect(hooks.afterLeave).toHaveBeenCalled()
            done()
          })
        })
        return f
      })

      it('animation enter', function (done) {
        document.body.removeChild(el)
        el.__v_trans = new Transition(el, 'test-anim', hooks, vm)
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(hooks.enter).toHaveBeenCalled()
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-anim-enter')).toBe(true)
          expect(hooks.afterEnter).not.toHaveBeenCalled()
          _.on(el, _.animationEndEvent, function () {
            expect(el.classList.contains('test-anim-enter')).toBe(false)
            expect(cb).toHaveBeenCalled()
            expect(hooks.afterEnter).toHaveBeenCalled()
            done()
          })
        })
      })

      it('animation leave', function (done) {
        el.__v_trans = new Transition(el, 'test-anim', hooks, vm)
        transition.apply(el, -1, op, vm, cb)
        expect(hooks.beforeLeave).toHaveBeenCalled()
        expect(hooks.leave).toHaveBeenCalled()
        _.nextTick(function () {
          expect(op).not.toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-anim-leave')).toBe(true)
          expect(hooks.afterLeave).not.toHaveBeenCalled()
          _.on(el, _.animationEndEvent, function () {
            expect(op).toHaveBeenCalled()
            expect(cb).toHaveBeenCalled()
            expect(el.classList.contains('test-anim-leave')).toBe(false)
            expect(hooks.afterLeave).toHaveBeenCalled()
            done()
          })
        })
      })

      it('css + js hook with callback', function (done) {
        document.body.removeChild(el)
        el.classList.add('test')

        // enter hook that expects a second argument
        // indicates the user wants to control when the
        // transition ends.
        var enterCalled = false
        hooks.enter = function (el, enterDone) {
          enterCalled = true
          setTimeout(function () {
            enterDone()
            testDone()
          }, 100)
        }

        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(op).toHaveBeenCalled()
        expect(cb).not.toHaveBeenCalled()
        expect(enterCalled).toBe(true)
        _.nextTick(function () {
          expect(el.classList.contains('test-enter')).toBe(false)
          expect(hooks.afterEnter).not.toHaveBeenCalled()
          _.on(el, _.transitionEndEvent, function () {
            // should wait until js callback is called!
            expect(cb).not.toHaveBeenCalled()
            expect(hooks.afterEnter).not.toHaveBeenCalled()
          })
        })

        // this is called by the enter hook
        function testDone () {
          expect(cb).toHaveBeenCalled()
          expect(hooks.afterEnter).toHaveBeenCalled()
          done()
        }
      })

      it('css + js hook with callback before transitionend', function (done) {
        document.body.removeChild(el)
        el.classList.add('test')

        // enter hook that expects a second argument
        // indicates the user wants to control when the
        // transition ends.
        var enterCalled = false
        hooks.enter = function (el, enterDone) {
          enterCalled = true
          setTimeout(function () {
            enterDone()
            testDone()
          }, 20)
        }

        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        expect(hooks.beforeEnter).toHaveBeenCalled()
        expect(op).toHaveBeenCalled()
        expect(cb).not.toHaveBeenCalled()
        expect(enterCalled).toBe(true)
        _.nextTick(function () {
          expect(el.classList.contains('test-enter')).toBe(false)
          expect(hooks.afterEnter).not.toHaveBeenCalled()
          _.on(el, _.transitionEndEvent, function () {
            // callback should have been called, but only once, by the js callback
            expect(cb).toHaveBeenCalled()
            expect(cb.calls.count()).toBe(1)
            expect(hooks.afterEnter).toHaveBeenCalled()
            done()
          })
        })

        // this is called by the enter hook
        function testDone () {
          expect(cb).toHaveBeenCalled()
          expect(hooks.afterEnter).toHaveBeenCalled()
        }
      })

      it('clean up unfinished css callback', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        el.classList.add('test')
        transition.apply(el, -1, function () {
          document.body.removeChild(el)
        }, vm, cb)
        // cancel early
        _.nextTick(function () {
          expect(el.__v_trans.pendingCssCb).toBeTruthy()
          expect(el.classList.contains('test-leave')).toBe(true)
          transition.apply(el, 1, function () {
            document.body.appendChild(el)
          }, vm)
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-leave')).toBe(false)
          expect(el.__v_trans.pendingCssCb).toBeNull()
          // IMPORTANT
          // Let the queue flush finish before enter the next
          // test. Don't remove the nextTick.
          _.nextTick(done)
        })
      })

      it('cache transition sniff results', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        el.classList.add('test')
        transition.apply(el, 1, op, vm)
        _.nextTick(function () {
          expect(el.__v_trans.typeCache['test-enter']).not.toBeUndefined()
          // for some reason window.getComputedStyle cannot be spied on in
          // phantomjs after the refactor...
          var calls = 0
          Object.defineProperty(el.__v_trans.typeCache, 'test-enter', {
            get: function () {
              calls++
              return 1
            }
          })
          transition.apply(el, 1, op, vm)
          _.nextTick(function () {
            expect(calls).toBe(1)
            done()
          })
        })
      })

    })

    describe('JavaScript only transitions', function () {

      var el, vm, op, cb, hooks
      beforeEach(function () {
        hooks = {}
        el = document.createElement('div')
        el.textContent = 'hello'
        document.body.appendChild(el)
        op = jasmine.createSpy('js transition op')
        cb = jasmine.createSpy('js transition cb')
        vm = new Vue({ el: el })
      })

      afterEach(function () {
        document.body.removeChild(el)
      })

      it('beforeEnter', function () {
        var spy = jasmine.createSpy('js transition beforeEnter')
        hooks.beforeEnter = function (el) {
          spy(this, el)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm, el)
      })

      it('enter', function () {
        var spy = jasmine.createSpy('js enter')
        hooks.enter = function (e, done) {
          expect(e).toBe(el)
          expect(op).toHaveBeenCalled()
          done()
          expect(cb).toHaveBeenCalled()
          spy(this)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm)
      })

      it('leave', function () {
        var spy = jasmine.createSpy('js leave')
        hooks.leave = function (e, done) {
          expect(e).toBe(el)
          done()
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          spy(this)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, -1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm)
      })

      it('no def', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        transition.apply(el, 1, op, vm, cb)
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          transition.apply(el, -1, op, vm, cb)
          _.nextTick(function () {
            expect(op.calls.count()).toBe(2)
            expect(cb.calls.count()).toBe(2)
            done()
          })
        })
      })

      it('cancel hook', function (done) {
        var cleanupSpy = jasmine.createSpy('js cleanup')
        var leaveSpy = jasmine.createSpy('js leave')
        var timeout
        hooks.enter = function (el, done) {
          timeout = setTimeout(done, 30)
        }
        hooks.enterCancelled = function () {
          clearTimeout(timeout)
          cleanupSpy()
        }
        hooks.leave = function (el, done) {
          expect(cleanupSpy).toHaveBeenCalled()
          leaveSpy()
          done()
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        setTimeout(function () {
          transition.apply(el, -1, op, vm)
          expect(leaveSpy).toHaveBeenCalled()
          setTimeout(function () {
            expect(cb).not.toHaveBeenCalled()
            done()
          }, 30)
        }, 15)
      })
    })
  })
}
