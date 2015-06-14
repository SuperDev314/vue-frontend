# CSP compliant build

This is the CSP-compliant build of Vue.js that does not use `new Function()` for expression evaluation. Note there's an additional limitation compared to the normal build: you cannot use any globals in expressions (e.g. `Date`, `parseInt` etc.).

---

<p align="center"><a href="http://vuejs.org" target="_blank"><img width="100"src="http://vuejs.org/images/logo.png"></a></p>

# Vue.js [![Build Status](https://travis-ci.org/yyx990803/vue.svg?branch=master)](https://travis-ci.org/yyx990803/vue) [![Selenium Test Status](https://saucelabs.com/buildstatus/vuejs)](https://saucelabs.com/u/vuejs) [![Coverage Status](https://img.shields.io/coveralls/yyx990803/vue.svg)](https://coveralls.io/r/yyx990803/vue?branch=master)

## Intro

Vue.js is a library for building interactive web interfaces. It provides data-reactive components with a simple and flexible API. Core features include:

- Two-way data binding
- Plain JavaScript objects as reactive models
- Component-oriented development style

Note that Vue.js only supports [ES5-compliant browsers](http://kangax.github.io/compat-table/es5/) (IE8 and below are not supported). To check out live examples and docs, visit [vuejs.org](http://vuejs.org). You can also start with this excellent screencast series on [Laracasts](https://laracasts.com/series/learning-vuejs).

## Questions

For questions and support please use the Gitter room: [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/yyx990803/vue) or submit issues at [vuejs/Discussion](https://github.com/vuejs/Discussion/issues). The issue list of this repo is **exclusively** for bug reports and feature requests.

## Issues

Please make sure to read the [Issue Reporting Checklist](https://github.com/yyx990803/vue/blob/dev/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.

## Contribution

Please make sure to read the [Contributing Guide](https://github.com/yyx990803/vue/blob/dev/CONTRIBUTING.md) before making a pull request. If you have a Vue-related project/component/tool, add it to [this list](https://github.com/yyx990803/vue/wiki/User-Contributed-Components-&-Tools)!

## Changelog

Details changes for each release are documented in the [release notes](https://github.com/yyx990803/vue/releases).

## Stay In Touch

- For latest releases and announcements, follow on Twitter: [@vuejs](https://twitter.com/vuejs)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Evan You
