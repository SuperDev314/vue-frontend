var lang   = require('./lang')
var extend = lang.extend

extend(exports, lang)
extend(exports, require('./env'))
extend(exports, require('./dom'))
extend(exports, require('./option'))
extend(exports, require('./debug'))