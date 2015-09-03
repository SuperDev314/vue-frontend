var _ = require('../../../../../src/util')
var def = require('../../../../../src/directives/internal/class')

if (_.inBrowser) {
  describe('v-class', function () {

    var el
    beforeEach(function () {
      el = document.createElement('div')
    })

    it('with className', function () {
      el.className = 'haha'
      var dir = _.extend({
        el: el,
        arg: 'test'
      }, def)
      dir.update(true)
      expect(el.className).toBe('haha test')
      dir.update(false)
      expect(el.className).toBe('haha')
    })

    it('without className', function () {
      el.className = 'haha'
      var dir = _.extend({ el: el }, def)
      dir.update('test')
      expect(el.className).toBe('haha test')
      dir.update('what now test')
      expect(el.className).toBe('haha test now what')
      dir.update('ok cool')
      expect(el.className).toBe('haha cool ok')
      dir.update()
      expect(el.className).toBe('haha')
    })

    it('object value', function () {
      el.className = 'hoho'
      var dir = _.extend({ el: el }, def)
      dir.update({
        a: true,
        b: false
      })
      expect(el.className).toBe('hoho a')
      dir.update({
        b: true
      })
      expect(el.className).toBe('hoho b')
      dir.update(null)
      expect(el.className).toBe('hoho')
    })

    it('array value', function () {
      el.className = 'a'
      var dir = _.extend({ el: el }, def)
      dir.update(['b', 'c'])
      expect(el.className).toBe('a b c')
      dir.update(['d', 'c'])
      expect(el.className).toBe('a c d')
      dir.update()
      expect(el.className).toBe('a')
    })

  })
}
