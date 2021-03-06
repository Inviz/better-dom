describe("fire", function() {
    "use strict";
    
    var input, callback;

    beforeEach(function() {
        setFixtures("<input id='input'/>");

        input = DOM.find("#input");

        callback = jasmine.createSpy("callback");
    });

    it("should trigger event handler", function() {
        var events = ["click", "focus", "blur", "change"], i;

        for (i = 0; i < 3; ++i) {
            input.on(events[i], callback).fire(events[i]);

            expect(callback.callCount).toBe(i + 1);
        }
    });

    it("should trigger native handlers", function() {
        input._node.onclick = callback.andReturn(false);

        input.fire("click");

        expect(callback).toHaveBeenCalled();
    });

    it("should trigger native methods if they exist", function() {
        input.fire("focus");
        expect(input._node).toBe(document.activeElement);
        expect(input.isFocused()).toBe(true);
    });

    it("should trigger custom events", function() {
        input.on("my:click", callback).fire("my:click");

        expect(callback).toHaveBeenCalled();
    });

    it("should accept optional data object", function() {
        var detail = {x: 1, y: 2};

        callback.andCallFake(function(param) {
            expect(param).toBe(detail);
        });

        input.on("my:click", ["detail"], callback);
        input.fire("my:click", detail);
        expect(callback).toHaveBeenCalled();

        input.on("click", ["detail"], callback);
        input.fire("click", detail);
        expect(callback.callCount).toBe(2);
    });

    it("should return reference to 'this'", function() {
        expect(input.fire("focus")).toBe(input);
    });

    it("should throw error if arguments are invalid", function() {
        expect(function() { input.fire(1); }).toThrow();
    });

});