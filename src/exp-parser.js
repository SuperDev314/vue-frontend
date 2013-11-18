var utils = require('./utils')

// Variable extraction scooped from https://github.com/RubyLouvre/avalon

var KEYWORDS =
        // keywords
        'break,case,catch,continue,debugger,default,delete,do,else,false' +
        ',finally,for,function,if,in,instanceof,new,null,return,switch,this' +
        ',throw,true,try,typeof,var,void,while,with,undefined' +
        // reserved
        ',abstract,boolean,byte,char,class,const,double,enum,export,extends' +
        ',final,float,goto,implements,import,int,interface,long,native' +
        ',package,private,protected,public,short,static,super,synchronized' +
        ',throws,transient,volatile' +
        // ECMA 5 - use strict
        ',arguments,let,yield',
        
    KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g'),
    REMOVE_RE   = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g,
    SPLIT_RE    = /[^\w$]+/g,
    NUMBER_RE   = /\b\d[^,]*/g,
    BOUNDARY_RE = /^,+|,+$/g

/**
 *  Strip top level variable names from a snippet of JS expression
 */
function getVariables (code) {
    code = code
        .replace(REMOVE_RE, '')
        .replace(SPLIT_RE, ',')
        .replace(KEYWORDS_RE, '')
        .replace(NUMBER_RE, '')
        .replace(BOUNDARY_RE, '')
    return code
        ? code.split(/,+/)
        : []
}

/**
 *  Based on top level variables, extract full keypaths accessed.
 *  We need full paths because we need to define them in the compiler's
 *  bindings, so that they emit 'get' events during dependency tracking.
 */
// function getPaths (code, vars) {
//     var pathRE = new RegExp("\\b(" + vars.join('|') + ")[$\\w\\.]*\\b", 'g')
//     return code.match(pathRE)
// }

function filterUnique (vars) {
    var hash = utils.hash(),
        i = vars.length,
        key
    while (i--) {
        key = vars[i]
        if (hash[key]) continue
        hash[key] = 1
    }
    return Object.keys(hash)
}

/**
 *  Create a function from a string...
 *  this looks like evil magic but since all variables are limited
 *  to the VM's scope it's actually properly sandboxed
 */
function makeGetter (exp, raw) {
    /* jshint evil: true */
    var fn
    try {
        fn = new Function(exp)
    } catch (e) {
        utils.warn('Invalid expression: ' + raw)
    }
    return fn
}

module.exports = {

    /**
     *  Parse and return an anonymous computed property getter function
     *  from an arbitrary expression, together with a list of paths to be
     *  created as bindings.
     */
    parse: function (exp) {
        // extract variable names
        var vars = getVariables(exp)
        if (!vars.length) {
            return {
                getter: makeGetter('return ' + exp, exp)
            }
        }
        console.log(vars)
        vars = filterUnique(vars)
        // var args = [],
        //     v, i, keyPrefix,
        //     l = vars.length,
        //     hash = Object.create(null)
        // for (i = 0; i < l; i++) {
        //     v = vars[i]
        //     // avoid duplicate keys
        //     if (hash[v]) continue
        //     hash[v] = v
        //     // push assignment
        //     keyPrefix = v.charAt(0)
        //     args.push(v + (
        //         (keyPrefix === '$' || keyPrefix === '_')
        //             ? '=this.' + v
        //             : '=this.$get("' + v + '")'
        //         ))
        // }
        // args = 'var ' + args.join(',') + ';return ' + exp
        var pathRE = new RegExp("\\b(" + vars.join('|') + ")[$\\w\\.]*\\b", 'g'),
            paths  = exp.match(pathRE),
            body   = 'return ' + exp.replace(pathRE, 'this.$&')
        console.log(paths, body)
        return {
            getter: makeGetter(body, exp),
            paths: paths
        }
    }
}