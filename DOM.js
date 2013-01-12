/*!
 * DOM.js
 *
 * Copyright (c) 2013 Maksim Chemerisuk
 *
 * 1) encapsulation: completely hides native objects
 * 2) usability: provides more friendly apis
 * 3) safety: api can't be changed after initialization
 * 4) performance: use native methods where it's possible
 * 5) self-documenting: every error message has a link with detailed explaination
 * 6) jsdoc, generate documentation by it
 */
/*jslint browser:true*/
/*global define CustomEvent */
// TODO: replace, remove, specs
(function (window, document, undefined) {
    "use strict";

    var factory = (function() {
        var storage = [];
   
            return {
                get: function(guid) {
                    return storage[guid];
                },
                remove: function(guid) {
                    storage[guid] = null;
                },
                create: function(native) {
                    if (!native) return new NullElement();
                    
                    var instance = native._DOM;
                    
                    if (!instance) {
                        if (native.length === undefined) {
                            native._DOM = (instance = new DOMElement(native));
                        } else {
                            instance = new DOMElements();
                
                            Array.prototype.forEach.call(native, function (e) {
                                instance.push(factory.create(e));
                            });
                        }
                        
                        instance.guid = storage.push(native) - 1;
                        // data should be a simple object without toString, hasOwnProperty etc.
                        instance.data = Object.create(null);
                    }
                
                    return instance;
                }
            };
        })(),
        // helpers
        rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\[([\w\-]+)\])?(?:\.([\w\-]+))?$/,
        
        quickParse = function(selector) {
            var quick = rquickIs.exec(selector);
            // TODO: support attribute value check
            if (quick) {
                //   0  1    2   3          4
                // [ _, tag, id, attribute, class ]
                quick[1] = (quick[1] || "").toLowerCase();
                quick[4] = quick[4] ? " " + quick[4] + " " : "";
            } else {
                throw new DOMMethodError("quickParse");
            }

            return quick;
        },
        quickIs = function (elem, m) {
            var attrs = elem.attributes || {};
            
            return (
                (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
                (!m[2] || (attrs.id || {}).value === m[2]) &&
                (!m[3] || m[3] in attrs) &&
                (!m[4] || ~(" " + (attrs["class"] || "").value  + " ").indexOf(m[4]))
            );
        },
        // classes
        DOMElement = function(native) { },
        DOMElements = (function() {
            // Creates clean copy of Array prototype. Inspired by
            // http://dean.edwards.name/weblog/2006/11/hooray/
            var ref = document.getElementsByTagName('script')[0],
                iframe = document.createElement("iframe"),
                ctr;
                
            iframe.src = "about:blank";
            iframe.style.display = "none";
                
            ref.parentNode.insertBefore(iframe, ref);
            // store reference to clean Array
            ctr = iframe.contentWindow.Array;
            // cleanup
            ref.parentNode.removeChild(iframe);
            
            return ctr;
        })(),
        NullElement = function () { },
        // errors
        DOMMethodError = function (methodName, objectName, hashName) {
            this.name = "DOMMethodError";
            // http://domjs.net/doc/{objectName}/{methodName}[#{hashName}]
            this.message = "Invalid call of the " + methodName +
                " method. See http://domjs.net/doc/" + methodName + " for details";
        };

    // DOMElement

    DOMElement.prototype = {
        find: function (selector, multiple) {
            var elements;
            
            if (selector && multiple === undefined) {
                elements = this.querySelector(selector);
            } else if (selector && multiple === true) {
                elements = this.querySelectorAll(selector);
            } else {
                throw new DOMMethodError("find");
            }
            
            return factory.create(elements);
        },
        children: function (filter) {
            var result = [], quick = (filter ? quickParse(filter) : null);

            if (filter && !quick) {
                throw new DOMMethodError("children");
            }
            // FIXME: use children collection?
            for (var n = this.firstChild; n; n = n.nextSibling) {
                if (n.nodeType === 1 && (!filter || quickIs(n, quick))) {
                    result.push(n);
                }
            }

            return factory.create(result);
        },
        on: (function () {
            var getArgValue = function(arg) {
                    return this[arg];
                },
                processHandlers = function (event, options, handler, thisPtr) {
                    if (typeof handler !== "function") {
                        throw new DOMMethodError("on");
                    }

                    var quick = options.filter ? quickParse(options.filter) : null,
                        nativeEventHandler = function (e) {
                            var target = factory.create(e.target), args = [];

                            if (options.prevent) e.preventDefault();
                            if (options.stop) e.stopPropagation();
                            
                            handler.apply(thisPtr || target, (options.args || []).map(getArgValue, e));
                        };
                    // TODO: store handler in _events property of the native element
                    this.addEventListener(event, !options.filter ? nativeEventHandler : function (e) {
                        for (var el = e.target, root = this.parentNode; el !== root; el = el.parentNode) {
                            if (quickIs(el, quick)) {
                                nativeEventHandler(e);

                                break;
                            }
                        }
                    }, false);
                };

            return function (event, options, handler, thisPtr) {
                var optionsfmtMessageype = typeof options,
                    eventType = typeof event;

                if (optionsfmtMessageype === "function") {
                    thisPtr = handler;
                    handler = options;
                    options = {};
                } else if (optionsfmtMessageype === "string") {
                    options = {filter: options};
                } else if (optionsfmtMessageype !== "object") {
                    throw new DOMMethodError("on");
                }

                if (eventType === "string") {
                    processHandlers.call(this, event, options, handler, thisPtr);
                } else if (event && eventType === "object") {
                    Object.keys(event).forEach(function (eventType) {
                        processHandlers.call(this, eventType, {}, event[eventType], thisPtr);
                    }, this);
                } else {
                    throw new DOMMethodError("on");
                }

                return this;
            };
        })(),
        fire: function (eventType, detail) {
            var event;
            
            if (detail !== undefined) {
                event = new CustomEvent(eventType, {detail: detail});
            } else {
                event = document.createEvent(eventType);
                event.initEvent(eventType, true, true);
            }
            
            this.dispatchEvent(event);

            return this;
        },
        get: function (name) {
            var value = this[name];
            
            if (value === undefined) {
                value = this.getAttribute(name);
            }
            
            return value;
        },
        set: (function () {
            var processAttribute = function (name, value) {
                var valueType = typeof value;

                if (valueType === "function") {
                    value = value.call(this._DOM, DOMElement.prototype.get.call(this, name));
                } else if (valueType !== "string") {
                    throw new DOMMethodError("set");
                }

                if (name in this) {
                    this[name] = value;
                } else {
                    this.setAttribute(name, value);
                }
            };

            return function (name, value) {
                var nameType = typeof name;

                if (nameType === "string") {
                    processAttribute.call(this, name, value);
                } else if (name && nameType === "object") {
                    Object.keys(name).forEach(function (attrName) {
                        processAttribute.call(this, attrName, name[attrName]);
                    }, this);
                } else {
                    throw new DOMMethodError("set");
                }

                return this;
            };
        })(),
        is: function (filter) {
            var quick = quickParse(filter);

            if (!quick) {
                throw new DOMMethodError("is");
            }

            return quickIs(this, quick);
        },
        call: function (name) {
            var functor = this[name], result;

            if (typeof functor !== "function") {
                throw new DOMMethodError("call");
            }

            result = functor.apply(this, arguments.length > 1 ?
                Array.prototype.splice.call(arguments, 1) : undefined);

            return result === undefined ? this : result;
        },
        show: function () {
            this.style.display = "";

            return this;
        },
        hide: function () {
            this.style.display = "none";

            return this;
        },
        remove: function () {
            this.parentNode.removeChild(this);
            // cleanup cache entry
            factory.remove(this._DOM.guid);

            return this;
        },
        replace: function (elem) {
            if (elem.constructor === DOMElement) {
                this.replaceChild(this, elem._native);
            } else {
                throw new DOMMethodError("replace");
            }

            return this;
        },
        clone: function (deep) {
            return factory.create(this.clone(deep));
        },
        css: function () {
            return window.getComputedStyle(this);
        }
    };

    // dom manipulation
    (function () {
        var strategies = {
            after: function (element) {
                this.parentNode.insertBefore(element, this.nextSibling);
            },
            before: function (element) {
                this.parentNode.insertBefore(element, this);
            },
            append: function (element) {
                this.appendChild(element);
            },
            prepend: function (element) {
                this.insertBefore(element, this.firstChild);
            }
        };

        Object.keys(strategies).forEach(function (methodName) {
            var process = strategies[methodName];

            DOMElement.prototype[methodName] = function (element) {
                var fragment;

                if (element.constructor === DOMElement) {
                    fragment = factory.get(element.guid);
                } else if (element.constructor === DOMElements) {
                    fragment = document.createDocumentFragment();

                    factory.get(element.guid).forEach(function (element) {
                        fragment.appendChild(factory.get(element.guid));
                    });
                } else {
                    throw new DOMMethodError(methodName);
                }

                process.call(this, fragment);

                return this;
            };
        });
    })();

    // classes manipulation
    (function () {
        var rclass = /[\n\t\r]/g,
            strategies = document.documentElement.classList ? {
                hasClass: function (className) {
                    return this.classList.constains(className);
                },
                addClass: function (className) {
                    this.classList.add(className);
                },
                removeClass: function (className) {
                    this.classList.remove(className);
                },
                toggleClass: function (className) {
                    this.classList.toggle(className);
                }
            } : {
                hasClass: function (className) {
                    return !!~((" " + this.className + " ")
                            .replace(rclass, " ")).indexOf(" " + className + " ");
                },
                addClass: function (className) {
                    if (!strategies.hasClass.call(this, className)) {
                        this.className += " " + className;
                    }
                },
                removeClass: function (className) {
                    this.className = (" " + this.className + " ")
                            .replace(rclass, " ").replace(" " + className + " ", " ").trim();
                },
                toggleClass: function (className) {
                    var originalClassName = this.className;

                    strategies.addClass.call(this, className);

                    if (originalClassName !== this.className) {
                        strategies.removeClass.call(this, className);
                    }
                }
            };

        Object.keys(strategies).forEach(function (methodName) {
            var process = strategies[methodName];

            DOMElement.prototype[methodName] = function (className) {
                if (typeof className !== "string") {
                    throw new DOMMethodError(methodName);
                }

                var classes = className.split(" ");

                if (methodName === "hasClass") {
                    return classes.any(process, this);
                } else {
                    classes.forEach(process, this);

                    return this;
                }
            };
        });

    })();

    // add guid support to prototype methods
    Object.keys(DOMElement.prototype).forEach(function (methodName) {
        var method = DOMElement.prototype[methodName];

        DOMElement.prototype[methodName] = function () {
            var element = factory.get(this.guid),
                getter = function() {
                    var result = method.apply(element, arguments);

                    return result === element ? this : result;
                };

            Object.defineProperty(this, methodName, {
                value: getter,
                writable: false,
                configurable: false
            });

            return getter.apply(this, arguments);
        };
    });

    // DOMElements

    // extend DOMElements.prototype with only specific methods
    ["set", "on", "show", "hide", "addClass", "removeClass", "toggleClass"].forEach(function (methodName) {
        var process = function (elem) {
                // 'this' will be an arguments object
                elem[methodName].apply(elem, this);
            };

        DOMElements.prototype[methodName] = function () {
            this.forEach(process, arguments);

            return this;
        };
    });

    // initialize null element prototype
    NullElement.prototype = {};

    Object.keys(DOMElement.prototype).forEach(function (method) {
        // each method is a noop function
        NullElement.prototype[method] = function () {};
    });
    
    // DOMMethodError
    DOMMethodError.prototype = new Error();

    // finish prototypes
    [DOMElement, DOMElements, NullElement].forEach(function (ctr) {
        // fix constructor
        ctr.prototype.constructor = ctr;
        // lock interfaces
        if (Object.freeze) {
            Object.freeze(ctr.prototype);
        }
    });

    // initialize publicAPI
    var publicAPI = Object.create(factory.create(document.documentElement), {
        create: {
            value: function (tagName, attrs, content) {
                var elem = factory.create(document.createElement(tagName));

                if (attrs && typeof attrs === "object") {
                    elem.set(attrs);
                }

                if (content) {
                    if (typeof content === "string") {
                        elem.set("innerHTML", content);
                    } else if (content.constructor === DOMElement ||
                        content.constructor === DOMElements) {
                        elem.append(content);
                    }
                }
                
                return elem;
            }
        },
        ready: {
            value: (function () {
                var readyCallbacks = null,
                    readyProcess = function () {
                        if (readyCallbacks) {
                            // trigger callbacks
                            readyCallbacks.forEach(function (callback) {
                                callback();
                            });
                            // cleanup
                            readyCallbacks = null;
                        }
                    };

                if (document.readyState !== "complete") {
                    readyCallbacks = [];

                    document.addEventListener("DOMContentLoaded", readyProcess, false);
                    // additional handler for complex cases
                    window.addEventListener("load", readyProcess, false);
                }

                // return implementation
                return function (callback) {
                    if (typeof callback !== "function") {
                        throw new DOMMethodError("ready");
                    }

                    if (readyCallbacks) {
                        readyCallbacks.push(callback);
                    } else {
                        callback();
                    }
                };
            })()
        }
    });

    // make static properties readonly
    Object.getOwnPropertyNames(publicAPI).forEach(function (prop) {
        var desc = Object.getOwnPropertyDescriptor(publicAPI, prop);

        desc.configurable = false;
        desc.writable = false;

        Object.defineProperty(publicAPI, prop, desc);
    });

    // register API
    if (window.define) {
        define("DOM", [], function () { return publicAPI; });
    } else {
        window.DOM = publicAPI;
    }

})(window, document, undefined);