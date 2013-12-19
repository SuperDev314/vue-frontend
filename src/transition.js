var endEvent   = sniffTransitionEndEvent(),
    config     = require('./config'),
    enterClass = config.enterClass,
    leaveClass = config.leaveClass,
    // exit codes for testing
    codes = {
        CSS_E     : 1,
        CSS_L     : 2,
        JS_E      : 3,
        JS_L      : 4,
        CSS_SKIP  : -1,
        JS_SKIP   : -2,
        JS_SKIP_E : -3,
        JS_SKIP_L : -4,
        INIT      : -5,
        SKIP      : -6
    }

/**
 *  stage:
 *    1 = enter
 *    2 = leave
 */
var transition = module.exports = function (el, stage, changeState, compiler) {

    if (compiler.init) {
        changeState()
        return codes.INIT
    }

    var transitionId = el.vue_trans

    if (transitionId) {
        return applyTransitionFunctions(
            el,
            stage,
            changeState,
            transitionId,
            compiler
        )
    } else if (transitionId === '') {
        return applyTransitionClass(
            el,
            stage,
            changeState,
            compiler
        )
    } else {
        changeState()
        return codes.SKIP
    }

}

transition.codes = codes

/**
 *  Togggle a CSS class to trigger transition
 */
function applyTransitionClass (el, stage, changeState, compiler) {

    if (!endEvent) {
        changeState()
        return codes.CSS_SKIP
    }

    var classList         = el.classList,
        lastLeaveCallback = el.vue_trans_cb

    if (stage > 0) { // enter

        // cancel unfinished leave transition
        if (lastLeaveCallback) {
            el.removeEventListener(endEvent, lastLeaveCallback)
            el.vue_trans_cb = null
        }

        // set to hidden state before appending
        classList.add(enterClass)
        // append
        changeState()
        compiler.execHook('enteredView')
        // force a layout so transition can be triggered
        /* jshint unused: false */
        var forceLayout = el.clientHeight
        // trigger transition
        classList.remove(enterClass)
        return codes.CSS_E

    } else { // leave

        // trigger hide transition
        classList.add(leaveClass)
        var onEnd = function (e) {
            if (e.target === el) {
                el.removeEventListener(endEvent, onEnd)
                el.vue_trans_cb = null
                // actually remove node here
                changeState()
                classList.remove(leaveClass)
                compiler.execHook('leftView')
            }
        }
        // attach transition end listener
        el.addEventListener(endEvent, onEnd)
        el.vue_trans_cb = onEnd
        return codes.CSS_L
        
    }

}

function applyTransitionFunctions (el, stage, changeState, functionId, compiler) {

    var funcs = compiler.getOption('transitions', functionId)
    if (!funcs) {
        changeState()
        return codes.JS_SKIP
    }

    var enter = funcs.enter,
        leave = funcs.leave

    if (stage > 0) { // enter
        if (typeof enter !== 'function') {
            doEnter()
            return codes.JS_SKIP_E
        }
        enter(el, doEnter)
        return codes.JS_E
    } else { // leave
        if (typeof leave !== 'function') {
            doLeave()
            return codes.JS_SKIP_L
        }
        leave(el, doLeave)
        return codes.JS_L
    }

    function doEnter () {
        compiler.execHook('enteredView')
        changeState()
    }

    function doLeave () {
        compiler.execHook('leftView')
        changeState()
    }

}

/**
 *  Sniff proper transition end event name
 */
function sniffTransitionEndEvent () {
    var el = document.createElement('vue'),
        defaultEvent = 'transitionend',
        events = {
            'transition'       : defaultEvent,
            'mozTransition'    : defaultEvent,
            'webkitTransition' : 'webkitTransitionEnd'
        }
    for (var name in events) {
        if (el.style[name] !== undefined) {
            return events[name]
        }
    }
}