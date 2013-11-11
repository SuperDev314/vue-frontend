var config   = require('./config'),
    // TODO: sniff proper transitonend event name
    endEvent = 'transitionend'

/**
 *  stage:
 *  1 = enter
 *  2 = leave
 */
module.exports = function (el, stage, changeState, init) {

    var className = el.sd_transition

    // in sd-repeat, the sd-transition directive
    // might not have been processed yet
    if (!className) {
        className = el.getAttribute(config.prefix + '-transition')
    }

    // TODO: optional duration which
    // can override the default transitionend event

    // if no transition, just
    if (init || !className) {
        return changeState()
    }

    var cl = el.classList

    if (stage > 0) { // enter
        cl.add(className)
        changeState()
        setTimeout(function () {
            cl.remove(className)
        }, 0)
    } else { // leave
        cl.add(className)
        el.addEventListener(endEvent, onEnd)
    }

    function onEnd () {
        el.removeEventListener(endEvent, onEnd)
        changeState()
    }
}