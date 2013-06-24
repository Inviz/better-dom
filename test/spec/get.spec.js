describe("get", function() {
    "use strict";
    
    var link, input, textarea;

    beforeEach(function() {
        setFixtures("<a id='test' href='test.html' data-attr='val'>get-test</a><input type='text' id='get_input' value='test'/><textarea id='get_textarea'></textarea>'");

        link = DOM.find("#test");
        input = DOM.find("#get_input");
        textarea = DOM.find("#get_textarea");
    });

    it("should read an attribute value", function() {
        expect(link.get("id")).toBe("test");
        expect(link.get("data-attr")).toBe("val");
        expect(link.get("tagName")).toBe("a");
    });

    it("should try to read property value first", function() {
        expect(link.get("href")).not.toBe("test.html");
        expect(input.get("tabIndex")).toBe(0);
    });

    // it("should not allow to access to legacy objects", function() {
    //     var protectedProps = {
    //             children: true,
    //             childNodes: true,
    //             firstChild: true,
    //             lastChild: true,
    //             nextSibling: true,
    //             previousSibling: true,
    //             firstElementChild: true,
    //             lastElementChild: true,
    //             nextElementSibling: true,
    //             previousElementSibling: true,
    //             parentNode: true,
    //             elements: true
    //         },
    //         readProp = function(propName) {
    //             return function() {
    //                 link.get(propName);
    //             };
    //         };

    //     for (var propName in protectedProps) {
    //         expect(readProp(propName)).toThrow();
    //     }
    // });

    it("should use 'innerHTML' or 'value' if name argument is undefined", function() {
        expect(link.get()).toBe("get-test");
        expect(input.get()).toBe("test");
        expect(textarea.get()).toBe("");
        textarea.set("value", "123");
        expect(textarea.get()).toBe("123");
    });

    it("should throw error if argument is invalid", function() {
        expect(function() { link.get(1); }).toThrow();
        expect(function() { link.get(true); }).toThrow();
        expect(function() { link.get({}); }).toThrow();
        expect(function() { link.get(function() {}); }).toThrow();
    });

});