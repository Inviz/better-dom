define(["Node", "Node.supports"], function(DOMNode, DOMElement, SelectorMatcher, EventHandler, _isArray, _forEach, _forOwn, _makeError) {
    "use strict";

    // DOM EVENTS
    // ----------

    (function() {
        var eventHooks = {},
            rpropexpr = /^([a-z:]+)(?:\(([^)]+)\))?\s?(.*)$/,
            legacyCustomEventName = "dataavailable",
            processObjectParam = function(value, name) { this.on(name, value); },
            createCustomEventWrapper = function(originalHandler, type) {
                var handler = function() {
                        if (window.event._type === type) originalHandler();
                    };

                handler.type = originalHandler.type;
                handler._type = legacyCustomEventName;
                handler.callback = originalHandler.callback;

                return handler;
            };

        /**
         * Bind a DOM event to the context
         * @param  {String}   type event type
         * @param  {Object}   [context] callback context
         * @param  {Function|String} callback event callback
         * @param  {Array}    [args] extra arguments
         * @return {DOMNode}
         * @example
         * // NOTICE: handler don't have e as the first argument
         * input.on("click", function() {...});
         * // NOTICE: event arguments in event name
         * input.on("keydown(keyCode,altKey)", function(keyCode, altKey) {...});
         */
        DOMNode.prototype.on = function(type, context, callback, args) {
            var eventType = typeof type,
                hook, handler, selector, expr;

            if (eventType === "string") {
                if (typeof context !== "object") {
                    args = callback;
                    callback = context;
                    context = this;
                }

                expr = rpropexpr.exec(type);
                type = expr[1];
                selector = expr[3];
                
                handler = EventHandler(expr, context, callback, args, this._node);
                handler.type = selector ? type + " " + selector : type;
                handler.callback = callback;
                handler.context = context;

                if (hook = eventHooks[type]) hook(handler);

                if (document.addEventListener) {
                    this._node.addEventListener(handler._type || type, handler, !!handler.capturing);
                } else {
                    // handle custom events for IE8
                    if (!this.supports("on" + type) || handler.custom) handler = createCustomEventWrapper(handler, type);

                    this._node.attachEvent("on" + (handler._type || type), handler);
                }
                // store event entry
                this._listeners.push(handler);
            } else if (eventType === "object") {
                _forOwn(type, processObjectParam, this);
            } else {
                throw _makeError("on", this);
            }

            return this;
        };

        /**
         * Unbind a DOM event from the context
         * @param  {String}          type event type
         * @param  {Object}          [context] callback context
         * @param  {Function|String} [callback] event handler
         * @return {DOMNode}
         */
        DOMNode.prototype.off = function(type, context, callback) {
            if (typeof type !== "string") {
                throw _makeError("off", this);
            }

            if (typeof context !== "object") {
                callback = context;
                context = !callback ? undefined : this;
            }

            _forEach(this._listeners, function(handler, index, events) {
                var node = this._node;

                if (handler && type === handler.type && (!context || context === handler.context) && (!callback || callback === handler.callback)) {
                    type = handler._type || handler.type;

                    if (document.removeEventListener) {
                        node.removeEventListener(type, handler, !!handler.capturing);
                    } else {
                        node.detachEvent("on" + type, handler);
                    }
                    
                    delete events[index];
                }
            }, this);

            return this;
        };

        /**
         * Triggers an event of specific type
         * @param  {String} eventType type of event
         * @param  {Object} [detail] data to attach
         * @return {DOMNode}
         * @example
         * var domLink = DOM.find(".link");
         *
         * domLink.fire("focus");
         * // receive focus to the element
         * domLink.fire("custom:event", {x: 1, y: 2});
         * // trigger a custom:event on the element
         */
        DOMNode.prototype.fire = function(type, detail) {
            if (typeof type !== "string") {
                throw _makeError("fire", this);
            }

            var node = this._node,
                hook = eventHooks[type],
                handler = {},
                isCustomEvent, canContinue, event;

            if (hook) hook(handler);

            isCustomEvent = handler.custom || !this.supports("on" + type);

            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");

                event.initEvent(handler._type || type, true, true);
                event.detail = detail;

                canContinue = node.dispatchEvent(event);
            } else {
                event = document.createEventObject();

                // store original event type
                event._type = isCustomEvent ? type : undefined;
                event.detail = detail;

                node.fireEvent("on" + (isCustomEvent ? legacyCustomEventName : handler._type || type), event);

                canContinue = event.returnValue !== false;
            }

            // Call a native DOM method on the target with the same name as the event
            // IE<9 dies on focus/blur to hidden element
            if (canContinue && node[type] && (type !== "focus" && type !== "blur" || node.offsetWidth)) {
                // Prevent re-triggering of the same event
                EventHandler.veto = type;
                
                node[type]();

                EventHandler.veto = false;
            }

            return this;
        };

        // firefox doesn't support focusin/focusout events
        if (DOMNode.prototype.supports("onfocusin", "input")) {
            _forOwn({focus: "focusin", blur: "focusout"}, function(value, prop) {
                eventHooks[prop] = function(handler) { handler._type = value; };
            });
        } else {
            eventHooks.focus = eventHooks.blur = function(handler) {
                handler.capturing = true;
            };
        }

        if (DOMNode.prototype.supports("validity", "input")) {
            eventHooks.invalid = function(handler) {
                handler.capturing = true;
            };
        }

        if (!document.addEventListener) {
            // input event fix via propertychange
            document.attachEvent("onfocusin", (function() {
                var legacyInputEventName = "onpropertychange",
                    propertyChangeEventHandler = function() {
                        var e = window.event;

                        if (e.propertyName === "value") {
                            // trigger special event that bubbles
                            DOMElement(e.srcElement).fire("input");
                        }
                    },
                    capturedEl;

                return function() {
                    var target = window.event.srcElement,
                        type = target.type;

                    if (capturedEl) {
                        capturedEl.detachEvent(legacyInputEventName, propertyChangeEventHandler);
                        capturedEl = null;
                    }

                    if (type === "text" || type === "password" || type === "textarea") {
                        (capturedEl = target).attachEvent(legacyInputEventName, propertyChangeEventHandler);
                    }
                };
            })());

            // submit event bubbling fix
            document.attachEvent("onkeydown", function() {
                var e = window.event,
                    target = e.srcElement,
                    form = target.form;

                if (form && target.type !== "textarea" && e.keyCode === 13 && e.returnValue !== false) {
                    DOMElement(form).fire("submit");

                    return false;
                }
            });

            document.attachEvent("onclick", (function() {
                var handleSubmit = function() {
                        var form = window.event.srcElement;

                        form.detachEvent("onsubmit", handleSubmit);

                        DOMElement(form).fire("submit");

                        return false;
                    };

                return function() {
                    var target = window.event.srcElement,
                        form = target.form;

                    if (form && target.type === "submit") {
                        form.attachEvent("onsubmit", handleSubmit);
                    }
                };
            })());

            eventHooks.submit = function(handler) {
                handler.custom = true;
            };
        }
    }());
});