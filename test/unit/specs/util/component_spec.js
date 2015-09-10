var _ = require('../../../../src/util')

describe('Util - Component', function () {

  it('checkComponent', function () {
    var el = document.createElement('component')
    // <component> with no is attr
    var res = _.checkComponent(el)
    expect(res).toBeUndefined()
    // <component is="...">
    el.setAttribute('is', '{{what}}')
    res = _.checkComponent(el, {}, true)
    expect(res).toBe('{{what}}')
    // custom element, not defined
    el = document.createElement('test')
    res = _.checkComponent(el, {
      components: {}
    })
    expect(res).toBeUndefined()
    // custom element, defined
    res = _.checkComponent(el, {
      components: { test: true }
    })
    expect(res).toBe('test')
  })
})
