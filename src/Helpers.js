define([], function($Element) {
    "use strict";

    // HELPERS
    // -------

    // jshint unused:false
    var _uniqueId = (function() {
            var idCounter = 1;

            return function(prefix) {
                return (prefix || "") + idCounter++;
            };
        })(),
        _defer = function(callback) {
            return setTimeout(callback, 0);
        },
        _makeError = function(method, el) {
            var type;

            if (el instanceof $Element) {
                type = "$Element";
            } else {
                type = "DOM";
            }

            return "Error: " + type + "." + method + " was called with illegal arguments. Check <%= pkg.docs %>/" + type + ".html#" + method + " to verify the function call";
        },
        makeLoopMethod = (function(){
            var rcallback = /cb\.call\(([^)]+)\)/g,
                defaults = {
                    BEFORE: "",
                    COUNT:  "a ? a.length : 0",
                    BODY:   "",
                    AFTER:  ""
                };

            return function(options) {
                var code = "%BEFORE%\nfor(var i=0,n=%COUNT%;i<n;++i){%BODY%}%AFTER%";

                _forIn(defaults, function(value, key) {
                    code = code.replace("%" + key + "%", options[key] || value);
                });

                // improve callback invokation by using call on demand
                code = code.replace(rcallback, function(expr, args) {
                    return "(that?" + expr + ":cb(" + args.split(",").slice(1).join() + "))";
                });

                return Function("a", "cb", "that", "undefined", code);
            };
        })(),

        // OBJECT UTILS
        // ------------
        
        _forIn = function(obj, callback, thisPtr) {
            for (var prop in obj) {
                callback.call(thisPtr, obj[prop], prop, obj);
            }
        },
        _forOwn = (function() {
            if (Object.keys) {
                return makeLoopMethod({
                    BEFORE: "var keys = Object.keys(a), k",
                    COUNT:  "keys.length",
                    BODY:   "k = keys[i]; cb.call(that, a[k], k, a)"
                });
            } else {
                return function(obj, callback, thisPtr) {
                    for (var prop in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, prop)) callback.call(thisPtr, obj[prop], prop, obj);
                    }
                };
            }
        }()),
        _keys = Object.keys || (function() {
            var collectKeys = function(value, key) { this.push(key); };

            return function(obj) {
                var result = [];

                _forOwn(obj, collectKeys, result);

                return result;
            };
        }()),
        _extend = function(obj, mixins) {
            _forOwn(mixins, function(value, key) {
                obj[key] = value;
            });

            return obj;
        },

        // COLLECTION UTILS
        // ----------------
        
        _forEach = makeLoopMethod({
            BODY:   "cb.call(that, a[i], i, a)",
            AFTER:  "return a"
        }),
        _map = makeLoopMethod({
            BEFORE: "var out = []",
            BODY:   "out.push(cb.call(that, a[i], i, a))",
            AFTER:  "return out"
        }),
        _some = makeLoopMethod({
            BODY:   "if (cb.call(that, a[i], i, a) === true) return true",
            AFTER:  "return false"
        }),
        _filter = makeLoopMethod({
            BEFORE: "var out = []",
            BODY:   "if (cb.call(that, a[i], i, a)) out.push(a[i])",
            AFTER:  "return out"
        }),
        _foldl = makeLoopMethod({
            BODY:   "that = (!i && that === undefined ? a[i] : cb(that, a[i], i, a))",
            AFTER:  "return that"
        }),
        _foldr = makeLoopMethod({
            BEFORE: "var j",
            BODY:   "j = n - i - 1; that = (!i && that === undefined ? a[j] : cb(that, a[j], j, a))",
            AFTER:  "return that"
        }),
        _every = makeLoopMethod({
            BEFORE: "var out = true",
            BODY:   "out = cb.call(that, a[i], i, a) && out",
            AFTER:  "return out"
        }),
        _slice = function(list, index) {
            return Array.prototype.slice.call(list, index || 0);
        },

        // DOM UTILS
        // ---------

        _getComputedStyle = function(el) {
            return window.getComputedStyle ? window.getComputedStyle(el) : el.currentStyle;
        },
        _createElement = function(tagName) {
            return document.createElement(tagName);
        },
        _createFragment = function() {
            return document.createDocumentFragment();
        },
        _parseFragment = (function() {
            var parser = document.createElement("body");

            if (!document.addEventListener) {
                // Add html5 elements support via:
                // https://github.com/aFarkas/html5shiv
                (function(){
                    var elements = "abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",
                        // Used to skip problem elements
                        reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
                        // Not all elements can be cloned in IE
                        saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
                        create = document.createElement,
                        frag = _createFragment(),
                        cache = {};

                    frag.appendChild(parser);

                    _createElement = function(nodeName) {
                        var node;

                        if (cache[nodeName]) {
                            node = cache[nodeName].cloneNode();
                        } else if (saveClones.test(nodeName)) {
                            node = (cache[nodeName] = create(nodeName)).cloneNode();
                        } else {
                            node = create(nodeName);
                        }

                        return node.canHaveChildren && !reSkip.test(nodeName) ? frag.appendChild(node) : node;
                    };

                    _createFragment = Function("f", "return function(){" +
                        "var n=f.cloneNode(),c=n.createElement;" +
                        "(" +
                            // unroll the `createElement` calls
                            elements.split(" ").join().replace(/\w+/g, function(nodeName) {
                                create(nodeName);
                                frag.createElement(nodeName);
                                return "c('" + nodeName + "')";
                            }) +
                        ");return n}"
                    )(frag);
                })();
            }

            return function(html) {
                var fragment = _createFragment();

                // fix NoScope bug
                parser.innerHTML = "<br/>" + html;
                parser.removeChild(parser.firstChild);

                while (parser.firstChild) {
                    fragment.appendChild(parser.firstChild);
                }

                return fragment;
            };
        })();
});
