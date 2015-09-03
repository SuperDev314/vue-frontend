var _ = require('../util')
var propDef = require('../directives/internal/prop')
var propBindingModes = require('../config')._propBindingModes

// regexes
var identRE = require('../parsers/path').identRE
var settablePathRE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[[^\[\]]+\])*$/
var literalValueRE = /^(true|false)$|^\d.*|^'[^']*'$|^"[^"]*"$/

/**
 * Compile props on a root element and return
 * a props link function.
 *
 * @param {Element|DocumentFragment} el
 * @param {Array} propOptions
 * @return {Function} propsLinkFn
 */

module.exports = function compileProps (el, propOptions) {
  var props = []
  var i = propOptions.length
  var options, name, attr, value, path, prop
  while (i--) {
    options = propOptions[i]
    name = options.name

    if (name === '$data') {
      process.env.NODE_ENV !== 'production' && _.warn(
        'Do not use $data as prop.'
      )
      el.removeAttribute(name)
      continue
    }

    // props could contain dashes, which will be
    // interpreted as minus calculations by the parser
    // so we need to camelize the path here
    path = _.camelize(name)
    if (!identRE.test(path)) {
      process.env.NODE_ENV !== 'production' && _.warn(
        'Invalid prop key: "' + name + '". Prop keys ' +
        'must be valid identifiers.'
      )
      continue
    }

    attr = 'prop-' + _.hyphenate(name)
    value = el.getAttribute(attr)
    prop = {
      name: name,
      raw: value,
      path: path,
      options: options,
      mode: propBindingModes.ONE_WAY
    }

    if (value !== null) {
      el.removeAttribute(attr)
      value = value.trim()
      // check binding type
      if (literalValueRE.test(value)) {
        prop.mode = propBindingModes.ONE_TIME
      } else {
        prop.dynamic = true
        if (value.charAt(0) === '*') {
          prop.mode = propBindingModes.ONE_TIME
          value = value.slice(1).trim()
        } else if (value.charAt(0) === '@') {
          value = value.slice(1).trim()
          if (settablePathRE.test(value)) {
            prop.mode = propBindingModes.TWO_WAY
          } else {
            process.env.NODE_ENV !== 'production' && _.warn(
              'Cannot bind two-way prop with non-settable ' +
              'parent path: ' + value
            )
          }
        }
      }
      prop.parentPath = value
    } else if (options.required) {
      // warn missing required
      process.env.NODE_ENV !== 'production' && _.warn(
        'Missing required prop: ' + name
      )
    }

    // warn required two-way
    if (
      process.env.NODE_ENV !== 'production' &&
      options.twoWay &&
      prop.mode !== propBindingModes.TWO_WAY
    ) {
      _.warn(
        'Prop "' + name + '" expects a two-way binding type.'
      )
    }

    // push prop
    props.push(prop)
  }
  return makePropsLinkFn(props)
}

/**
 * Build a function that applies props to a vm.
 *
 * @param {Array} props
 * @return {Function} propsLinkFn
 */

function makePropsLinkFn (props) {
  return function propsLinkFn (vm, scope) {
    // store resolved props info
    vm._props = {}
    var i = props.length
    var prop, path, options, value
    while (i--) {
      prop = props[i]
      path = prop.path
      vm._props[path] = prop
      options = prop.options
      if (prop.raw === null) {
        // initialize absent prop
        _.initProp(vm, prop, getDefault(options))
      } else if (prop.dynamic) {
        // dynamic prop
        if (vm._context) {
          if (prop.mode === propBindingModes.ONE_TIME) {
            // one time binding
            value = (scope || vm._context).$get(prop.parentPath)
            _.initProp(vm, prop, value)
          } else {
            // dynamic binding
            vm._bindDir('prop', null, prop, propDef, null, scope)
          }
        } else {
          process.env.NODE_ENV !== 'production' && _.warn(
            'Cannot bind dynamic prop on a root instance' +
            ' with no parent: ' + prop.name + '="' +
            prop.raw + '"'
          )
        }
      } else {
        // literal, cast it and just set once
        var raw = _.stripQuotes(prop.raw) || prop.raw
        value = options.type === Boolean && raw === ''
          ? true
          // do not cast emptry string.
          // _.toNumber casts empty string to 0.
          : raw.trim()
            ? _.toBoolean(_.toNumber(raw))
            : raw
        _.initProp(vm, prop, value)
      }
    }
  }
}

/**
 * Get the default value of a prop.
 *
 * @param {Object} options
 * @return {*}
 */

function getDefault (options) {
  // no default, return undefined
  if (!options.hasOwnProperty('default')) {
    // absent boolean value defaults to false
    return options.type === Boolean
      ? false
      : undefined
  }
  var def = options.default
  // warn against non-factory defaults for Object & Array
  if (_.isObject(def)) {
    process.env.NODE_ENV !== 'production' && _.warn(
      'Object/Array as default prop values will be shared ' +
      'across multiple instances. Use a factory function ' +
      'to return the default value instead.'
    )
  }
  // call factory function for non-Function types
  return typeof def === 'function' && options.type !== Function
    ? def()
    : def
}
