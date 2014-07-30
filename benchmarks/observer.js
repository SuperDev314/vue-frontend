console.log('\nObserver\n')

var done = null
var Observer = require('../src/observe/observer')
var Emitter = require('../src/emitter')
var OldObserver = require('../../vue/src/observer')
var sideEffect = true
var runs = 1000
function cb () {
  sideEffect = !sideEffect
}

function now () {
  return window.performence
    ? window.performence.now()
    : Date.now()
}

var queue = []

function bench (desc, fac, run) {
  queue.push(function () {
    var objs = []
    for (var i = 0; i < runs; i++) {
      objs.push(fac(i))
    }
    var s = now()
    for (var i = 0; i < runs; i++) {
      run(objs[i])
    }
    var passed = now() - s
    console.log(desc + ' - ' + (16 / (passed / runs)).toFixed(2) + ' ops/frame')
  })  
}

function run () {
  queue.shift()()
  if (queue.length) {
    setTimeout(run, 0)
  } else {
    done && done()
  }
}

bench(
  'observe (simple object)        ',
  function (i) {
    return {a:i}
  },
  function (o) {
    new Observer().observe('', o)
  }
)

bench(
  'observe (simple object) old    ',
  function (i) {
    return {a:i}
  },
  function (o) {
    OldObserver.observe(o, '', new Emitter())
  }
)

bench(
  'observe (3 nested objects)     ',
  function (i) {
    return {a:{b:{c:i}}}
  },
  function (o) {
    new Observer().observe('', o)
  }
)

bench(
  'observe (3 nested objects) old ',
  function (i) {
    return {a:{b:{c:i}}}
  },
  function (o) {
    OldObserver.observe(o, '', new Emitter())
  }
)

bench(
  'observe (array, 3 objects)     ',
  function (i) {
    return [{a:i}, {a:i+1}, {a:i+2}]
  },
  function (o) {
    new Observer().observe('', o)
  }
)

bench(
  'observe (array, 3 objects) old ',
  function (i) {
    return [{a:i}, {a:i+1}, {a:i+2}]
  },
  function (o) {
    OldObserver.observe(o, '', new Emitter())
  }
)

bench(
  'observe (array, 30 objects)    ',
  function () {
    var a = [], i = 30
    while (i--) {
      a.push({a:i})
    }
    return a
  },
  function (o) {
    new Observer().observe('', o)
  }
)

bench(
  'observe (array, 30 objects) old',
  function () {
    var a = [], i = 30
    while (i--) {
      a.push({a:i})
    }
    return a
  },
  function (o) {
    OldObserver.observe(o, '', new Emitter())
  }
)

Observer.emitGet = true
OldObserver.shouldGet = true

bench(
  'simple get    ',
  function () {
    var a = {a:1}
    var ob = new Observer()
    ob.observe('', a)
    ob.on('get', cb)
    return a
  },
  function (o) {
    var v = o.a
  }
)

bench(
  'simple get old',
  function () {
    var a = {a:1}
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('get', cb)
    return a
  },
  function (o) {
    var v = o.a
  }
)

bench(
  'nested get    ',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Observer()
    ob.observe('', a)
    ob.on('get', cb)
    return a
  },
  function (o) {
    var v = o.a.b.c
  }
)

bench(
  'nested get old',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('get', cb)
    return a
  },
  function (o) {
    var v = o.a.b.c
  }
)

Observer.emitGet = false
OldObserver.shouldGet = false

bench(
  'simple set    ',
  function () {
    var a = {a:1}
    var ob = new Observer()
    ob.observe('', a)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a = 12345
  }
)

bench(
  'simple set old',
  function () {
    var a = {a:1}
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a = 12345
  }
)

bench(
  'nested set    ',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Observer()
    ob.observe('', a)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a.b.c = 2
  }
)

bench(
  'nested set old',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a.b.c = 2
  }
)

bench(
  'swap set      ',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Observer()
    ob.observe('', a)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a = {b:{c:2}}
  }
)

bench(
  'swap set old  ',
  function () {
    var a = {a:{b:{c:1}}}
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('set', cb)
    return a
  },
  function (o) {
    o.a = {b:{c:2}}
  }
)

bench(
  'array push    ',
  function () {
    var a = []
    var ob = new Observer()
    ob.observe('', a)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.push({a:1})
  }
)

bench(
  'array push old',
  function () {
    var a = []
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.push({a:1})
  }
)

bench(
  'array reverse (5 objects)     ',
  function () {
    var a = [], i = 5
    while (i--) {
      a.push({a:i})
    }
    var ob = new Observer()
    ob.observe('', a)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.reverse()
  }
)

bench(
  'array reverse (5 objects) old ',
  function () {
    var a = [], i = 5
    while (i--) {
      a.push({a:i})
    }
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.reverse()
  }
)

bench(
  'array reverse (50 objects)    ',
  function () {
    var a = [], i = 50
    while (i--) {
      a.push({a:i})
    }
    var ob = new Observer()
    ob.observe('', a)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.reverse()
  }
)

bench(
  'array reverse (50 objects) old',
  function () {
    var a = [], i = 50
    while (i--) {
      a.push({a:i})
    }
    var ob = new Emitter()
    OldObserver.observe(a, '', ob)
    ob.on('mutation', cb)
    return a
  },
  function (o) {
    o.reverse()
  }
)

exports.run = function (cb) {
  done = cb
  run()
}