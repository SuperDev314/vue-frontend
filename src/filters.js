var utils    = require('./utils'),
    get      = utils.get,
    slice    = [].slice,
    QUOTE_RE = /^'.*'$/

var keyCodes = {
    enter    : 13,
    tab      : 9,
    'delete' : 46,
    up       : 38,
    left     : 37,
    right    : 39,
    down     : 40,
    esc      : 27
}

/**
 *  String contain helper
 */
function contains (val, search) {
    /* jshint eqeqeq: false */
    if (utils.typeOf(val) === 'Object') {
        for (var key in val) {
            if (contains(val[key], search)) {
                return true
            }
        }
    } else if (val != null) {
        return val.toString().toLowerCase().indexOf(search) > -1
    }
}

/**
 *  Test whether a string is in quotes,
 *  if yes return stripped string
 */
function stripQuotes (str) {
    if (QUOTE_RE.test(str)) {
        return str.slice(1, -1)
    }
}

var filters = module.exports = {

    /**
     *  'abc' => 'Abc'
     */
    capitalize: function (value) {
        if (!value && value !== 0) return ''
        value = value.toString()
        return value.charAt(0).toUpperCase() + value.slice(1)
    },

    /**
     *  'abc' => 'ABC'
     */
    uppercase: function (value) {
        return (value || value === 0)
            ? value.toString().toUpperCase()
            : ''
    },

    /**
     *  'AbC' => 'abc'
     */
    lowercase: function (value) {
        return (value || value === 0)
            ? value.toString().toLowerCase()
            : ''
    },

    /**
     *  12345 => $12,345.00
     */
    currency: function (value, sign) {
        if (!value && value !== 0) return ''
        sign = sign || '$'
        var s = Math.floor(value).toString(),
            i = s.length % 3,
            h = i > 0 ? (s.slice(0, i) + (s.length > 3 ? ',' : '')) : '',
            f = '.' + value.toFixed(2).slice(-2)
        return sign + h + s.slice(i).replace(/(\d{3})(?=\d)/g, '$1,') + f
    },

    /**
     *  args: an array of strings corresponding to
     *  the single, double, triple ... forms of the word to
     *  be pluralized. When the number to be pluralized
     *  exceeds the length of the args, it will use the last
     *  entry in the array.
     *
     *  e.g. ['single', 'double', 'triple', 'multiple']
     */
    pluralize: function (value) {
        var args = slice.call(arguments, 1)
        return args.length > 1
            ? (args[value - 1] || args[args.length - 1])
            : (args[value - 1] || args[0] + 's')
    },

    /**
     *  A special filter that takes a handler function,
     *  wraps it so it only gets triggered on specific keypresses.
     */
    key: function (handler, key) {
        if (!handler) return
        var code = keyCodes[key]
        if (!code) {
            code = parseInt(key, 10)
        }
        return function (e) {
            if (e.keyCode === code) {
                handler.call(this, e)
            }
        }
    },

    filterBy: function (arr, searchKey, delimiter, dataKey) {

        // get the search string
        var search = stripQuotes(searchKey) || get(this, searchKey)
        if (!search) return arr
        search = search.toLowerCase()

        // get the optional dataKey
        dataKey = dataKey && (stripQuotes(dataKey) || get(this, dataKey))

        return arr.filter(function (item) {
            return dataKey
                ? contains(get(item, dataKey), search)
                : contains(item, search)
        })

    },

    orderBy: function (arr, sortKey, reverseKey) {

        var key = stripQuotes(sortKey) || get(this, sortKey)
        if (!key) return arr

        var order = 1
        if (reverseKey) {
            if (reverseKey === '-1') {
                order = -1
            } else if (reverseKey.charAt(0) === '!') {
                reverseKey = reverseKey.slice(1)
                order = get(this, reverseKey) ? 1 : -1
            } else {
                order = get(this, reverseKey) ? -1 : 1
            }
        }

        // sort on a copy to avoid mutating original array
        return arr.slice().sort(function (a, b) {
            a = a[key]
            b = b[key]
            return a === b ? 0 : a > b ? order : -order
        })

    }

}

// mark computed filters
filters.filterBy.computed = true
filters.orderBy.computed = true