var baseURL = 'https://seed-demo.firebaseIO.com/',
    Users   = new Firebase(baseURL + 'users')

Users.on('child_added', function (snapshot) {
    var item = snapshot.val()
    item.id = snapshot.name()
    app.users.push(item)
})

Users.on('child_removed', function (snapshot) {
    var id = snapshot.name()
    app.users.some(function (user) {
        if (user.id === id) {
            app.users.remove(user)
            return true
        }
    })
})

var app = new Seed({
    el: '#app',
    filters: validators,
    scope: {
        users: [],
        newUser: {
            name: '',
            email: ''
        },
        validation: {
            name: false,
            email: false
        },
        isValid: {
            $get: function () {
                var valid = true
                for (var key in this.validation) {
                    if (!this.validation[key]) {
                        valid = false
                    }
                }
                return valid
            }
        },
        addUser: function (e) {
            e.preventDefault()
            if (this.isValid) {
                Users.push(this.newUser)
                this.newUser = {}
            }
        },
        removeUser: function (e) {
            new Firebase(baseURL + 'users/' + e.item.id).remove()
        }
    }
})