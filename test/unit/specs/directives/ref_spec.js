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
      expect(vm.$.test).toBeUndefined()
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
        vm._directives[0].unbind()
        expect(vm.$.test).toBeUndefined()
        done()
      })
    })

    it('nested v-repeat', function () {
      var vm = new Vue({
        el: el,
        template: '<div v-component="c1" v-ref="c1"></div>',
        components: {
          c1: {
            template: '<div v-repeat="2" v-ref="c2"></div>'
          }
        }
      })
      expect(vm.$.c1 instanceof Vue).toBe(true)
      expect(vm.$.c2).toBeUndefined()
      expect(Array.isArray(vm.$.c1.$.c2)).toBe(true)
      expect(vm.$.c1.$.c2.length).toBe(2)
    })

    it('should warn on non-root', function () {
      var vm = new Vue({
        el: el,
        template: '<div v-ref="test"></div>'
      })
      expect(_.warn).toHaveBeenCalled()
    })

    it('should warn when used in child template', function () {
      var vm = new Vue({
        el: el,
        template: '<div v-component="test"></div>',
        components: {
          test: {
            template: '<div v-ref="test"></div>',
            replace: true
          }
        }
      })
      expect(_.warn).toHaveBeenCalled()
    })

  })
}