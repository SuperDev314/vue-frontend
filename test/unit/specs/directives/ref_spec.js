var _ = require('../../../../src/util')
var Vue = require('../../../../src/vue')

if (_.inBrowser) {
  describe('v-ref', function () {

    var el
    beforeEach(function () {
      el = document.createElement('div')
      spyOn(_, 'warn')
    })

    var components = {
      test: {
        id: 'test'
      }
    }

    it('normal', function () {
      var vm = new Vue({
        el: el,
        components: components,
        template: '<div v-component="test" v-ref="test"></div>'
      })
      expect(vm.$.test).toBeTruthy()
      expect(vm.$.test.$options.id).toBe('test')
      vm.$.test.$destroy()
      expect(vm.$.test).toBeNull()
    })

    it('with v-repeat', function (done) {
      var vm = new Vue({
        el: el,
        data: { items: [1,2,3,4,5] },
        template: '<div v-repeat="items" v-ref="test"></div>'
      })
      expect(vm.$.test).toBeTruthy()
      expect(Array.isArray(vm.$.test)).toBe(true)
      expect(vm.$.test[0].$value).toBe(1)
      expect(vm.$.test[4].$value).toBe(5)
      vm.items = []
      _.nextTick(function () {
        expect(vm.$.test.length).toBe(0)
        done()
      })
    })

    it('inside v-if', function () {
      var vm = new Vue({
        el: el,
        data: { test: true },
        components: components,
        template: '<div v-if="test"><div v-component="test" v-ref="test"></div></div>'
      })
      expect(vm.$.test).toBeTruthy()
      expect(vm.$.test.$options.id).toBe('test')
      vm.$.test.$destroy()
      expect(vm.$.test).toBeNull()
    })

    it('warn on non-root', function () {
      var vm = new Vue({
        el: el,
        template: '<div v-ref="test"></div>'
      })
      expect(_.warn).toHaveBeenCalled()
    })

  })
}