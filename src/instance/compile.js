var _ = require('../util')
var config = require('../config')
var Direcitve = require('../directive')
var dirParser = require('../parse/directive')

/**
 * The main entrance to the compilation process.
 * Calling this function requires the instance's `$el` to
 * be already set up, and it should be called only once
 * during an instance's entire lifecycle.
 */

exports._compile = function () {
  if (this._blockNodes) {
    this._blockNodes.forEach(this._compileNode, this)
  } else {
    this._compileNode(this.$el)
  }
}

/**
 * Generic compile function. Determines the actual compile
 * function to use based on the nodeType.
 *
 * @param {Node} node
 */

exports._compileNode = function (node) {
  switch (node.nodeType) {
    case 1: // element
      if (node.tagName !== 'SCRIPT') {
        this._compileElement(node)
      }
      break
    case 3: // text
      if (config.interpolate) {
        this._compileTextNode(node)
      }
      break
    case 8: // comment
      this._compileComment(node)
      break
  }
}

/**
 * Compile an Element
 *
 * @param {Element} node
 */

exports._compileElement = function (node) {
  var tag = node.tagName
  // textarea is pretty annoying
  // because its value creates childNodes which
  // we don't want to compile.
  if (tag === 'TEXTAREA' && node.value) {
      node.value = this.$interpolate(node.value)
  }
  var hasAttributes = node.hasAttributes()
  // check priority directives
  if (hasAttributes) {
    if (this._checkPriorityDirectives(node)) {
      return
    }
  }
  // check tag components
  if (
    tag.indexOf('-') > 0 &&
    this.$options.components[tag]
  ) {
    this._bindDirective('component', tag, node)
    return
  }
  // compile normal directives
  if (hasAttributes) {
    this._compileAttrs(node)
  }
  // recursively compile childNodes
  if (node.hasChildNodes()) {
    _.toArray(node.childNodes)
      .forEach(this._compileNode, this)
  }
}

/**
 * Compile attribtues on an Element
 *
 * @param {Element} node
 */

exports._compileAttrs = function (node) {
  var attrs = _.toArray(node.attributes)
  var i = attrs.length
  var registry = this.$options.directives
  var dirs = []
  var attr, attrName, dir, dirName
  while (i--) {
    attr = attrs[i]
    attrName = attr.name
    if (attrName.indexOf(config.prefix) === 0) {
      dirName = attrName.slice(config.prefix.length)
      if (registry[dirName]) {
        node.removeAttribute(attrName)
        dirs.push({
          name: dirName,
          value: attr.value
        })
      } else {
        _.warn('Unknown directive: ' + dirName)
      }
    }
  }
  // sort the directives by priority, low to high
  dirs.sort(function (a, b) {
    a = registry[a.name].priority || 0
    b = registry[b.name].priority || 0
    return a > b ? 1 : -1
  })
  i = dirs.length
  while (i--) {
    dir = dirs[i]
    this._bindDirective(dir.name, dir.value, node)
  }
}

/**
 * Compile a TextNode
 *
 * @param {TextNode} node
 */

exports._compileTextNode = function (node) {
  
}

/**
 * Compile a comment node (check for block flow-controls)
 *
 * @param {CommentNode} node
 */

exports._compileComment = function (node) {
  
}

/**
 * Check for priority directives that would potentially
 * skip other directives:
 *
 * - v-pre
 * - v-repeat
 * - v-if
 * - v-component
 *
 * @param {Element} node
 * @return {Boolean}
 */

exports._checkPriorityDirectives = function (node) {
  var value
  /* jshint boss: true */
  if (_.attr(node, 'pre') !== null) {
    return true
  } else if (value = _.attr(node, 'repeat')) {
    this._bindDirective('repeat', value)
    return true
  } else if (value = _.attr(node, 'if')) {
    this._bindDirective('if', value)
    return true
  } else if (value = _.attr(node, 'component')) {
    this._bindDirective('component', value)
    return true
  }
}

/**
 * Bind a directive.
 *
 * @param {String} name
 * @param {String} value
 * @param {Element} node
 */

exports._bindDirective = function (name, value, node) {
  var descriptors = dirParser.parse(value)
  var dirs = this._directives
  for (var i = 0, l = descriptors.length; i < l; i++) {
    dirs.push(
      new Direcitve(name, node, this, descriptors[i])
    )
  }
}