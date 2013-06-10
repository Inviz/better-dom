suite("create", function () {
    "use strict";

    benchmark("jquery#create(String)", function() {
        jQuery("<a>");
    });

    benchmark("jquery#create(Element)", function() {
        jQuery(document.createElement("a"));
    });

    benchmark("jquery#create(HtmlString)", function() {
        jQuery("<a><span></span><i></i></a>");
    });

    benchmark("DOM#create(String)", function() {
        DOM.create("a");
    });

    benchmark("DOM#create(Element)", function() {
        DOM.create(document.createElement("a"));
    });

    benchmark("DOM#create(HtmlString)", function() {
        DOM.create("<a><span></span><i></i></a>");
    });

    benchmark("DOM#create(EmmetString)", function() {
        DOM.create("a>span+i");
    });

    benchmark("native(String)", function() {
        document.createElement("a");
    });

});