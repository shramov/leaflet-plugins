module.exports = function (karma) {
    karma.set({
        // base path, that will be used to resolve files and exclude
        basePath: './',
        // list of files / patterns to load in the browser
        files: [
            './node_modules/bluebird/js/browser/bluebird.min.js', //shim Promise for PhantomJS
            './node_modules/leaflet/dist/leaflet-src.js',
            './layer/tile/Google.js',
            './specs/**/*.js'
        ],
        // Frameworks
        frameworks: ['mocha', 'chai'],

        // list of files to exclude
        exclude: [],

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari
        // - PhantomJS
        browsers: process.env.KARMA_BROWSERS ?  process.env.KARMA_BROWSERS.split(',') : ['PhantomJS'],

        // test results reporter to use
        // possible values: dots || progress
        reporters: ['mocha'],

        // web server port
        port: 9018,

        // cli runner port
        runnerPort: 9100,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: karma.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};
