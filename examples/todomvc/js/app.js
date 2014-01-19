var app = new Vue({

    el: '#todoapp',

    directives: {
        'todo-focus': function (value) {
            if (value) {
                var el = this.el
                setTimeout(function () { el.focus() }, 0)
            }
        }
    },

    created: function () {
        this.filters = {
            all: function (todo) { todo.completed; return true },
            active: function (todo) { return !todo.completed },
            completed: function (todo) { return todo.completed }
        }
        this.updateFilter()
        window.addEventListener('hashchange', function () {
            app.updateFilter()
        })
        this.remaining = this.todos.filter(function (todo) {
            return !todo.completed
        }).length
    },

    data: {
        todos: todoStorage.fetch(),
        allDone: {
            $get: function () {
                return this.remaining === 0
            },
            $set: function (value) {
                this.todos.forEach(function (todo) {
                    todo.completed = value
                })
                this.remaining = value ? 0 : this.todos.length
                todoStorage.save()
            }
        }
    },

    methods: {

        updateFilter: function () {
            var filter = location.hash.slice(2)
            this.filter = (filter in this.filters) ? filter : 'all'
            this.filterTodo = this.filters[this.filter]
        },

        addTodo: function () {
            var value = this.newTodo && this.newTodo.trim()
            if (value) {
                this.todos.unshift({ title: value, completed: false })
                this.newTodo = ''
                this.remaining++
                todoStorage.save()
            }
        },

        removeTodo: function (todo) {
            this.todos.remove(todo.$data)
            this.remaining -= todo.completed ? 0 : 1
            todoStorage.save()
        },

        toggleTodo: function (todo) {
            this.remaining += todo.completed ? -1 : 1
            todoStorage.save()
        },

        editTodo: function (todo) {
            this.beforeEditCache = todo.title
            this.editedTodo = todo
        },

        doneEdit: function (todo) {
            if (!this.editedTodo) return
            this.editedTodo = null
            todo.title = todo.title.trim()
            if (!todo.title) this.removeTodo(todo)
            todoStorage.save()
        },

        cancelEdit: function (todo) {
            this.editedTodo = null
            todo.title = this.beforeEditCache
        },
        
        removeCompleted: function () {
            this.todos.remove(function (todo) {
                return todo.completed
            })
            todoStorage.save()
        }
    }
})