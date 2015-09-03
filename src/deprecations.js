if (process.env.NODE_ENV !== 'production') {

  var _ = require('./util')
  var warn = function (msg) {
    _.warn('{DEPRECATION} ' + msg)
  }

  var newBindingSyntaxLink = ' See https://github.com/yyx990803/vue/issues/1173 for details.'

  _.deprecation = {

    REPEAT: function () {
      warn(
        'v-repeat will be deprecated in favor of v-for in 1.0.0. ' +
        'See https://github.com/yyx990803/vue/issues/1200 for details.'
      )
    },

    ADD: function () {
      warn(
        '$add() will be deprecated in 1.0.0. Use $set() instead. ' +
        'See https://github.com/yyx990803/vue/issues/1171 for details.'
      )
    },

    WAIT_FOR: function () {
      warn(
        '"wait-for" will be deprecated in 1.0.0. Use `activate` hook instead. ' +
        'See https://github.com/yyx990803/vue/issues/1169 for details.'
      )
    },

    STRICT_MODE: function (type, id) {
      warn(
        'Falling through to parent when resolving ' + type + ' with id "' + id +
        '". Strict mode will default to `true` in 1.0.0. ' +
        'See https://github.com/yyx990803/vue/issues/1170 for details.'
      )
    },

    CONTENT: function () {
      warn(
        '<content> insertion points will be deprecated in in 1.0.0. in favor of <slot>. ' +
        'See https://github.com/yyx990803/vue/issues/1167 for details.'
      )
    },

    DATA_AS_PROP: function () {
      warn(
        '$data will no longer be usable as a prop in 1.0.0. ' +
        'See https://github.com/yyx990803/vue/issues/1198 for details.'
      )
    },

    INHERIT: function () {
      warn(
        'The "inherit" option will be deprecated in 1.0.0. ' +
        'See https://github.com/yyx990803/vue/issues/1198 for details.'
      )
    },

    V_EL: function () {
      warn(
        'v-el will be deprecated in 1.0.0. ' +
        'See https://github.com/yyx990803/vue/issues/1198 for details.'
      )
    },

    DIR_ARGS: function (exp) {
      warn(
        'Directives will no longer take arguments in 1.0.0. Found in directive ' +
        '"' + exp + '"' + newBindingSyntaxLink
      )
    },

    MUTI_CLAUSES: function () {
      warn(
        'Directives will no longer support multiple clause syntax in 1.0.0.' +
        newBindingSyntaxLink
      )
    },

    V_TRANSITION: function () {
      warn(
        'v-transition will no longer be a directive in 1.0.0; It will become a ' +
        'special attribute without the prefix. Use "transition" instead. Also, ' +
        'it will no longer attach the .v-transition class, but instead leave ' +
        'the transition attribute on the element. If you were using the ' +
        '".name-transition" CSS selector before, you should now use the ' +
        '"[transition="name"]" selector instead.' +
        newBindingSyntaxLink
      )
    },

    V_REF: function () {
      warn(
        'v-ref will no longer be a directive in 1.0.0; It will become a ' +
        'special attribute without the prefix. Use "ref" instead.' +
        newBindingSyntaxLink
      )
    },

    V_CLASS: function () {
      warn(
        'v-class will no longer be a directive in 1.0.0; Use "bind-class" instead.' +
        newBindingSyntaxLink
      )
    },

    V_STYLE: function () {
      warn(
        'v-style will no longer be a directive in 1.0.0; Use "bind-style" instead.' +
        newBindingSyntaxLink
      )
    },

    V_ATTR: function () {
      warn(
        'v-attr will no longer be a directive in 1.0.0; Use the "bind-" syntax instead.' +
        newBindingSyntaxLink
      )
    },

    V_ON: function () {
      warn(
        'v-on will no longer be a directive in 1.0.0; Use the "on-" syntax instead.' +
        newBindingSyntaxLink
      )
    },

    ATTR_INTERPOLATION: function (name, value) {
      warn(
        'Mustache interpolations inside attributes: ' + name + '="' + value + '". ' +
        'This will be deprecated in 1.0.0. ' +
        'Use the "bind-" syntax instead.' + newBindingSyntaxLink
      )
    },

    PROPS: function (attr, value) {
      warn(
        'Prop ' + attr + '="' + value + '" should be prefixed with "prop-" and ' +
        'bound as expression in 1.0.0. ' +
        'For more details, see https://github.com/yyx990803/vue/issues/1173'
      )
    },

    COMPUTED_CACHE: function (name) {
      warn(
        'Computed property "' + name + '": computed properties are not cached by ' +
        'default in 1.0.0. You only need to enable cache for particularly expensive ones.'
      )
    },

    BIND_IS: function () {
      warn(
        '<component is="{{view}}"> syntax will be depreacted in 1.0.0. Use ' +
        '<component bind-is="view"> instead.'
      )
    },

    REF_IN_CHILD: function () {
      warn(
        'v-ref or ref can no longer be used on a component root in its own ' +
        'template in 1.0.0. Use it in the parent template instead.'
      )
    },

    KEY_FILTER: function () {
      warn(
        'The "key" filter will be deprecated in 1.0.0. Use the new ' +
        'on-keyup:key="handler" syntax instead.'
      )
    }

  }

  // ensure warning get warned only once
  var warned = {}
  Object.keys(_.deprecation).forEach(function (key) {
    var fn = _.deprecation[key]
    _.deprecation[key] = function () {
      if (!warned[key]) {
        warned[key] = true
        fn.apply(null, arguments)
      }
    }
  })
}
