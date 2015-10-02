var _ = require('../../../../src/util')
var Vue = require('../../../../src/vue')

function trigger (target, event, process) {
  var e = document.createEvent('HTMLEvents')
  e.initEvent(event, true, true)
  if (process) process(e)
  target.dispatchEvent(e)
  return e
}

if (_.inBrowser) {
  describe('on-', function () {

    var el
    beforeEach(function () {
      el = document.createElement('div')
      spyOn(_, 'warn')
    })

    it('methods', function () {
      var spy = jasmine.createSpy()
      var vm = new Vue({
        el: el,
        template: '<a v-on="click:test"></a>',
        data: {a: 1},
        methods: {
          test: spy
        }
      })
      var a = el.firstChild
      trigger(a, 'click')
      expect(spy.calls.count()).toBe(1)
      vm.$destroy()
      trigger(a, 'click')
      expect(spy.calls.count()).toBe(1)
    })

    it('inline expression', function (done) {
      new Vue({
        el: el,
        template: '<a v-on="click:a++">{{a}}</a>',
        data: {a: 1}
      })
      var a = el.firstChild
      trigger(a, 'click')
      _.nextTick(function () {
        expect(a.textContent).toBe('2')
        done()
      })
    })

    it('with key filter', function (done) {
      new Vue({
        el: el,
        template: '<a v-on="keyup:test | key \'enter\'">{{a}}</a>',
        data: {a: 1},
        methods: {
          test: function () {
            this.a++
          }
        }
      })
      var a = el.firstChild
      trigger(a, 'keyup', function (e) {
        e.keyCode = 13
      })
      _.nextTick(function () {
        expect(a.textContent).toBe('2')
        done()
      })
    })

    it('with key filter (new syntax)', function (done) {
      new Vue({
        el: el,
        template: '<a @keyup.enter="test">{{a}}</a>',
        data: {a: 1},
        methods: {
          test: function () {
            this.a++
          }
        }
      })
      var a = el.firstChild
      trigger(a, 'keyup', function (e) {
        e.keyCode = 13
      })
      _.nextTick(function () {
        expect(a.textContent).toBe('2')
        done()
      })
    })

    it('stop modifier', function () {
      var outer = jasmine.createSpy('outer')
      var inner = jasmine.createSpy('inner')
      new Vue({
        el: el,
        template: '<div @click="outer"><div class="inner" @click.stop="inner"></div></div>',
        methods: {
          outer: outer,
          inner: inner
        }
      })
      trigger(el.querySelector('.inner'), 'click')
      expect(inner).toHaveBeenCalled()
      expect(outer).not.toHaveBeenCalled()
    })

    it('prevent modifier', function () {
      var prevented
      new Vue({
        el: el,
        template: '<a href="#" @click.prevent="onClick">',
        methods: {
          onClick: function (e) {
            // store the prevented state now:
            // IE will reset the `defaultPrevented` flag
            // once the event handler call stack is done!
            prevented = e.defaultPrevented
          }
        }
      })
      trigger(el.firstChild, 'click')
      expect(prevented).toBe(true)
    })

    it('multiple modifiers working together', function () {
      var outer = jasmine.createSpy('outer')
      var prevented
      new Vue({
        el: el,
        template: '<div @keyup="outer"><input class="inner" @keyup.enter.stop.prevent="inner"></div></div>',
        methods: {
          outer: outer,
          inner: function (e) {
            prevented = e.defaultPrevented
          }
        }
      })
      trigger(el.querySelector('.inner'), 'keyup', function (e) {
        e.keyCode = 13
      })
      expect(outer).not.toHaveBeenCalled()
      expect(prevented).toBe(true)
    })

    it('warn non-function values', function () {
      new Vue({
        el: el,
        data: { test: 123 },
        template: '<a v-on="keyup:test"></a>'
      })
      expect(hasWarned(_, 'expects a function value')).toBe(true)
    })

    it('iframe', function () {
      // iframes only gets contentWindow when inserted
      // into the document
      document.body.appendChild(el)
      var spy = jasmine.createSpy()
      var vm = new Vue({
        el: el,
        template: '<iframe v-on="click:test"></iframe>',
        methods: {
          test: spy
        }
      })
      var iframeDoc = el.firstChild.contentDocument
      trigger(iframeDoc, 'click')
      expect(spy.calls.count()).toBe(1)
      vm.$destroy()
      trigger(iframeDoc, 'click')
      expect(spy.calls.count()).toBe(1)
      document.body.removeChild(el)
    })

    it('passing $event', function () {
      var test = jasmine.createSpy()
      new Vue({
        el: el,
        template: '<a v-on="click:test($event)"></a>',
        methods: {
          test: test
        }
      })
      var e = trigger(el.firstChild, 'click')
      expect(test).toHaveBeenCalledWith(e)
    })

    it('passing $event on a nested instance', function () {
      var test = jasmine.createSpy()
      var parent = new Vue({
        methods: {
          test: test
        }
      })
      parent.$addChild({
        el: el,
        inherit: true,
        template: '<a v-on="click:test($event)"></a>'
      })
      var e = trigger(el.firstChild, 'click')
      expect(test).toHaveBeenCalledWith(e)
    })

  })
}
