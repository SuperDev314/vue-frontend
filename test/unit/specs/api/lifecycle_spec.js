var Vue = require('../../../../src/vue')
var _ = require('../../../../src/util')
var compile = require('../../../../src/compile/compile')

if (_.inBrowser) {
  describe('Lifecycle API', function () {
    
    describe('$mount', function () {

      var el, frag
      beforeEach(function () {
        el = document.createElement('div')
        el.textContent = '{{test}}'
        frag = document.createDocumentFragment()
        frag.appendChild(el)
        spyOn(_, 'warn')
      })

      it('normal', function () {
        var vm = new Vue({
          data: {
            test: 'hi!'
          }
        })
        vm.$mount(el)
        expect(vm.$el).toBe(el)
        expect(el.__vue__).toBe(vm)
        expect(el.textContent).toBe('hi!')
      })
      
      it('precompiled linker', function () {
        var linker = compile(el, Vue.options)
        var vm = new Vue({
          _linker: linker,
          data: {
            test: 'hi!'
          }
        })
        vm.$mount(el)
        expect(vm.$el).toBe(el)
        expect(el.__vue__).toBe(vm)
        expect(el.textContent).toBe('hi!')
      })

      it('mount to fragment', function () {
        var vm = new Vue({
          data: { test: 'frag' }
        })
        vm.$mount(frag)
        expect(vm.$el).toBe(vm._blockStart)
        expect(vm._blockFragment).toBe(frag)
        expect(vm.$el.nextSibling.textContent).toBe('frag')
      })

      it('hooks', function () {
        var hooks = ['created', 'beforeCompile', 'compiled', 'attached', 'ready']
        var options = {
          data: {
            test: 'hihi'
          }
        }
        hooks.forEach(function (hook) {
          options[hook] = jasmine.createSpy(hook)
        })
        var vm = new Vue(options)
        expect(options.created).toHaveBeenCalled()
        expect(options.beforeCompile).not.toHaveBeenCalled()
        vm.$mount(el)
        expect(options.beforeCompile).toHaveBeenCalled()
        expect(options.compiled).toHaveBeenCalled()
        expect(options.attached).not.toHaveBeenCalled()
        expect(options.ready).not.toHaveBeenCalled()
        vm.$appendTo(document.body)
        expect(options.attached).toHaveBeenCalled()
        expect(options.ready).toHaveBeenCalled()
        vm.$remove()
      })

      it('warn against multiple calls', function () {
        var vm = new Vue({
          el: el
        })
        vm.$mount(el)
        expect(_.warn).toHaveBeenCalled()
      })

    })

    describe('$destroy', function () {

      it('normal', function () {
        var vm = new Vue()
        expect(vm._isDestroyed).toBe(false)
        vm.$destroy()
        expect(vm._isDestroyed).toBe(true)
        expect(vm._watchers).toBeNull()
        expect(vm._userWatchers).toBeNull()
        expect(vm._watcherList).toBeNull()
        expect(vm.$el).toBeNull()
        expect(vm.$parent).toBeNull()
        expect(vm.$root).toBeNull()
        expect(vm._children).toBeNull()
        expect(vm._bindings).toBeNull()
        expect(vm._directives).toBeNull()
        expect(Object.keys(vm._events).length).toBe(0)
      })
      
      it('remove element', function () {
        var el = document.createElement('div')
        var parent = document.createElement('div')
        parent.appendChild(el)
        var vm = new Vue({ el: el })
        vm.$destroy(true)
        expect(parent.childNodes.length).toBe(0)
        expect(el.__vue__).toBeNull()
      })

      it('hooks', function () {
        var opts = {
          beforeDestroy: jasmine.createSpy(),
          destroyed: jasmine.createSpy(),
          detached: jasmine.createSpy()
        }
        var el = opts.el = document.createElement('div')
        document.body.appendChild(el)
        var vm = new Vue(opts)
        vm.$destroy(true)
        expect(opts.beforeDestroy).toHaveBeenCalled()
        expect(opts.destroyed).toHaveBeenCalled()
        expect(opts.detached).toHaveBeenCalled()
      })

      it('parent', function () {
        var parent = new Vue()
        var child = parent.$addChild()
        expect(parent._children.length).toBe(1)
        child.$destroy()
        expect(parent._children.length).toBe(0)
      })

      it('children', function () {
        var parent = new Vue()
        var child = parent.$addChild()
        parent.$destroy()
        expect(child._isDestroyed).toBe(true)
      })

      it('directives', function () {
        var spy = jasmine.createSpy('directive unbind')
        var vm = new Vue({
          el: document.createElement('div'),
          template: '<div v-test></div>',
          directives: {
            test: {
              unbind: spy
            }
          }
        })
        vm.$destroy()
        expect(spy).toHaveBeenCalled()
      })

      it('watchers', function () {
        var vm = new Vue({
          el: document.createElement('div'),
          template: '{{a}}',
          data: { a: 1 }
        })
        vm.$watch('a', function () {})
        var dirWatcher = vm._watcherList[0]
        var userWatcher = vm._watcherList[1]
        vm.$destroy()
        expect(dirWatcher.active).toBe(false)
        expect(userWatcher.active).toBe(false)
      })

      it('refuse multiple calls', function () {
        var spy = jasmine.createSpy()
        var vm = new Vue({
          beforeDestroy: spy
        })
        vm.$destroy()
        vm.$destroy()
        expect(spy.calls.count()).toBe(1)
      })

    })

  })
}