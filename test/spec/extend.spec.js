describe("extend", function() {
    var WAIT_FOR_WATCH_TIME = 50, 
        callback;

    beforeEach(function() {
        setFixtures("<a class='extend'></a><span class='extend'></span><b class='extend'></b>");

        callback = jasmine.createSpy("callback");
    });

    it("should execute contructor property for each element", function() {
        DOM.extend(".extend", {
            constructor: callback
        });

        waits(WAIT_FOR_WATCH_TIME);

        runs(function() {
            expect(callback.callCount).toBe(3);
        });
    });

    it("should append css properties", function() {
        DOM.extend(".extend", {
            css: [{
                ".extend": "position: relative"
            }]
        });

        waits(WAIT_FOR_WATCH_TIME);

        runs(function() {
            DOM.findAll(".extend").each(function(domEl) {
                expect(domEl.getStyle("position")).toBe("relative");
            });
        });
    });

    it("should append template", function() {
        var template = {},
            checkStrategies = {
                prepend: "firstChild",
                append: "lastChild",
                after: "next",
                before: "prev"
            };

        for (var key in checkStrategies) {
            template[key] = '<i class="' + key + '"></i>';
        }

        DOM.extend(".extend", {
            template: template
        });

        waits(WAIT_FOR_WATCH_TIME);

        runs(function() {
            DOM.findAll(".extend").each(function(domEl) {
                for (var key in checkStrategies) {
                    expect(domEl[checkStrategies[key]]("." + key)).toBeDefined();
                }
            });
        });
    });

    it("should throw error if arguments are invalid", function() {
        expect(function() { DOM.extend(1); }).toThrow();
    });

});