var templateParser = require('../../../src/parse/template')
var parse = templateParser.parse
var testString = '<div>hello</div><p class="test">world</p>'

describe('Template Parser', function () {
  
  it('should return same if argument is already a fragment', function () {
    var frag = document.createDocumentFragment()
    var res = parse(frag)
    expect(res).toBe(frag)
  })

  // only test template node if it works in the browser being tested.
  var templateNode = document.createElement('template')
  if (templateNode.content) {
    it('should return content if argument is a valid template node', function () {
      var res = parse(templateNode)
      expect(res).toBe(templateNode.content)
    })
  }

  it('should parse if argument is a template string', function () {
    var res = parse(testString)
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(2)
    expect(res.querySelector('.test').textContent).toBe('world')
  })

  it('should parse textContent if argument is a script node', function () {
    var node = document.createElement('script')
    node.textContent = testString
    var res = parse(node)
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(2)
    expect(res.querySelector('.test').textContent).toBe('world')
  })

  it('should parse innerHTML if argument is a normal node', function () {
    var node = document.createElement('div')
    node.innerHTML = testString
    var res = parse(node)
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(2)
    expect(res.querySelector('.test').textContent).toBe('world')
  })

  it('should retrieve and parse if argument is an id selector', function () {
    var node = document.createElement('script')
    node.setAttribute('id', 'template-test')
    node.setAttribute('type', 'x/template')
    node.textContent = testString
    document.head.appendChild(node)
    var res = parse('#template-test')
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(2)
    expect(res.querySelector('.test').textContent).toBe('world')
    document.head.removeChild(node)
  })

  it('should work for table elements', function () {
    var res = parse('<td>hello</td>')
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(1)
    expect(res.firstChild.tagName).toBe('TD')
    expect(res.firstChild.textContent).toBe('hello')
  })

  it('should work for option elements', function () {
    var res = parse('<option>hello</option>')
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(1)
    expect(res.firstChild.tagName).toBe('OPTION')
    expect(res.firstChild.textContent).toBe('hello')
  })

  it('should work for svg elements', function () {
    var res = parse('<circle></circle>')
    expect(res instanceof DocumentFragment).toBeTruthy()
    expect(res.childNodes.length).toBe(1)
    // SVG tagNames should be lowercase because they are XML nodes not HTML
    expect(res.firstChild.tagName).toBe('circle')
    expect(res.firstChild.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('should cache template strings', function () {
    var res1 = parse(testString)
    var res2 = parse(testString)
    expect(res1).toBe(res2)
  })

  it('should cache id selectors', function () {
    var node = document.createElement('script')
    node.setAttribute('id', 'template-test')
    node.setAttribute('type', 'x/template')
    node.textContent = '<div>never seen before content</div>'
    document.head.appendChild(node)
    var res1 = parse('#template-test')
    var res2 = parse('#template-test')
    expect(res1).toBe(res2)
    document.head.removeChild(node)
  })

})