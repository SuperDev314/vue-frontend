var mergeOptions = require('../util').mergeOptions

/**
 * The main init sequence. This is called for every
 * instance, including ones that are created from extended
 * constructors.
 *
 * @param {Object} options - this options object should be
 *                           the result of merging class
 *                           options and the options passed
 *                           in to the constructor.
 */

exports._init = function (options) {

  options = options || {}

  this.$el = null
  this.$parent = options.parent
  this.$root = this.$parent
    ? this.$parent.$root
    : this
  this.$children = []
  this.$ = {}           // child vm references
  this.$$ = {}          // element references
  this._watchers = []   // all watchers as an array
  this._directives = [] // all directives
  this._childCtors = {} // inherit:true constructors

  // a flag to avoid this being observed
  this._isVue = true

  // events bookkeeping
  this._events = {}            // registered callbacks
  this._eventsCount = {}       // for $broadcast optimization
  this._shouldPropagate = false // for event propagation

  // fragment instance properties
  this._isFragment = false
  this._fragmentStart =    // @type {CommentNode}
  this._fragmentEnd = null // @type {CommentNode}

  // lifecycle state
  this._isCompiled =
  this._isDestroyed =
  this._isReady =
  this._isAttached =
  this._isBeingDestroyed = false
  this._unlinkFn = null

  // context:
  // if this is a transcluded component, context
  // will be the common parent vm of this instance
  // and its host.
  this._context = options._context || this.$parent

  // scope:
  // if this is inside an inline v-repeat, the scope
  // will be the intermediate scope created for this
  // repeat fragment. this is used for linking props
  // and container directives.
  this._scope = options._scope

  // set ref
  if (options._ref) {
    (this._scope || this._context).$[options._ref] = this
  }

  // fragment:
  // if this instance is compiled inside a Fragment, it
  // needs to reigster itself as a child of that fragment
  // for attach/detach to work properly.
  this._frag = options._frag
  if (this._frag) {
    this._frag.children.push(this)
  }

  // push self into parent / transclusion host
  if (this.$parent) {
    this.$parent.$children.push(this)
  }

  // props used in v-repeat diffing
  this._reused = false
  this._staggerOp = null

  // merge options.
  options = this.$options = mergeOptions(
    this.constructor.options,
    options,
    this
  )

  // initialize data as empty object.
  // it will be filled up in _initScope().
  this._data = {}

  // call init hook
  this._callHook('init')

  // initialize data observation and scope inheritance.
  this._initState()

  // setup event system and option events.
  this._initEvents()

  // call created hook
  this._callHook('created')

  // if `el` option is passed, start compilation.
  if (options.el) {
    this.$mount(options.el)
  }
}
