/**
 * Build, update component.json, uglify, and report size.
 */

module.exports = function (grunt) {

  grunt.registerTask('build-vendor', function () {
    var webpack = require('webpack')
    webpack({
      entry: './node_modules/notevil/index.js',
      output: {
        path: './vendor',
        filename: 'notevil.js',
        library: 'notevil',
        libraryTarget: 'commonjs2'
      }
    }, this.async())
  })

  grunt.registerTask('build-self', function () {

    var done = this.async()
    var fs = require('fs')
    var zlib = require('zlib')
    var webpack = require('webpack')
    var uglifyjs = require('uglify-js')

    var banner =
        '/**\n' +
        ' * Vue.js v' + grunt.config.get('version') + '\n' +
        ' * (c) ' + new Date().getFullYear() + ' Evan You\n' +
        ' * Released under the MIT License.\n' +
        ' */\n'

    // build
    webpack({
      entry: './src/vue',
      output: {
        path: './dist',
        filename: 'vue.js',
        library: 'Vue',
        libraryTarget: 'umd'
      },
      plugins: [
        new webpack.BannerPlugin(banner, { raw: true })
      ]
    }, function (err, stats) {
      if (err) return done(err)
      minify()
    })

    function minify () {
      var js = fs.readFileSync('dist/vue.js', 'utf-8')
      report('dist/vue.js', js)
      // uglify
      var result = uglifyjs.minify(js, {
        fromString: true,
        output: {
          comments: /License/,
          ascii_only: true
        },
        compress: {
          pure_funcs: [
            'require',
            '_.log',
            '_.warn',
            '_.assertAsset',
            'enableDebug'
          ]
        }
      })
      // var min = grunt.config.get('banner') + result.code
      write('dist/vue.min.js', result.code)
      // report gzip size
      zlib.gzip(result.code, function (err, buf) {
        write('dist/vue.min.js.gz', buf)
        done(err)
      })
    }

    function write (path, file) {
      fs.writeFileSync(path, file)
      report(path, file)
    }

    function report (path, file) {
      console.log(
        blue(path + ': ') +
        (file.length / 1024).toFixed(2) + 'kb'
      )
    }

    function blue (str) {
      return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
    }
  })

  grunt.registerTask('build', ['build-vendor', 'build-self'])
}
