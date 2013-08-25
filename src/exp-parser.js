// Variable extraction scooped from https://github.com/RubyLouvre/avalon 
var KEYWORDS =
        // keywords
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'
        // reserved
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'
        // ECMA 5 - use strict
        + ',arguments,let,yield'
        + ',undefined',
    KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g'),
    REMOVE_RE   = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g,
    SPLIT_RE    = /[^\w$]+/g,
    NUMBER_RE   = /\b\d[^,]*/g,
    BOUNDARY_RE = /^,+|,+$/g

function getVariables (code) {
    code = code
        .replace(REMOVE_RE, '')
        .replace(SPLIT_RE, ',')
        .replace(KEYWORDS_RE, '')
        .replace(NUMBER_RE, '')
        .replace(BOUNDARY_RE, '')
    code = code ? code.split(/,+/) : []
    return code
}

module.exports = {

    /*
     *  Parse and create an anonymous computed property getter function
     *  from an arbitrary expression.
     */
    parseGetter: function (exp, compiler) {
        // extract variable names
        var vars = getVariables(exp)
        if (!vars.length) return null
        var args = [],
            v, i = vars.length,
            hash = {}
        while (i--) {
            v = vars[i]
            // avoid duplicate keys
            if (hash[v]) continue
            hash[v] = 1
            // push assignment
            args.push(v + '=this.$get("' + v + '")')
            // need to create the binding if it does not exist yet
            if (!compiler.bindings[v]) {
                compiler.rootCompiler.createBinding(v)
            }
        }
        args = 'var ' + args.join(',') + ';return ' + exp
        /* jshint evil: true */
        return new Function(args)
    }
}