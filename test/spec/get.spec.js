describe("get", function() {
    "use strict";
    
    var link;

    beforeEach(function() {
        setFixtures("<a id='test' href='test.html'>get-test</a>");

        link = DOM.find("#test");
    });

    it("should read an attribute value", function() {
        expect(link.get("id")).toEqual("test");
    });

    it("should try to read property value first", function() {
        expect(link.get("href")).not.toEqual("test.html");
    });

    it("should not allow to access to legacy objects", function() {
        var protectedProps = {
                children: true,
                childNodes: true,
                firstChild: true,
                lastChild: true,
                nextSibling: true,
                previousSibling: true,
                firstElementChild: true,
                lastElementChild: true,
                nextElementSibling: true,
                previousElementSibling: true,
                parentNode: true,
                elements: true
            },
            readProp = function(propName) {
                return function() {
                    link.get(propName);
                };
            };

        for (var propName in protectedProps) {
            expect(readProp(propName)).toThrow();
        }
    });

    it("should use 'innerHTML' if name argument is undefined", function() {
        expect(link.get()).toBe("get-test");
    });

    it("should throw error if argument is invalid", function() {
        expect(function() { link.get(1); }).toThrow();
        expect(function() { link.get(true); }).toThrow();
        expect(function() { link.get({}); }).toThrow();
        expect(function() { link.get(function() {}); }).toThrow();
    });

});