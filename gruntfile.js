var sauceConfig = require('./build/saucelabs-config')

module.exports = function (grunt) {

  grunt.initConfig({

    version: grunt.file.readJSON('package.json').version,

    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        jshintrc: true
      },
      build: {
        src: ['gruntfile.js', 'tasks/*.js']
      },
      src: {
        src: 'src/**/*.js'
      },
      test: {
        src: ['test/unit/specs/**/*.js', 'test/e2e/*.js']
      }
    },

    karma: {
      options: {
        frameworks: ['jasmine', 'commonjs'],
        files: [
          'test/unit/lib/util.js',
          'test/unit/lib/jquery.js',
          'src/**/*.js',
          'test/unit/specs/**/*.js'
        ],
        preprocessors: {
          'src/**/*.js': ['commonjs'],
          'test/unit/specs/**/*.js': ['commonjs']
        },
        singleRun: true
      },
      browsers: {
        options: {
          browsers: ['Chrome', 'Firefox', 'Safari'],
          reporters: ['progress']
        }
      },
      coverage: {
        options: {
          browsers: ['PhantomJS'],
          reporters: ['progress', 'coverage'],
          preprocessors: {
            'src/**/*.js': ['commonjs', 'coverage'],
            'test/unit/specs/**/*.js': ['commonjs']
          },
          coverageReporter: {
            reporters: [
              { type: 'lcov', subdir: '.' },
              { type: 'text-summary' }
            ]
          }
        }
      },
      sauce1: {
        options: sauceConfig.batch1
      },
      sauce2: {
        options: sauceConfig.batch2
      },
      sauce3: {
        options: sauceConfig.batch3
      }
    }

  })

  // load npm tasks
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-karma')

  // load custom tasks
  require('./build/grunt-tasks/build')(grunt)
  require('./build/grunt-tasks/casper')(grunt)
  require('./build/grunt-tasks/codecov')(grunt)
  require('./build/grunt-tasks/release')(grunt)
  require('./build/grunt-tasks/open')(grunt)

  // register composite tasks
  grunt.registerTask('unit', ['karma:browsers'])
  grunt.registerTask('cover', ['karma:coverage'])
  grunt.registerTask('test', ['unit', 'cover', 'casper'])
  grunt.registerTask('sauce', ['karma:sauce1', 'karma:sauce2', 'karma:sauce3'])
  grunt.registerTask('ci', ['jshint', 'cover', 'codecov', 'build', 'casper', 'sauce'])
  grunt.registerTask('default', ['jshint', 'build', 'test'])

}
