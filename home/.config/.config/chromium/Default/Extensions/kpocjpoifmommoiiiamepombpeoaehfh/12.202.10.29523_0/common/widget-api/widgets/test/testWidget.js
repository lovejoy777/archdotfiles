/*global test:false,equals:false,expects:false,start:false,trim:false,expect:false,notEqual:false,context:false*/
function onload() {
    // Obtain an instance of WidgetContext
    WidgetContextFactory.getWidgetContext(function(context) {
        window.context = context;

        test("Get API version", function() {
            equals(context.getVersion(), "1.0");
        });

        test("Get config (single params)", function() {
            // config values for the sample context are defined in widget-context-1.0.js
            expect(2);
            stop();
            var that = this;
            context.getConfig('param1', function(config) {
                equals(config.param1, "foo");
                equals(this, that);
                start();
            }, this);
        });

        test("Get config (multiple params)", function() {
            // config values for the sample context are defined in widget-context-1.0.js
            expect(3);
            stop();
            var that = this;
            context.getConfig(['param1', 'param2'], function(config) {
                equals(config.param1, "foo");
                equals(config.param2, "bar");
                equals(this, that);
                start();
            }, this);
        });

        test("Get static data", function() {
            // config values for the sample context are defined in widget-context-1.0.js
            expect(5);
            stop();
            var that = this;
            context.getStaticData(function(data) {
                equals(data.toolbarId != null, true);
                equals(data.partnerId != null, true);
                equals(data.installDate != null, true);
                equals(data.toolbarVersion != null, true);
                equals(this, that);
                start();
            }, this);
        });

        test("Test storage", function() {
            context.store("foo", "value");
            expect(2);
            stop();
            var that = this;
            context.retrieve("foo", function(values) {
                equals(values.foo, "value");
                equals(this, that);
                start();
            }, this);
        });

        test("Test storage (multiple values", function() {
            context.store("aString", "foo");
            context.store("anInt", 42);
            context.store("aBoolean", true);
            expect(4);
            stop();
            var that = this;
            context.retrieve(["aString", "anInt", "aBoolean"], function(values) {
                // api stores ints and booleans as strings, need to be converted manually
                equals(values.aString, "foo");
                equals(values.anInt, "42");
                equals(values.aBoolean, "true");
                equals(this, that);
                start();
            }, this);
        });

        test("Get supported message types", function() {
            expect(2);
            stop();
            var that = this;
            context.getSupportedMessageTypes(function(types) {
                // indexOf does not work in IE
                var index = -1;
                for (var i=0; i < types.length; i++) {
                    if (types[i] == "ExampleMessage")
                        index = i;
                }
                notEqual(index, -1);
                equals(this, that);
                start();
            }, this);
        });

        test("Send message", function() {
            expect(2);
            stop();
            var that = this;
            context.sendMessage("ExampleMessage", {echo:"foo"}, function(response) {
                equals(response, "hello foo");
                equals(this, that);
                start();
            }, this);
        });

        test("Get resource (text)", function() {
            // resource result for the sample context are defined in widget-context-1.0.js
            // this will encounter a java security error if from file://
            expect(2);
            stop();
            var that = this;
            context.getResource({
                url: "resource.xml",
                format: "text",
                success:  function(response) {
                    equals(response.data, "<sample>hello</sample>");
                    equals(this, that);
                    start();
                },
                error:  function(error) {
                    equals(true, false, "Error getting resource (security error is expected if you are running from file://).  Actual error: " + (error.message || error));
                    start();
                }
            }, this);
        });

        test("Get resource (XML)", function() {
            // resource result for the sample context are defined in widget-context-1.0.js
            // this will encounter a java security error if from file://
            expect(1);
            stop();
            context.getResource({
                url: "resource.xml",
                format: "xml",
                success:  function(response) {
                    var rootNode = response.data.documentElement;
                    equals(rootNode.tagName, "sample");
                    start();
                },
                error:  function(error) {
                    equals(true, false, "Error getting resource (security error is expected if you are running from file://).  Actual error: " + error);
                    start();
                }
            }, this);
        });

        test("Get resource (JSON)", function() {
            // resource result for the sample context are defined in widget-context-1.0.js
            // this will encounter a java security error if from file://
            expect(1);
            stop();
            context.getResource({
                url: "resource.json",
                format: "json",
                success:  function(response) {
                    equals(response.data.sample, "hello");
                    start();
                },
                error:  function(error) {
                    equals(true, false, "Error getting resource (security error is expected if you are running from file://).  Actual error: " + error);
                    start();
                }
            }, this);
        });

        test("Get resource (invalid)", function() {
            // resource result for the sample context are defined in widget-context-1.0.js
            // this will encounter a java security error if from file://
            expect(1);
            stop();
            context.getResource({
                url: "invalid.json",
                format: "json",
                success:  function(response) {
                    equals(true, false);
                    start();
                },
                error:  function(error) {
                    equals(true, true, "Error is expected");
                    start();
                }
            }, this);
        });
    }, this);
}

function testNavigate(dest) {
    context.navigate("http://www.mindspark.com", dest);
}

function testClose() {
    context.close();
}

function testResize() {
    context.setSize(Math.floor(Math.random()*600)+200, Math.floor(Math.random()*400)+200);
}

function testHandleError() {
    context.handleError("woops");
}