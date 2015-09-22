var _ = require('../../../../src/util')
var Vue = require('../../../../src/vue')
var transition = require('../../../../src/transition')
var def = require('../../../../src/directives/show')

if (_.inBrowser) {
  describe('v-show', function () {

    var el
    beforeEach(function () {
      el = document.createElement('div')
      spyOn(transition, 'apply').and.callThrough()
    })

    it('should work', function () {
      var dir = {
        el: el,
        update: def.update,
        vm: new Vue()
      }
      dir.update(false)
      expect(el.style.display).toBe('none')
      dir.update(true)
      expect(el.style.display).toBe('')
      expect(transition.apply).toHaveBeenCalled()
    })

    it('should work with v-else', function (done) {
      var vm = new Vue({
        el: el,
        template:
          '<p v-show="ok">YES</p>' +
          '<p v-else>NO</p>',
        data: {
          ok: true
        }
      })
      expect(el.children[0].style.display).toBe('')
      expect(el.children[1].style.display).toBe('none')
      expect(transition.apply.calls.count()).toBe(2)
      vm.ok = false
      Vue.nextTick(function () {
        expect(el.children[0].style.display).toBe('none')
        expect(el.children[1].style.display).toBe('')
        expect(transition.apply.calls.count()).toBe(4)
        done()
      })
    })
  })
}
