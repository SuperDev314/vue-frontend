<p align="center"><a href="http://vuejs.org" target="_blank"><img width="100"src="http://vuejs.org/images/logo.png"></a></p>

# Vue.js [![Build Status](https://travis-ci.org/yyx990803/vue.png?branch=master)](https://travis-ci.org/yyx990803/vue) [![Selenium Test Status](https://saucelabs.com/buildstatus/vuejs)](https://saucelabs.com/u/vuejs) [![Coverage Status](https://coveralls.io/repos/yyx990803/vue/badge.png)](https://coveralls.io/r/yyx990803/vue)

> MVVM made simple.

## Introduction

Vue.js is a library for building interactive web interfaces. It provides the benefits of MVVM data binding and a composable component system with a simple and flexible API. You should try it out if you like:

- Intuitive API that simply makes sense
- Extendable Data bindings
- Plain JavaScript objects as models
- Building interface by composing reusable components
- Flexibility to mix & match small libraries for a custom front-end stack

It's really really easy to get started. Seriously, it's so easy:

``` html
<div id="demo">
    {{message}}
    <input v-model="message">
</div>
```

``` js
var demo = new Vue({
    el: '#demo',
    data: {
        message: 'Hello Vue.js!'
    }
})
```

To check out the live demo, guides and API reference, visit [vuejs.org](http://vuejs.org).

## Browser Support

Vue.js supports [most ECMAScript 5 compliant browsers](https://saucelabs.com/u/vuejs), essentially IE9+. IE8 and below are not supported.

## Contribution

Read the [contributing guide](https://github.com/yyx990803/vue/blob/master/CONTRIBUTING.md).

## Get in Touch

- If you have a Vue-related project/component/tool, add it to the [Wiki page](https://github.com/yyx990803/vue/wiki/User-Contributed-Components-&-Tools)!
- Bugs, suggestions & feature requests: [open an issue](https://github.com/yyx990803/vue/issues)
- Twitter: [@vuejs](https://twitter.com/vuejs)
- [Google+ Community](https://plus.google.com/communities/112229843610661683911)
- freenode IRC Channel: #vuejs

## Changelog

See details changes for each version in the [release notes](https://github.com/yyx990803/vue/releases).

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Evan You