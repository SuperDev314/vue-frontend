var storageKey = 'todos-seedjs',
    storedData = JSON.parse(localStorage.getItem(storageKey))

Seed.controller('Todos', function (scope) {

    // regular properties -----------------------------------------------------
    scope.todos  = Array.isArray(storedData) ? storedData : []
    scope.filter = location.hash.slice(2) || 'all'
    scope.remaining = scope.todos.reduce(function (n, todo) {
        return n + (todo.completed ? 0 : 1)
    }, 0)

    // computed properties ----------------------------------------------------
    scope.total = {get: function () {
        return scope.todos.length
    }}

    scope.completed = {get: function () {
        return scope.total - scope.remaining
    }}

    scope.itemLabel = {get: function () {
        return scope.remaining > 1 ? 'items' : 'item'
    }}

    scope.allDone = {
        get: function () {
            return scope.remaining === 0
        },
        set: function (value) {
            scope.todos.forEach(function (todo) {
                todo.completed = value
            })
            scope.remaining = value ? 0 : scope.total
        }
    }

    // event handlers ---------------------------------------------------------
    scope.addTodo = function (e) {
        if (e.el.value) {
            scope.todos.unshift({ title: e.el.value, completed: false })
            e.el.value = ''
            scope.remaining++
        }
    }

    scope.removeTodo = function (e) {
        scope.todos.remove(e.scope)
        scope.remaining -= e.scope.completed ? 0 : 1
    }

    scope.updateCount = function (e) {
        scope.remaining += e.scope.completed ? -1 : 1
    }

    scope.edit = function (e) {
        e.scope.editing = true
    }

    scope.stopEdit = function (e) {
        e.scope.editing = false
    }

    scope.removeCompleted = function () {
        if (scope.completed === 0) return
        scope.todos = scope.todos.filter(function (todo) {
            return !todo.completed
        })
    }

    // listen for hash change
    window.addEventListener('hashchange', function () {
        scope.filter = location.hash.slice(2)
    })

    // persist data on leave
    window.addEventListener('beforeunload', function () {
        localStorage.setItem(storageKey, scope.$serialize('todos'))
    })

})

Seed.bootstrap({ debug: true })