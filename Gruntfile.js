module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        watch: {
            karma: {
                files: ["build/<%= pkg.name %>.js", "test/spec/*.js"],
                tasks: ["karma:watch:run"]
            },
            build: {
                files: ["src/*.js"],
                tasks: ["requirejs:compile"]
            }
        },

        jshint: {
            all: ["src/*.js", "test/spec/*.js", "Gruntfile.js"],
            build: ["build/<%= pkg.name %>.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        jsdoc: {
            dist: {
                src: ["src/*.js"],
                options: {
                    destination: "jsdoc"
                }
            }
        },

        karma: {
            watch: {
                configFile: "test/lib/karma.conf.js",
                background: true,
                reporters: ["coverage", "progress"],
                preprocessors: {
                    "build/*.js": "coverage"
                }
            },
            unit: {
                configFile: "test/lib/karma.conf.js",
                browsers: ["Chrome", "Opera", "Safari", "Firefox", "PhantomJS"],
                singleRun: true
            },
            travis: {
                configFile: "test/lib/karma.conf.js",
                singleRun: true
            }
        },

        shell: {
            checkVersionTag: {
                command: "git tag -a v<%= pkg.version %> -m ''",
                options: { failOnError: true }
            },
            checkoutDocs: {
                command: [
                    // commit all changes
                    "git commit -am 'version <%= pkg.version %>'",

                    // checkout jsdoc branch
                    "git checkout gh-pages"
                ].join(" && ")
            },
            updateDocs: {
                command: [
                    // get a list of all files in stage and delete everything except for targets, node_modules, cache, temp, and logs
                    // rm does not delete root level hidden files
                    "ls | grep -v ^jsdoc$ | grep -v ^node_modules$ | xargs rm -r ",

                    // copy from the stage folder to the current (root) folder
                    "cp -r jsdoc/* . && rm -r jsdoc",

                    // add any files that may have been created
                    "git add -A",

                    // commit all files using the version number as the commit message
                    "git commit -am 'Build: <%= grunt.file.read(\".build\") %>'",

                    // switch back to the previous branch we started from
                    "git checkout -",

                    // update version tag
                    "git tag -af v<%= pkg.version %> -m 'version <%= pkg.version %>'",

                    // push file changed
                    "git push origin --all",

                    // push new tag
                    "git push origin v<%= pkg.version %>"
                ].join(" && "),
                options: {
                    stdout: true,
                    stderr: true
                }
            },
            openCoverage: {
                command: "open coverage/PhantomJS\\ 1.9\\ \\(Mac\\)/index.html"
            },
            openJsdoc: {
                command: "open jsdoc/index.html"
            }
        },

        clean: {
            dist: ["dist/"]
        },

        copy: {
            dist: {
                files: {
                    "dist/<%= pkg.name %>-<%= pkg.version %>.htc": ["<%= pkg.name %>.htc"],
                    "dist/<%= pkg.name %>-<%= pkg.version %>.js": ["<%= pkg.name %>.js"]
                }
            },
            publish: {
                files: {
                    "<%= pkg.name %>.js": ["build/<%= pkg.name %>.js"],
                    "<%= pkg.name %>.htc": ["extra/<%= pkg.name %>.htc"]
                }
            }
        },

        uglify: {
            dist: {
                options: {
                    preserveComments: "some",
                    sourceMap: "dist/<%= pkg.name %>-<%= pkg.version %>.min.src",
                    sourceMappingURL: "<%= pkg.name %>-<%= pkg.version %>.min.src",
                    report: "gzip"
                },
                files: {
                    "dist/<%= pkg.name %>-<%= pkg.version %>.min.js": ["dist/<%= pkg.name %>-<%= pkg.version %>.js"]
                }
            }
        },

        connect: {
            watch: {
                options: {
                    base: "../"
                }
            }
        },

        requirejs: {
            options: {
                useStrict: true,
                baseUrl: "src",
                name: "DOM",
                create: true,
                wrap: {
                    startFile: "extra/start.fragment",
                    endFile: "extra/end.fragment"
                },
                include: [
                    "Node.supports", "Node.find", "Node.data", "Node.contains", "Node.events",
                    "Element.classes", "Element.clone", "Element.manipulation", "Element.matches",
                    "Element.offset", "Element.props", "Element.styles", "Element.toquerystring",
                    "Element.traversing", "Element.visibility", "Collection", "MockElement",
                    "DOM.importstyles", "DOM.create", "DOM.extend","DOM.parsetemplate",
                    "DOM.ready", "DOM.watch", "DOM.mock", "SelectorMatcher", "EventHelper"
                ],
                onBuildWrite: function (id, path, contents) {
                    if ((/define\(.*?\{/).test(contents)) {
                        //Remove AMD ceremony for use without require.js or almond.js
                        contents = contents.replace(/define\(.*?\{\s*"use strict";[\r\n]*/m, "");
                        contents = contents.replace(/\}\);\s*$/, "");
                    }

                    return contents;
                }
            },
            compile: {
                options: {
                    optimize: "none",
                    optimizeCss: "none",
                    out: function(text) {
                        // replace empty define with correct declaration
                        text = text.replace("define(\"DOM\", function(){});\n", "");
                        // write file
                        grunt.file.write(grunt.config.process("build/<%= pkg.name %>.js"), grunt.config.process(text));
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-jsdoc");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-shell");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-requirejs");


    grunt.registerTask("dev", [
        "requirejs:compile",
        "connect", // start web server
        "shell:openCoverage", // open coverage page
        "karma:watch", // start karma server
        "watch" // watch for a file changes
    ]);

    grunt.registerTask("test", [
        "requirejs:compile",
        "jshint",
        "karma:unit"
    ]);

    grunt.registerTask("default", [
        "clean",
        "copy:dist",
        "uglify:dist"
    ]);

    grunt.registerTask("travis", [
        "requirejs:compile",
        "jshint",
        "karma:travis"
    ]);

    grunt.registerTask("publish", "Publish a new version routine", function(version) {
        grunt.config.set("pkg.version", version);

        grunt.registerTask("updateFileVersion", function(filename) {
            var json = grunt.file.readJSON(filename);

            json.version = version;

            grunt.file.write(filename, JSON.stringify(json, null, 4));
        });

        grunt.registerTask("bumpDocsBuild", function () {
            var path = require("path"),
                build = ".build";

            grunt.file.write(build, path.existsSync(build) ? parseInt(grunt.file.read(build), 10) + 1 : 1);
        });

        grunt.task.run([
            "shell:checkVersionTag",
            "test",
            "updateFileVersion:package.json",
            "updateFileVersion:bower.json",
            "copy:publish",
            "jsdoc",
            "shell:checkoutDocs",
            "bumpDocsBuild",
            "shell:updateDocs"
        ]);
    });
};
