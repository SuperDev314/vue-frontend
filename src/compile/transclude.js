var _ = require('../util')
var templateParser = require('../parse/template')

/**
 * Process an element or a DocumentFragment based on a
 * instance option object. This allows us to transclude
 * a template node/fragment before the instance is created,
 * so the processed fragment can then be cloned and reused
 * in v-repeat.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

module.exports = function transclude (el, options) {
  // for template tags, what we want is its content as
  // a documentFragment (for block instances)
  if (el.tagName === 'TEMPLATE') {
    el = templateParser.parse(el)
  }
  if (el instanceof DocumentFragment) {
    return transcludeBlock(el)
  } else if (options.template) {
    return transcludeTemplate(el, options)
  } else {
    return el
  }
}

/**
 * Mark a block fragment that manages a group of nodes
 * instead of one element. The group is denoted by
 * a starting node and an ending node.
 *
 * @param {DocumentFragment} frag
 */

function transcludeBlock (frag) {
  _.prepend(document.createComment('v-block-start'), frag)
  frag.appendChild(document.createComment('v-block-end'))
  return frag
}

/**
 * Process the template option.
 * If the replace option is true this will swap the $el.
 *
 * @param {Element} el
 * @param {Object} options
 * @return {Element|DocumentFragment}
 */

function transcludeTemplate (el, options) {
  var template = options.template
  var frag = templateParser.parse(template, true)
  if (!frag) {
    _.warn('Invalid template option: ' + template)
  } else {
    collectRawContent(el)
    if (options.replace) {
      if (frag.childNodes.length > 1) {
        transcludeBlock(frag)
        transcludeContent(_.toArray(frag.childNodes))
        return frag
      } else {
        var replacer = frag.firstChild
        _.copyAttributes(el, replacer)
        transcludeContent(replacer)
        return replacer
      }
    } else {
      el.appendChild(frag)
      transcludeContent(el)
      return el
    }
  }
}

/**
 * Collect raw content inside $el before they are
 * replaced by template content.
 */

var rawContent
function collectRawContent (el) {
  var child
  rawContent = null
  if (el.hasChildNodes()) {
    rawContent = document.createElement('div')
    /* jshint boss:true */
    while (child = el.firstChild) {
      rawContent.appendChild(child)
    }
  }
}

/**
 * Resolve <content> insertion points mimicking the behavior
 * of the Shadow DOM spec:
 *
 *   http://w3c.github.io/webcomponents/spec/shadow/#insertion-points
 *
 * @param {Element|DocumentFragment} el
 */

function transcludeContent (el) {
  var outlets = getOutlets(el)
  var i = outlets.length
  if (!i) return
  var outlet, select, j, main
  // first pass, collect corresponding content
  // for each outlet.
  while (i--) {
    outlet = outlets[i]
    if (rawContent) {
      select = outlet.getAttribute('select')
      if (select) {  // select content
        outlet.content = _.toArray(
          rawContent.querySelectorAll(select)
        )
      } else { // default content
        main = outlet
      }
    } else { // fallback content
      outlet.content = _.toArray(outlet.childNodes)
    }
  }
  // second pass, actually insert the contents
  for (i = 0, j = outlets.length; i < j; i++) {
    outlet = outlets[i]
    if (outlet !== main) {
      insertContentAt(outlet, outlet.content)
    }
  }
  // finally insert the main content
  if (main) {
    insertContentAt(main, _.toArray(rawContent.childNodes))
  }
}

/**
 * Get <content> outlets from the element/list
 *
 * @param {Element|Array} el
 * @return {Array}
 */

var concat = [].concat
function getOutlets (el) {
  return _.isArray(el)
    ? concat.apply([], el.map(getOutlets))
    : el.nodeType === 1
      ? _.toArray(el.querySelectorAll('content'))
      : []
}

/**
 * Insert an array of nodes at outlet,
 * then remove the outlet.
 *
 * @param {Element} outlet
 * @param {Array} contents
 */

function insertContentAt (outlet, contents) {
  // not using util DOM methods here because
  // parentNode can be cached
  var parent = outlet.parentNode
  for (var i = 0, j = contents.length; i < j; i++) {
    parent.insertBefore(contents[i], outlet)
  }
  parent.removeChild(outlet)
}