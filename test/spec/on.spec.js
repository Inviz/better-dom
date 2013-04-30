describe("on", function() {
    var link, input, obj = {test: function() { }, test2: function() {}};

    beforeEach(function() {
        setFixtures("<a id='test'>test element</a><input id='input'/>");

        link = DOM.find("#test");
        input = DOM.find("#input");
    });

    it("should return reference to 'this'", function() {
        expect(input.on("click", obj.test)).toEqual(input);
    });

    it("should accept single callback", function() {
        spyOn(obj, "test");

        link.on("click", obj.test).fire("click");

        expect(obj.test).toHaveBeenCalled();
    });

    it("should accept optional event filter", function() {
        spyOn(obj, "test");

        DOM.on("click", "input", obj.test);

        link.fire("click");

        expect(obj.test).not.toHaveBeenCalled();

        input.fire("click");

        expect(obj.test).toHaveBeenCalled();
    });

    it("should accept space-separated event names", function() {
        spyOn(obj, "test");

        input.on("focus click", obj.test).fire("focus");

        expect(obj.test).toHaveBeenCalled();

        input.fire("click");

        expect(obj.test.callCount).toEqual(2);
    });

    it("should accept event object", function() {
        spyOn(obj, "test");
        spyOn(obj, "test2");

        input.on({focus: obj.test, click: obj.test2}).fire("focus");

        expect(obj.test).toHaveBeenCalled();

        input.fire("click");

        expect(obj.test2).toHaveBeenCalled();
    });

    it("should have target element as 'this' by default", function() {
        spyOn(obj, "test").andCallFake(function() {
            expect(this).toEqual(input);
        });

        input.on("click", obj.test).fire("click");
    });

    it("should not stop to call handlers if any of them throws an error inside", function() {
        window.onerror = function() {
            return true; // suppress displaying expected error for this test
        };

        spyOn(obj, "test").andCallFake(function() { throw "test"; });
        spyOn(obj, "test2");

        input.on("click", obj.test).on("click", obj.test2).fire("click");

        expect(obj.test2).toHaveBeenCalled();

        window.onerror = null; // restore default error handling
    });

    it("should fix some non-bubbling events", function() {
        spyOn(obj, "test");

        DOM.on("focus", obj.test);

        input.fire("focus");

        expect(obj.test).toHaveBeenCalled();
    });

    it("should throw error if arguments are invalid", function() {
        expect(function() { input.on(123); }).toThrow();
    });

});