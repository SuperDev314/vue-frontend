var Observer = require('../../../src/observer')
var _ = require('../../../src/util')

describe('Observer', function () {

  var spy
  beforeEach(function () {
    spy = jasmine.createSpy('observer')
  })

  it('create on non-observables', function () {
    // skip primitive value
    var ob = Observer.create(1)
    expect(ob).toBeUndefined()
    // avoid vue instance
    ob = Observer.create(new _.Vue())
    expect(ob).toBeUndefined()
  })

  it('create on object', function () {
    // on object
    var obj = {
      a: {},
      b: {}
    }
    var ob = Observer.create(obj)
    expect(ob instanceof Observer).toBe(true)
    expect(ob.active).toBe(true)
    expect(ob.value).toBe(obj)
    expect(obj.__ob__).toBe(ob)
    // should've walked children
    expect(obj.a.__ob__ instanceof Observer).toBe(true)
    expect(obj.b.__ob__ instanceof Observer).toBe(true)
    // should return existing ob on already observed objects
    var ob2 = Observer.create(obj)
    expect(ob2).toBe(ob)
  })

  it('create on array', function () {
    // on object
    var arr = [{}, {}]
    var ob = Observer.create(arr)
    expect(ob instanceof Observer).toBe(true)
    expect(ob.active).toBe(true)
    expect(ob.value).toBe(arr)
    expect(arr.__ob__).toBe(ob)
    // should've walked children
    expect(arr[0].__ob__ instanceof Observer).toBe(true)
    expect(arr[1].__ob__ instanceof Observer).toBe(true)
  })

  it('observing object prop change', function () {
    var obj = { a: { b: 2 } }
    Observer.create(obj)
    // mock a watcher!
    var watcher = {
      deps: [],
      addDep: function (binding) {
        this.deps.push(binding)
        binding.addSub(this)
      },
      update: jasmine.createSpy()
    }
    var dump
    // collect dep
    Observer.target = watcher
    dump = obj.a.b
    Observer.target = null
    expect(watcher.deps.length).toBe(2)
    dump = obj.a.b = 3
    expect(watcher.update.calls.count()).toBe(1)
    // swap object
    obj.a = { b: 4 }
    expect(watcher.update.calls.count()).toBe(2)
    // recollect dep
    var oldDeps = watcher.deps
    watcher.deps = []
    Observer.target = watcher
    dump = obj.a.b
    Observer.target = null
    expect(watcher.deps.length).toBe(2)
    // make sure we picked up the new bindings
    expect(watcher.deps[0]).not.toBe(oldDeps[0])
    expect(watcher.deps[1]).not.toBe(oldDeps[1])
    // set on the swapped object
    obj.a.b = 5
    expect(watcher.update.calls.count()).toBe(3)
  })

  it('observing $add/$delete', function () {
    var obj = { a: 1 }
    var ob = Observer.create(obj)
    var binding = ob.binding
    spyOn(binding, 'notify')
    obj.$add('b', 2)
    expect(obj.b).toBe(2)
    expect(binding.notify.calls.count()).toBe(1)
    obj.$delete('a')
    expect(obj.hasOwnProperty('a')).toBe(false)
    expect(binding.notify.calls.count()).toBe(2)
    // should ignore adding an existing key
    obj.$add('b', 3)
    expect(obj.b).toBe(2)
    expect(binding.notify.calls.count()).toBe(2)
    // should ignore deleting non-existing key
    obj.$delete('a')
    expect(binding.notify.calls.count()).toBe(2)
  })

  it('observing array mutation', function () {
    var arr = []
    var ob = Observer.create(arr)
    var binding = ob.binding
    spyOn(binding, 'notify')
    var objs = [{}, {}, {}]
    arr.push(objs[0])
    arr.pop()
    arr.unshift(objs[1])
    arr.shift()
    arr.splice(0, 0, objs[2])
    arr.sort()
    arr.reverse()
    expect(binding.notify.calls.count()).toBe(7)
    // inserted elements should be observed
    objs.forEach(function (obj) {
      expect(obj.__ob__ instanceof Observer).toBe(true)
    })
  })

  it('array $set', function () {
    var arr = [1]
    var ob = Observer.create(arr)
    var binding = ob.binding
    spyOn(binding, 'notify')
    arr.$set(0, 2)
    expect(arr[0]).toBe(2)
    expect(binding.notify.calls.count()).toBe(1)
    // setting out of bound index
    arr.$set(2, 3)
    expect(arr[2]).toBe(3)
    expect(binding.notify.calls.count()).toBe(2)
  })

  it('array $remove', function () {
    var arr = [{}, {}]
    var obj1 = arr[0]
    var obj2 = arr[1]
    var ob = Observer.create(arr)
    var binding = ob.binding
    spyOn(binding, 'notify')
    // remove by index
    arr.$remove(0)
    expect(arr.length).toBe(1)
    expect(arr[0]).toBe(obj2)
    expect(binding.notify.calls.count()).toBe(1)
    // remove by identity, not in array
    arr.$remove(obj1)
    expect(arr.length).toBe(1)
    expect(arr[0]).toBe(obj2)
    expect(binding.notify.calls.count()).toBe(1)
    // remove by identity, in array
    arr.$remove(obj2)
    expect(arr.length).toBe(0)
    expect(binding.notify.calls.count()).toBe(2)
  })

})