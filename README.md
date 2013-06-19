better-dom [![Build Status](https://api.travis-ci.org/chemerisuk/better-dom.png?branch=master)](http://travis-ci.org/chemerisuk/better-dom)
==========
> Sandbox for DOM extensions

API description: http://chemerisuk.github.io/better-dom/.

## Installation
The simplest way is to use [bower](http://bower.io/):

    bower install better-dom

This will clone the latest version of the library into the `components` directory at the root of your project. Then just include script below on your web page:

```html
<script src="components/build/better-dom.js" data-htc="components/extra/better-dom.htc"></script>
```

## Unobtrusive extensions
`DOM.extend` used to define a new extension and any matched elements will be captured by it. But the coolest thing is that the same will happen even for future content inserted via `innerHTML` or using a javascript framework.

So as a developer you don't need to worry about when and how the extension will be initialized. As a result it's much simpler to create your own [components](#elastic-textarea-example) or to write [polyfills](#placeholder-polyfill-example) for old browsers.

#### placeholder polyfill example
The extension polyfills `[placeholder]` for old browsers
```js
DOM.supports("placeholder", "input") || DOM.extend("[placeholder]", [
    "input[style='box-sizing: border-box; position: absolute; color: graytext; background: none no-repeat 0 0; border-color: transparent']"
], {
    constructor: function(holder) {
        var offset = this.offset();

        this
            .on("focus", holder.hide, holder)
            .on("blur", this._showPlaceholder, [holder]);

        holder
            .set(this.get("placeholder"))
            .setStyle("width", offset.right - offset.left)
            .on("click", this.fire, ["focus"], this);

        if (this.get() || this.isFocused()) holder.hide();

        this.before(holder);
    },
    _showPlaceholder: function(holder) {
        if (!this.get()) holder.show();
    }
});
```
Check out [live demo](http://chemerisuk.github.io/better-placeholder-polyfill/) (open in IE < 10).

#### elastic textarea example
This is a textarea extension which autoresizes itself to contain all entered text.

Check out [live demo](http://chemerisuk.github.io/better-elastic-textarea/) and the [extension repository](https://github.com/chemerisuk/better-elastic-textarea).

#### more code: dateinput polyfill
The extension makes `input[type=date]` controls with the same UX for all browsers.

Check out [live demo](http://chemerisuk.github.io/better-dateinput-polyfill) the [extension repository](https://github.com/chemerisuk/better-dateinput-polyfill).

## Getter and setter
One of the unclear moments about standard DOM APIs is notion of properties and attributes for a element. Every time a developer wants to get some value he or she needs to decide which entity to grab. Usually reading a property is faster, but a lot of people don't know that or just always use attribute to keep the algorithm the same everywhere.

To fix that the library introduces smart getter and setter.

```js
var link = DOM.find("#link");

// returns value of the id property (i.e. "link" string)
link.get("id");
// returns value of "data-attr" attribute
link.get("data-attr");
// returns innerHTML of the element
link.get();

// sets property href (and that action updates attribute value too)
link.set("href", "/some/path");
// sets attribute "data-attr" to "123"
link.set("data-attr", "123");
// sets innerHTML to "some text"
link.set("some text");
```

## Emmet expressions
HTML strings are boring and complex, they take a lot of space. Let's fix that with [emmet](http://emmet.io/):

* `nav>ul>li` instead of `<nav><ul><li></li></ul></nav>`
* `form#search.wide` instead of `<form id="search" class="wide"></form>`
* `[a='value1' b="value2"]` instead of `<div a="value1" b="value2"></div>`
* `ul>li.item$*3` instead of `<ul><li class="item1"></li><li class="item2"></li><li class="item3"></li></ul>`

Because of code size emmet expressions support is only for HTML strings and has some limitations for now, but major features are in place.

## Event handling best practices
Events handling is a big part of writing a code for DOM. And there are some features included to the library APIs that help developers to avoid potential issues and keep their code easier to maintain.

#### Get rid of the event object
Event callback looses event object argument and it improves testability of your code.

```js
// NOTICE: handler don't have e as the first argument
DOM.find("#link").on("click", function() {...});
// NOTICE: the second options argument
DOM.find("#link").on("keydown", {args: ["keyCode", "altKey"]}, function(keyCode, altKey) {...});
```

#### Call preventDefault() or stopPropagation() before logic
It's a common situation that a handler throws an exception for a some reason. If preventDefault() or stopPropagation() are called at the end of logic than program may start to behave incorrectly.

```js
// NOTICE: preventDefault is always called before the handler
DOM.find("#link").on("click", {cancel: true}, handler);
// NOTICE: stopPropagation is always called before the handler
DOM.find("#link").on("click", {stop: true}, handler);
```

#### Callback systems are brittle
The library doesn't use callback arrays, so any event listener can't break another one (read the [nice article](http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/) for additional details).

```js
DOM.ready(function() { throw Error("exception in a bad code"); });
// NOTICE: you'll always see the message in console
DOM.ready(function() { console.log("Nothing can break your code") });
```
## Easy localization
Multilanguage support is often required for a DOM extension. `DOM.importStrings` allows to add a localized string which may be displayed in a html element using `data-i18n` attribute with an appropriate key.

```js
DOM.importStrings("hello.0", "Hello!");
// NOTICE: optional parameter to specify language of the string
DOM.importStrings("hello.0", "Привет!", "ru");
// element <span data-i18n="hello.0"><span> will display "Hello!"
```
You can use parametrized strings via special `{param}` substrings and appropriate `data-*` attributes.

```js
DOM.importStrings("hello.1", "Hello {user}!");
// element <a data-i18n="hello.1" data-user="Maksim"><a> will display "Hello Maksim!"
```
To change a string language manually use setter with `lang` parameter.

```js
span.set("lang", "ru");
// now the span displays "Привет!"
DOM.find("html").set("lang", "ru");
// the line changes language globally
```

## Performance
DOM is usually the main bottleneck of javascript applications. Therefore performance question should be on the top for any library that works with it.

## Browser support
* Chrome
* Safari
* Firefox
* Opera
* IE8+
