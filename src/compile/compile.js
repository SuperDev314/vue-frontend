var _ = require('../util')
var config = require('../config')
var Direcitve = require('../directive')
var textParser = require('../parse/text')
var dirParser = require('../parse/directive')
var templateParser = require('../parse/template')

function noop () {}

/**
 * Compile a template and return a reusable composite link
 * function, which recursively contains more link functions
 * inside. This top level compile function should only be
 * called on instance root nodes.
 *
 * @param {Element|DocumentFragment} el
 * @param {Object} options
 * @return {Function}
 */

var compile = module.exports = function (el, options) {
  // for template tags, what we want is its content as
  // a documentFragment (for block instances)
  if (el.tagName === 'TEMPLATE') {
    el = el.content instanceof DocumentFragment
      ? el.content
      : templateParser.parse(el.innerHTML)
  }
  var nodeLinkFn = el instanceof DocumentFragment
    ? null
    : compileNode(el, options)
  var childLinkFn =
    (!nodeLinkFn || !nodeLinkFn.terminal) &&
    el.hasChildNodes()
      ? compileNodeList(el.childNodes, options)
      : null
  var params = options.paramAttributes
  var paramsLinkFn = params
    ? compileParamAttributes(el, params, options)
    : null
  return function link (vm, el) {
    if (paramsLinkFn) paramsLinkFn(vm, el)
    if (nodeLinkFn) nodeLinkFn(vm, el)
    if (childLinkFn) childLinkFn(vm, el.childNodes)
  }
}

/**
 * Compile a node and return a nodeLinkFn based on the
 * node type.
 *
 * @param {Node} node
 * @param {Object} options
 * @return {Function|undefined}
 */

function compileNode (node, options) {
  var type = node.nodeType
  if (type === 1 && node.tagName !== 'SCRIPT') {
    return compileElement(node, options)
  } else if (type === 3 && config.interpolate) {
    return compileTextNode(node, options)
  }
}

/**
 * Compile an element and return a nodeLinkFn.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function|null}
 */

function compileElement (el, options) {
  var hasAttributes = el.hasAttributes()
  var tag = el.tagName.toLowerCase()
  if (hasAttributes) {
    // check terminal direcitves
    var terminalLinkFn
    for (var i = 0; i < 3; i++) {
      terminalLinkFn = checkTerminalDirectives(el, options)
      if (terminalLinkFn) {
        terminalLinkFn.terminal = true
        return terminalLinkFn
      }
    }
  }
  // check custom element component
  var component =
    tag.indexOf('-') > 0 &&
    options.components[tag]
  if (component) {
    return makeTeriminalLinkFn(el, 'component', tag, options)
  }
  // check other directives
  if (hasAttributes) {
    var directives = collectDirectives(el, options)
    return directives.length
      ? makeDirectivesLinkFn(directives)
      : null
  }
}

/**
 * Build a multi-directive link function.
 *
 * @param {Array} directives
 * @return {Function} directivesLinkFn
 */

function makeDirectivesLinkFn (directives) {
  return function directivesLinkFn (vm, el) {
    // reverse apply because it's sorted low to high
    var i = directives.length
    var vmDirs = vm._directives
    var dir, j
    while (i--) {
      dir = directives[i]
      if (dir.oneTime) {
        // one time attr interpolation
        el.setAttribute(
          dir.name,
          vm.$eval(dir.value)
        )
      } else {
        j = dir.descriptors.length
        while (j--) {
          vmDirs.push(
            new Direcitve(dir.name, el, vm,
                          dir.descriptors[j], dir.def)
          )
        }
      }
    }
  }
}

/**
 * Compile a textNode and return a nodeLinkFn.
 *
 * @param {TextNode} node
 * @param {Object} options
 * @return {Function|null} textNodeLinkFn
 */

function compileTextNode (node, options) {
  var tokens = textParser.parse(node.nodeValue)
  if (!tokens) {
    return null
  }
  var frag = document.createDocumentFragment()
  var dirs = options.directives
  var el, token, value
  for (var i = 0, l = tokens.length; i < l; i++) {
    token = tokens[i]
    value = token.value
    if (token.tag) {
      if (token.oneTime) {
        el = document.createTextNode(value)
      } else {
        if (token.html) {
          el = document.createComment('v-html')
          token.type = 'html'
          token.def = dirs.html
          token.descriptor = dirParser.parse(value)[0]
        } else if (token.partial) {
          el = document.createComment('v-partial')
          token.type = 'partial'
          token.def = dirs.partial
          token.descriptor = dirParser.parse(value)[0]
        } else {
          el = document.createTextNode('')
          token.type = 'text'
          token.def = dirs.text
          token.descriptor = dirParser.parse(value)[0]
        }
      }
    } else {
      el = document.createTextNode(value)
    }
    frag.appendChild(el)
  }
  return makeTextNodeLinkFn(tokens, frag, options)
}

/**
 * Build a function that processes a textNode.
 *
 * @param {Array<Object>} tokens
 * @param {DocumentFragment} frag
 */

function makeTextNodeLinkFn (tokens, frag) {
  return function textNodeLinkFn (vm, el) {
    var fragClone = frag.cloneNode(true)
    var childNodes = _.toArray(fragClone.childNodes)
    var dirs = vm._directives
    var token, value, node
    for (var i = 0, l = tokens.length; i < l; i++) {
      token = tokens[i]
      value = token.value
      if (token.tag) {
        node = childNodes[i]
        if (token.oneTime) {
          value = vm.$eval(value)
          if (token.html) {
            _.replace(node, templateParser.parse(value, true))
          } else {
            node.nodeValue = value
          }
        } else {
          dirs.push(
            new Direcitve(token.type, node, vm,
                          token.descriptor, token.def)
          )
        }
      }
    }
    _.replace(el, fragClone)
  }
}

/**
 * Compile a node list and return a childLinkFn.
 *
 * @param {NodeList} nodeList
 * @param {Object} options
 * @return {Function|undefined}
 */

function compileNodeList (nodeList, options) {
  var linkFns = []
  var nodeLinkFn, childLinkFn, node
  for (var i = 0, l = nodeList.length; i < l; i++) {
    node = nodeList[i]
    nodeLinkFn = compileNode(node, options)
    childLinkFn =
      (!nodeLinkFn || !nodeLinkFn.terminal) &&
      node.hasChildNodes()
        ? compileNodeList(node.childNodes, options)
        : null
    linkFns.push(nodeLinkFn, childLinkFn)
  }
  return linkFns.length
    ? makeChildLinkFn(linkFns)
    : null
}

/**
 * Make a child link function for a node's childNodes.
 *
 * @param {Array<Function>} linkFns
 * @return {Function} childLinkFn
 */

function makeChildLinkFn (linkFns) {
  return function childLinkFn (vm, nodes) {
    // stablize nodes
    nodes = _.toArray(nodes)
    var node, nodeLinkFn, childrenLinkFn
    for (var i = 0, n = 0, l = linkFns.length; i < l; n++) {
      node = nodes[n]
      nodeLinkFn = linkFns[i++]
      childrenLinkFn = linkFns[i++]
      if (nodeLinkFn) {
        nodeLinkFn(vm, node)
      }
      if (childrenLinkFn) {
        childrenLinkFn(vm, node.childNodes)
      }
    }
  }
}

/**
 * Compile param attributes on a root element and return
 * a paramAttributes link function.
 *
 * @param {Element} el
 * @param {Array} attrs
 * @param {Object} options
 * @return {Function} paramsLinkFn
 */

function compileParamAttributes (el, attrs, options) {
  var params = []
  var i = attrs.length
  var name, value, param
  while (i--) {
    name = attrs[i]
    value = el.getAttribute(name)
    if (value !== null) {
      el.removeAttribute(name)
      param = {
        name: name,
        value: value
      }
      var tokens = textParser.parse(value)
      if (tokens) {
        if (tokens.length > 1) {
          _.warn(
            'Invalid param attribute binding: "' +
            name + '="' + value + '"' +
            '\nDon\'t mix binding tags with plain text ' +
            'in param attribute bindings.'
          )
        } else {
          param.dynamic = true
          param.value = tokens[0].value
        }
      }
      params.push(param)
    }
  }
  return makeParamsLinkFn(params, options)
}

/**
 * Build a function that applies param attributes to a vm.
 *
 * @param {Array} params
 * @param {Object} options
 * @return {Function} paramsLinkFn
 */

function makeParamsLinkFn (params, options) {
  var def = options.directives['with']
  return function paramsLinkFn (vm, el) {
    var i = params.length
    var param
    while (i--) {
      param = params[i]
      if (param.dynamic) {
        // dynamic param attribtues are bound as v-with.
        // we can directly fake the descriptor here beacuse
        // param attributes cannot use expressions or
        // filters.
        vm._directives.push(
          new Direcitve('with', el, vm, {
            arg: param.name,
            expression: param.value
          }, def)
        )
      } else {
        // just set once
        vm.$set(param.name, param.value)
      }
    }
  }
}

/**
 * Check an element for terminal directives in fixed order.
 * If it finds one, return a terminal link function.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Function} terminalLinkFn
 */

var terminalDirecitves = [
  'repeat',
  'component',
  'if'
]

function checkTerminalDirectives (el, options) {
  if (_.attr(el, 'pre') !== null) {
    return noop
  }
  var value, dirName
  /* jshint boss: true */
  for (var i = 0; i < 3; i++) {
    dirName = terminalDirecitves[i]
    if (value = _.attr(el, dirName)) {
      return makeTeriminalLinkFn(el, dirName, value, options)
    }
  }
}

/**
 * Build a link function for a terminal directive.
 *
 * @param {Element} el
 * @param {String} dirName
 * @param {String} value
 * @param {Object} options
 * @return {Function} terminalLinkFn
 */

function makeTeriminalLinkFn (el, dirName, value, options) {
  var descriptor = dirParser.parse(value)[0]
  var def = options.directives[dirName]
  if (
    dirName === 'repeat' &&
    !el.hasAttribute(config.prefix + 'component')
  ) {
    // optimize for simple repeats
    var linker = compile(el, options)
  }
  return function terminalLinkFn (vm, el) {
    vm._directives.push(
      new Direcitve(dirName, el, vm, descriptor, def, linker)
    )
  }
}

/**
 * Collect the directives on an element.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Array}
 */

function collectDirectives (el, options) {
  var attrs = _.toArray(el.attributes)
  var i = attrs.length
  var dirs = []
  var attr, attrName, dir, dirName, dirDef
  while (i--) {
    attr = attrs[i]
    attrName = attr.name
    if (attrName.indexOf(config.prefix) === 0) {
      dirName = attrName.slice(config.prefix.length)
      dirDef = options.directives[dirName]
      _.assertAsset(dirDef, 'directive', dirName)
      if (dirDef) {
        if (dirName !== 'cloak') {
          el.removeAttribute(attrName)
        }
        dirs.push({
          name: dirName,
          descriptors: dirParser.parse(attr.value),
          def: dirDef
        })
      }
    } else if (config.interpolate) {
      dir = collectAttrDirective(el, attrName, attr.value,
                                 options)
      if (dir) {
        dirs.push(dir)
      }
    }
  }
  // sort by priority, LOW to HIGH
  dirs.sort(directiveComparator)
  return dirs
}

/**
 * Check an attribute for potential dynamic bindings,
 * and return a directive object.
 *
 * @param {Element} el
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {Object}
 */

function collectAttrDirective (el, name, value, options) {
  var tokens = textParser.parse(value)
  if (tokens) {
    if (tokens.length === 1 && tokens[0].oneTime) {
      return {
        name: name,
        value: tokens[0].value,
        def: options.directives.attr,
        oneTime: true
      }
    } else {
      value = textParser.tokensToExp(tokens)
      return {
        name: 'attr',
        def: options.directives.attr,
        descriptors: dirParser.parse(name + ':' + value)
      }
    }
  }
}

/**
 * Directive priority sort comparator
 *
 * @param {Object} a
 * @param {Object} b
 */

function directiveComparator (a, b) {
  a = a.def.priority || 0
  b = b.def.priority || 0
  return a > b ? 1 : -1
}