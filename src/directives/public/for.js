var _ = require('../../util')
var FragmentFactory = require('../../fragment/factory')
var isObject = _.isObject
var uid = 0

module.exports = {

  priority: 2000,

  bind: function () {
    // support "item in items" syntax
    var inMatch = this.expression.match(/(.*) in (.*)/)
    if (inMatch) {
      this.alias = inMatch[1]
      this.expression = inMatch[2]
    }

    if (!this.alias) {
      process.env.NODE_ENV !== 'production' && _.warn(
        'Alias is required in v-for.'
      )
      return
    }

    // uid as a cache identifier
    this.id = '__v-for__' + (++uid)

    // check if this is an option list,
    // so that we know if we need to update the <select>'s
    // v-model when the option list has changed.
    // because v-model has a lower priority than v-for,
    // the v-model is not bound here yet, so we have to
    // retrive it in the actual updateModel() function.
    var tag = this.el.tagName
    this.isOption =
      (tag === 'OPTION' || tag === 'OPTGROUP') &&
      this.el.parentNode.tagName === 'SELECT'

    // setup anchor nodes
    this.start = _.createAnchor('v-for-start')
    this.end = _.createAnchor('v-for-end')
    _.replace(this.el, this.end)
    _.before(this.start, this.end)

    // check for trackby param
    this.idKey = this.param('track-by')

    // check ref
    this.ref = _.findRef(this.el)

    // check for transition stagger
    var stagger = +this.param('stagger')
    this.enterStagger = +this.param('enter-stagger') || stagger
    this.leaveStagger = +this.param('leave-stagger') || stagger

    // cache
    this.cache = Object.create(null)

    // fragment factory
    this.factory = new FragmentFactory(this.vm, this.el)
  },

  update: function (data) {
    this.diff(data)
    this.updateRef()
    this.updateModel()
  },

  /**
   * Diff, based on new data and old data, determine the
   * minimum amount of DOM manipulations needed to make the
   * DOM reflect the new data Array.
   *
   * The algorithm diffs the new data Array by storing a
   * hidden reference to an owner vm instance on previously
   * seen data. This allows us to achieve O(n) which is
   * better than a levenshtein distance based algorithm,
   * which is O(m * n).
   *
   * @param {Array} data
   */

  diff: function (data) {
    // check if the Array was converted from an Object
    var item = data[0]
    var convertedFromObject = this.fromObject =
      isObject(item) &&
      item.hasOwnProperty('$key') &&
      item.hasOwnProperty('$value')

    var idKey = this.idKey
    var oldFrags = this.frags
    var frags = this.frags = new Array(data.length)
    var alias = this.alias
    var start = this.start
    var end = this.end
    var inDoc = _.inDoc(start)
    var init = !oldFrags
    var i, l, frag, key, value, primitive

    // First pass, go through the new Array and fill up
    // the new frags array. If a piece of data has a cached
    // instance for it, we reuse it. Otherwise build a new
    // instance.
    for (i = 0, l = data.length; i < l; i++) {
      item = data[i]
      key = convertedFromObject ? item.$key : null
      value = convertedFromObject ? item.$value : item
      primitive = !isObject(value)
      frag = !init && this.getCachedFrag(value, i, key)
      if (frag) { // reusable fragment
        frag.reused = true
        // update $index
        frag.scope.$index = i
        // update $key
        if (key) {
          frag.scope.$key = key
        }
        // update data for track-by, object repeat &
        // primitive values.
        if (idKey || convertedFromObject || primitive) {
          frag.scope[alias] = value
        }
      } else { // new isntance
        frag = this.create(value, alias, i, key)
        frag.fresh = !init
      }
      frags[i] = frag
      if (init) {
        frag.before(end)
      }
    }

    // we're done for the initial render.
    if (init) {
      return
    }

    // Second pass, go through the old fragments and
    // destroy those who are not reused (and remove them
    // from cache)
    var removalIndex = 0
    var totalRemoved = oldFrags.length - frags.length
    for (i = 0, l = oldFrags.length; i < l; i++) {
      frag = oldFrags[i]
      if (!frag.reused) {
        this.deleteCachedFrag(frag)
        this.remove(frag, removalIndex++, totalRemoved, inDoc)
      }
    }

    // Final pass, move/insert new fragments into the
    // right place.
    var targetPrev, prevEl, currentPrev
    var insertionIndex = 0
    for (i = 0, l = frags.length; i < l; i++) {
      frag = frags[i]
      // this is the frag that we should be after
      targetPrev = frags[i - 1]
      prevEl = targetPrev
        ? targetPrev.staggerCb
          ? targetPrev.staggerAnchor
          : targetPrev.end || targetPrev.node
        : start
      if (frag.reused && !frag.staggerCb) {
        currentPrev = findPrevFrag(frag, start, this.id)
        if (currentPrev !== targetPrev) {
          this.move(frag, prevEl)
        }
      } else {
        // new instance, or still in stagger.
        // insert with updated stagger index.
        this.insert(frag, insertionIndex++, prevEl, inDoc)
      }
      frag.reused = frag.fresh = false
    }
  },

  /**
   * Create a new fragment instance.
   *
   * @param {*} value
   * @param {String} alias
   * @param {Number} index
   * @param {String} [key]
   * @return {Fragment}
   */

  create: function (value, alias, index, key) {
    var host = this._host
    // create iteration scope
    var parentScope = this._scope || this.vm
    var scope = Object.create(parentScope)
    // ref holder for the scope
    scope.$refs = {}
    scope.$els = {}
    // make sure point $parent to parent scope
    scope.$parent = parentScope
    // for two-way binding on alias
    scope.$forContext = this
    // define scope properties
    _.defineReactive(scope, alias, value)
    _.defineReactive(scope, '$index', index)
    if (key) {
      _.defineReactive(scope, '$key', key)
    } else if (scope.$key) {
      // avoid accidental fallback
      _.define(scope, '$key', null)
    }
    var frag = this.factory.create(host, scope, this._frag)
    frag.forId = this.id
    this.cacheFrag(value, frag, index, key)
    return frag
  },

  /**
   * Update the v-ref on owner vm.
   */

  updateRef: function () {
    var ref = this.ref
    if (!ref) return
    var hash = (this._scope || this.vm).$refs
    var refs
    if (!this.fromObject) {
      refs = this.frags.map(findVmFromFrag)
    } else {
      refs = {}
      this.frags.forEach(function (frag) {
        refs[frag.scope.$key] = findVmFromFrag(frag)
      })
    }
    if (!hash.hasOwnProperty(ref)) {
      _.defineReactive(hash, ref, refs)
    } else {
      hash[ref] = refs
    }
  },

  /**
   * For option lists, update the containing v-model on
   * parent <select>.
   */

  updateModel: function () {
    if (this.isOption) {
      var parent = this.start.parentNode
      var model = parent && parent.__v_model
      if (model) {
        model.forceUpdate()
      }
    }
  },

  /**
   * Insert a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Node} prevEl
   * @param {Boolean} inDoc
   */

  insert: function (frag, index, prevEl, inDoc) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel()
      frag.staggerCb = null
    }
    var staggerAmount = this.getStagger(frag, index, null, 'enter')
    if (inDoc && staggerAmount) {
      // create an anchor and insert it synchronously,
      // so that we can resolve the correct order without
      // worrying about some elements not inserted yet
      var anchor = frag.staggerAnchor
      if (!anchor) {
        anchor = frag.staggerAnchor = _.createAnchor('stagger-anchor')
        anchor.__vfrag__ = frag
      }
      _.after(anchor, prevEl)
      var op = frag.staggerCb = _.cancellable(function () {
        frag.staggerCb = null
        frag.before(anchor)
        _.remove(anchor)
      })
      setTimeout(op, staggerAmount)
    } else {
      frag.before(prevEl.nextSibling)
    }
  },

  /**
   * Remove a fragment. Handles staggering.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {Boolean} inDoc
   */

  remove: function (frag, index, total, inDoc) {
    if (frag.staggerCb) {
      frag.staggerCb.cancel()
      frag.staggerCb = null
      // it's not possible for the same frag to be removed
      // twice, so if we have a pending stagger callback,
      // it means this frag is queued for enter but removed
      // before its transition started. Since it is already
      // destroyed, we can just leave it in detached state.
      return
    }
    var staggerAmount = this.getStagger(frag, index, total, 'leave')
    if (inDoc && staggerAmount) {
      var op = frag.staggerCb = _.cancellable(function () {
        frag.staggerCb = null
        frag.remove(true)
      })
      setTimeout(op, staggerAmount)
    } else {
      frag.remove(true)
    }
  },

  /**
   * Move a fragment to a new position.
   * Force no transition.
   *
   * @param {Fragment} frag
   * @param {Node} prevEl
   */

  move: function (frag, prevEl) {
    frag.before(prevEl.nextSibling, false)
  },

  /**
   * Cache a fragment using track-by or the object key.
   *
   * @param {*} value
   * @param {Fragment} frag
   * @param {Number} index
   * @param {String} [key]
   */

  cacheFrag: function (value, frag, index, key) {
    var idKey = this.idKey
    var cache = this.cache
    var primitive = !isObject(value)
    var id
    if (key || idKey || primitive) {
      id = idKey
        ? idKey === '$index'
          ? index
          : value[idKey]
        : (key || value)
      if (!cache[id]) {
        cache[id] = frag
      } else if (idKey !== '$index') {
        process.env.NODE_ENV !== 'production' &&
        this.warnDuplicate(value)
      }
    } else {
      id = this.id
      if (value.hasOwnProperty(id)) {
        if (value[id] === null) {
          value[id] = frag
        } else {
          process.env.NODE_ENV !== 'production' &&
          this.warnDuplicate(value)
        }
      } else {
        _.define(value, id, frag)
      }
    }
    frag.raw = value
  },

  /**
   * Get a cached fragment from the value/index/key
   *
   * @param {*} value
   * @param {Number} index
   * @param {String} key
   * @return {Fragment}
   */

  getCachedFrag: function (value, index, key) {
    var idKey = this.idKey
    var primitive = !isObject(value)
    var frag
    if (key || idKey || primitive) {
      var id = idKey
        ? idKey === '$index'
          ? index
          : value[idKey]
        : (key || value)
      frag = this.cache[id]
    } else {
      frag = value[this.id]
    }
    if (frag && (frag.reused || frag.fresh)) {
      process.env.NODE_ENV !== 'production' &&
      this.warnDuplicate(value)
    }
    return frag
  },

  /**
   * Delete a fragment from cache.
   *
   * @param {Fragment} frag
   */

  deleteCachedFrag: function (frag) {
    var value = frag.raw
    var idKey = this.idKey
    var scope = frag.scope
    var index = scope.$index
    // fix #948: avoid accidentally fall through to
    // a parent repeater which happens to have $key.
    var key = scope.hasOwnProperty('$key') && scope.$key
    var primitive = !isObject(value)
    if (idKey || key || primitive) {
      var id = idKey
        ? idKey === '$index'
          ? index
          : value[idKey]
        : (key || value)
      this.cache[id] = null
    } else {
      value[this.id] = null
      frag.raw = null
    }
  },

  /**
   * Get the stagger amount for an insertion/removal.
   *
   * @param {Fragment} frag
   * @param {Number} index
   * @param {Number} total
   * @param {String} type
   */

  getStagger: function (frag, index, total, type) {
    type = type + 'Stagger'
    var trans = frag.node.__v_trans
    var hooks = trans && trans.hooks
    var hook = hooks && (hooks[type] || hooks.stagger)
    return hook
      ? hook.call(frag, index, total)
      : index * this[type]
  },

  /**
   * Pre-process the value before piping it through the
   * filters. This is passed to and called by the watcher.
   */

  _preProcess: function (value) {
    // regardless of type, store the un-filtered raw value.
    this.rawValue = value
    return value
  },

  /**
   * Post-process the value after it has been piped through
   * the filters. This is passed to and called by the watcher.
   *
   * It is necessary for this to be called during the
   * wathcer's dependency collection phase because we want
   * the v-for to update when the source Object is mutated.
   */

  _postProcess: function (value) {
    if (_.isArray(value)) {
      return value
    } else if (_.isPlainObject(value)) {
      // convert plain object to array.
      var keys = Object.keys(value)
      var i = keys.length
      var res = new Array(i)
      var key
      while (i--) {
        key = keys[i]
        res[i] = {
          $key: key,
          $value: value[key]
        }
      }
      return res
    } else {
      var type = typeof value
      if (type === 'number') {
        value = range(value)
      } else if (type === 'string') {
        value = _.toArray(value)
      }
      return value || []
    }
  },

  unbind: function () {
    if (this.ref) {
      (this._scope || this.vm).$refs[this.ref] = null
    }
    if (this.frags) {
      var i = this.frags.length
      var frag
      while (i--) {
        frag = this.frags[i]
        this.deleteCachedFrag(frag)
        frag.destroy()
      }
    }
  }
}

/**
 * Helper to find the previous element that is a fragment
 * anchor. This is necessary because a destroyed frag's
 * element could still be lingering in the DOM before its
 * leaving transition finishes, but its inserted flag
 * should have been set to false so we can skip them.
 *
 * If this is a block repeat, we want to make sure we only
 * return frag that is bound to this v-for. (see #929)
 *
 * @param {Fragment} frag
 * @param {Comment|Text} anchor
 * @param {String} id
 * @return {Fragment}
 */

function findPrevFrag (frag, anchor, id) {
  var el = frag.node.previousSibling
  /* istanbul ignore if */
  if (!el) return
  frag = el.__vfrag__
  while (
    (!frag || frag.forId !== id || !frag.inserted) &&
    el !== anchor
  ) {
    el = el.previousSibling
    /* istanbul ignore if */
    if (!el) return
    frag = el.__vfrag__
  }
  return frag
}

/**
 * Find a vm from a fragment.
 *
 * @param {Fragment} frag
 * @return {Vue|undefined}
 */

function findVmFromFrag (frag) {
  return frag.node.__vue__ || frag.node.nextSibling.__vue__
}

/**
 * Create a range array from given number.
 *
 * @param {Number} n
 * @return {Array}
 */

function range (n) {
  var i = -1
  var ret = new Array(n)
  while (++i < n) {
    ret[i] = i
  }
  return ret
}

if (process.env.NODE_ENV !== 'production') {
  module.exports.warnDuplicate = function (value) {
    _.warn(
      'Duplicate value found in v-for="' + this.descriptor.raw + '": ' +
      JSON.stringify(value) + '. Use track-by="$index" if ' +
      'you are expecting duplicate values.'
    )
  }
}
