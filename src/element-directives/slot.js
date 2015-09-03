var _ = require('../util')
var config = require('../config')
var templateParser = require('../parsers/template')

// This is the elementDirective that handles <content>
// transclusions. It relies on the raw content of an
// instance being stored as `$options._content` during
// the transclude phase.

module.exports = {

  priority: 1750,

  bind: function () {

    this.isSlot = this.el.tagName === 'SLOT'
    if (process.env.NODE_ENV !== 'production' && !this.isSlot) {
      _.deprecation.CONTENT()
    }

    var host = this.vm
    var raw = host.$options._content
    var content
    if (!raw) {
      this.fallback()
      return
    }

    var context = host._context
    var selector = this.isSlot
      ? this.param('name')
      : this.param('select')

    if (!selector) {
      // Default content
      var self = this
      var compileDefaultContent = function () {
        self.compile(
          extractFragment(raw.childNodes, raw, true),
          context,
          host
        )
      }
      if (!host._isCompiled) {
        // defer until the end of instance compilation,
        // because the default outlet must wait until all
        // other possible outlets with selectors have picked
        // out their contents.
        host.$once('hook:compiled', compileDefaultContent)
      } else {
        compileDefaultContent()
      }
    } else {
      // select content
      if (this.isSlot) {
        selector = '[slot="' + selector + '"]'
      }
      var nodes = raw.querySelectorAll(selector)
      if (nodes.length) {
        content = extractFragment(nodes, raw)
        if (content.hasChildNodes()) {
          this.compile(content, context, host)
        } else {
          this.fallback()
        }
      } else {
        this.fallback()
      }
    }
  },

  fallback: function () {
    this.compile(_.extractContent(this.el, true), this.vm)
  },

  compile: function (content, context, host) {
    if (content && context) {
      this.unlink = context.$compile(
        content, host, this._scope, this._frag
      )
    }
    if (content) {
      _.replace(this.el, content)
    } else {
      _.remove(this.el)
    }
  },

  unbind: function () {
    if (this.unlink) {
      this.unlink()
    }
  }
}

/**
 * Extract qualified content nodes from a node list.
 *
 * @param {NodeList} nodes
 * @param {Element} parent
 * @param {Boolean} main
 * @return {DocumentFragment}
 */

function extractFragment (nodes, parent, main) {
  var frag = document.createDocumentFragment()
  for (var i = 0, l = nodes.length; i < l; i++) {
    var node = nodes[i]
    // if this is the main outlet, we want to skip all
    // previously selected nodes;
    // otherwise, we want to mark the node as selected.
    // clone the node so the original raw content remains
    // intact. this ensures proper re-compilation in cases
    // where the outlet is inside a conditional block
    if (main && !node.__v_selected) {
      append(node)
    } else if (!main && node.parentNode === parent) {
      node.__v_selected = true
      append(node)
    }
  }
  return frag

  function append (node) {
    if (_.isTemplate(node) &&
        !hasDirecitve(node, 'if') &&
        !hasDirecitve(node, 'for')) {
      node = templateParser.parse(node)
    }
    node = templateParser.clone(node)
    if (node.attributes) {
      node.removeAttribute('slot')
    }
    frag.appendChild(node)
  }
}

/**
 * Check if there is a flow control directive on a template
 * element that is a slot.
 *
 * @param {Node} node
 * @param {String} dir
 */

function hasDirecitve (node, dir) {
  return node.hasAttribute(config.prefix + dir)
}
