var _ = require('../../../../src/util')
var Vue = require('../../../../src/vue')

if (_.inBrowser) {
  describe('v-if', function () {

    var el
    beforeEach(function () {
      el = document.createElement('div')
      spyOn(_, 'warn')
    })

    function wrap (content) {
      return '<!--v-if-start-->' + content + '<!--v-if-end-->'
    }

    it('normal', function (done) {
      var vm = new Vue({
        el: el,
        data: { test: false, a: 'A' },
        template: '<div v-if="test"><div v-component="test"></div></div>',
        components: {
          test: {
            inherit: true,
            template: '{{a}}'
          }
        }
      })
      // lazy instantitation
      expect(el.innerHTML).toBe(wrap(''))
      expect(vm._children).toBeNull()
      vm.test = true
      _.nextTick(function () {
        expect(el.innerHTML).toBe(wrap('<div><div>A</div><!--v-component--></div>'))
        expect(vm._children.length).toBe(1)
        vm.test = false
        _.nextTick(function () {
          expect(el.innerHTML).toBe(wrap(''))
          expect(vm._children.length).toBe(0)
          vm.test = true
          _.nextTick(function () {
            expect(el.innerHTML).toBe(wrap('<div><div>A</div><!--v-component--></div>'))
            expect(vm._children.length).toBe(1)
            var child = vm._children[0]
            vm.$destroy()
            expect(child._isDestroyed).toBe(true)
            done()
          })
        })
      })
    })

    it('template block', function (done) {
      var vm = new Vue({
        el: el,
        data: { test: false, a: 'A', b: 'B' },
        template: '<template v-if="test"><p>{{a}}</p><p>{{b}}</p></template>'
      })
      // lazy instantitation
      expect(el.innerHTML).toBe(wrap(''))
      vm.test = true
      _.nextTick(function () {
        expect(el.innerHTML).toBe(wrap('<p>A</p><p>B</p>'))
        vm.test = false
        _.nextTick(function () {
          expect(el.innerHTML).toBe(wrap(''))
          done()
        })
      })
    })

    it('v-if + v-component', function (done) {
      var vm = new Vue({
        el: el,
        data: { ok: false },
        template: '<div v-component="test" v-if="ok"></div>',
        components: {
          test: {
            data: function () {
              return { a: 123 }
            },
            template: '{{a}}'
          }
        }
      })
      expect(el.innerHTML).toBe(wrap(''))
      expect(vm._children).toBeNull()
      vm.ok = true
      _.nextTick(function () {
        expect(el.innerHTML).toBe(wrap('<div>123</div><!--v-component-->'))
        expect(vm._children.length).toBe(1)
        vm.ok = false
        _.nextTick(function () {
          expect(el.innerHTML).toBe(wrap(''))
          expect(vm._children.length).toBe(0)
          done()
        })
      })
    })

    it('v-if + dynamic component', function (done) {
      var vm = new Vue({
        el: el,
        data: {
          ok: false,
          view: 'a'
        },
        template: '<div v-component="{{view}}" v-if="ok"></div>',
        components: {
          a: {
            template: 'AAA'
          },
          b: {
            template: 'BBB'
          }
        }
      })
      expect(el.innerHTML).toBe(wrap(''))
      expect(vm._children).toBeNull()
      // toggle if with lazy instantiation
      vm.ok = true
      _.nextTick(function () {
        expect(el.innerHTML).toBe(wrap('<div>AAA</div><!--v-component-->'))
        expect(vm._children.length).toBe(1)
        // switch view when if=true
        vm.view = 'b'
        _.nextTick(function () {
          expect(el.innerHTML).toBe(wrap('<div>BBB</div><!--v-component-->'))
          expect(vm._children.length).toBe(1)
          // toggle if when already instantiated
          vm.ok = false
          _.nextTick(function () {
            expect(el.innerHTML).toBe(wrap(''))
            expect(vm._children.length).toBe(0)
            // toggle if and switch view at the same time
            vm.view = 'a'
            vm.ok = true
            _.nextTick(function () {
              expect(el.innerHTML).toBe(wrap('<div>AAA</div><!--v-component-->'))
              expect(vm._children.length).toBe(1)
              done()
            })
          })
        })
      })
    })

    it('invalid warn', function () {
      el.setAttribute('v-if', 'test')
      var vm = new Vue({
        el: el
      })
      expect(_.warn).toHaveBeenCalled()
    })

  })
}