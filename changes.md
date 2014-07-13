If you happen to see this - note that most of these are just planned but subject to change at any moment. Feedback is welcome though.

## Instantiation

Instances are no longer compiled at instantiation. Data will be observed, but no DOM compilation will happen until the new instance method `$mount` has been called. Also, when a new instance is created without `el` option, it no longers auto creates one.

``` js
var vm = new Vue({ data: {a:1} }) // only observes the data
vm.$mount('#app') // actually compile the DOM
```

## More flexible directive syntax
  
  - v-on

    ``` html
    <a v-on="{click: onClick, dragmove: onMove}"></a>
    ```

  - v-style

    ``` html
    <a v-style="{top: list + ‘px’}"></a>
    ```

  - custom directive

    ``` html
    <a v-my-table="{ data:hello, rows:5, cols:10 }">fsef</a>
    ```

  - v-repeat

    ``` html
    <ul>
      <li v-repeat="{
        data     : list,
        as       : 'item',
        filterBy : filterKey,
        orderBy  : orderKey
      }"></li>
    </ul>
    ```

## Two Way filters

``` html
  <input v-model="abc | email">
```

``` js
Vue.filter('format', {
  read: function (val) {
    return val + '!'
  },
  write: function (val, oldVal) {
    return val.match(/ok/) ? val : oldVal
  }
})
```

## Block logic control

``` html
<!-- v-repeat="list" -->
  <h2>{{title}}</h2>
  <p>{{content}}</p>
<!-- v-repeat-end -->
```

``` html
<!-- v-if="showProfile" -->
  <my-avatar></my-avatar>
  <my-bio></my-bio>
<!-- v-if-end -->
```

## (Experimental) New Scope Inheritance Model

In the previous version, nested Vue instances do not have prototypal inheritance of their data scope. Although you can access parent data properties in templates, you need to explicitly travel up the scope chain with `this.$parent` in JavaScript code or use `this.$get()` to get a property on the scope chain. The expression parser also needs to do a lot of dirty work to determine the correct scope the variables belong to.

In the new model, we provide a scope inehritance system similar to Angular, in which you can directly access properties that exist on parent scopes. The major difference is that setting a primitive value property on a child scope WILL affect that on the parent scope! This is one of the major gotchas in Angular and it's no longer an issue in Vue, although if you are somewhat familiar with how prototype inehritance works, you might be surprised how this is possible. Well, the reason is that all data properties in Vue are getter/setters, and invoking a setter will not cause the child scope shadowing parent scopes.

## (Experimental) Validators

``` html
  <input v-model="abc @ email">
```

``` js
  Vue.validator('email', function (val) {
    return val.match(...)
  })
  // this.$validation.abc // false
  // this.$valid // false
```

## (Experimental) One time interpolations

``` html
<span>{{* hello }}</span>
```