if (process.env.NODE_ENV !== 'production') {

  var _ = require('./util')
  var warn = function (msg) {
    _.warn('{DEPRECATION} ' + msg)
  }

  var newBindingSyntaxLink = ' See https://github.com/yyx990803/vue/issues/1173 for details.'

  _.deprecation = {

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

    V_EL: function () {
      warn(
        'v-el will no longer be a directive in 1.0.0. Use the "el" special attribute instead. ' +
        'See https://github.com/yyx990803/vue/issues/1198 for details.'
      )
    },

    V_TRANSITION: function () {
      warn(
        'v-transition will no longer be a directive in 1.0.0; It will become a ' +
        'special attribute without the prefix. Use "transition" instead.' +
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
        'Prop ' + attr + '="' + value + '": props no longer use mustache tags ' +
        'to indicate a dynamic binding. Use the "bind-" prefix instead.' +
        newBindingSyntaxLink
      )
    },

    DATA_PROPS: function (attr, value) {
      warn(
        'Prop ' + attr + '="' + value + '": props will no longer support the ' +
        '"data-" prefix in 1.0.0.' + newBindingSyntaxLink
      )
    },

    PROP_CASTING: function (attr, value) {
      warn(
        'Prop ' + attr + '="' + value + '": literal props will no longer be ' +
        'auto-casted into booleans/numbers in 1.0.0 - they will all be treated ' +
        'as literal strings. Use "bind-" syntax for boolean/number literals instead.'
      )
    },

    BIND_IS: function () {
      warn(
        '<component bind-is="view"> syntax will be deprecated in 1.0.0. Use ' +
        '<component bind-is="view"> instead.'
      )
    },

    PARTIAL_NAME: function (id) {
      warn(
        '<partial name="' + id + '">: mustache interpolations inside attributes ' +
        'will be deprecated in 1.0.0. Use bind-name="expression" instead.'
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
    },

    PROPAGATION: function (event) {
      warn(
        'No need to return false in handler for event "' + event + '": events ' +
        'no longer propagate beyond the first triggered handler unless the ' +
        'handler explicitly returns true. See https://github.com/yyx990803/vue/issues/1175 ' +
        'for more details.'
      )
    },

    MODEL_EXP: function (exp) {
      warn(
        'Params "exp", "true-exp" and "false-exp" for v-model will be deprecated in 1.0.0. ' +
        'Use "bind-value", "bind-true-value" and "bind-false-value" instead.'
      )
    },

    SELECT_OPTIONS: function () {
      warn(
        'The "options" param for <select v-model> will be deprecated in 1.0.0. ' +
        'Use v-for to render the options. See https://github.com/yyx990803/vue/issues/1229 ' +
        'for more details.'
      )
    },

    INTERPOLATE: function () {
      /* istanbul ignore next */
      warn(
        'The global "interpolate" config will be deprecated in 1.0.0. Use "v-pre" ' +
        'on elements that should be skipped by the template compiler.'
      )
    },

    LITERAL_DIR: function (name) {
      warn(
        'Custom directive "' + name + '": It\'s no longer necessary to declare ' +
        'literal directives in 1.0.0. Use the ":=" syntax to indicate a literal ' +
        'value instead. For more details see ' +
        'https://github.com/yyx990803/vue/issues/1173#issuecomment-137473650'
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
