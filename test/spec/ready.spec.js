describe("ready", function(){
    "use strict";

    it("should trigger callbacks if DOM is ready", function(){
        var spy1 = jasmine.createSpy("callback1"),
            spy2 = jasmine.createSpy("callback2");

        spy1.andThrow("ready");

        DOM.ready(spy1);
        DOM.ready(spy2);

        waits(50);

        runs(function() {
            expect(spy1.callCount).toBe(1);
            expect(spy2.callCount).toBe(1);
        });
    });

    it("should throw error if arguments are invalid", function(){
        expect(function() { DOM.ready(1); }).toThrow();
    });

});
