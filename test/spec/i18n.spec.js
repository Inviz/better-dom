describe("i18n", function(){
    "use strict";

    it("should allow to add i18n strings", function() {
        var spy = spyOn(DOM, "importStyles");

        DOM.addLocaleString("str0", "Hello {user}!");
        expect(spy).toHaveBeenCalledWith(
            "[data-i18n=\"str0\"]:before",
            "content:\"Hello \"attr(data-user)\"!\""
        );

        DOM.addLocaleString("str1", "Hello {user}! I'm {friend}.");
        expect(spy).toHaveBeenCalledWith(
            "[data-i18n=\"str1\"]:before",
            "content:\"Hello \"attr(data-user)\"! I'm \"attr(data-friend)\".\""
        );

        DOM.addLocaleString("str3", "Hello!", "ru");
        expect(spy).toHaveBeenCalledWith(
            "[data-i18n=\"str3\"]:lang(ru):before",
            "content:\"Hello!\""
        );
    });

    it("should allow to add banch of i18n strings", function() {
        var spy = spyOn(DOM, "importStyles");

        DOM.addLocaleString({str4: "test1", str5: "test2"});
        expect(spy).toHaveBeenCalledWith(
            "[data-i18n=\"str4\"]:before", "content:\"test1\""
        );
        expect(spy).toHaveBeenCalledWith(
            "[data-i18n=\"str5\"]:before", "content:\"test2\""
        );
    });

    it("should allow to read/write current language", function() {
        document.documentElement.lang = "en";

        expect(DOM.getLanguage()).toBe("en");
        DOM.setLanguage("ru");
        expect(DOM.getLanguage()).toBe("ru");
        expect(document.documentElement.lang).toBe("ru");
    });
});
