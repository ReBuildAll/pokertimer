
"use strict";

var gulp = require('gulp');
var browserSync = require('browser-sync');
var path = require("path");
var fileinclude = require("gulp-file-include");
var rimraf = require("rimraf");
var minifyJS = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var less = require("gulp-less");
var rename = require("gulp-rename");
var minifyCSS = require("gulp-minify-css");
var argv = require('yargs').argv;

var paths = {
  "staticfiles": "static/**/",
  "bowerlib": "./bower_components/",
  "css": "src/css/",
  "html": "src/",
  "dest": "dist/",  
  "destCss": "dist/css/",
  "destJs": "dist/js/"
};

var environment = {
	// The names of the different environments.
	development: "Development",
	staging: "Staging",
	production: "Production",
	// Gets the current hosting environment the application is running under. This comes from the environment variables.
	current: function () {
        return argv.environment
        || process.env["Hosting:Environment"] 
        || this.development 
    },
	// Are we running under the development environment.
	isDevelopment: function () { return this.current() === this.development; },
	// Are we running under the staging environment.
	isStaging: function () { return this.current() === this.staging; },
	// Are we running under the production environment.
	isProduction: function () { return this.current() === this.production; }
};

gulp.task("clean", function (cb) {
	rimraf(paths.dest, cb);
});

gulp.task("staticfiles", function() {
    gulp.src(path.join(paths.staticfiles, "*.*"))   
        .pipe(gulp.dest(paths.dest));    
});

gulp.task('html', [], function() {
    gulp.src(path.join(paths.html, "*.html"))   
        .pipe(fileinclude({
            context: {
                isProduction: environment.isProduction(),
                isStatging: environment.isStaging(),
                isDevelopment: environment.isDevelopment()
            }
        }))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('min_js', [], function() {
    gulp.src(path.join(paths.html, "*.js"))   
        .pipe(sourcemaps.init())
        .pipe(minifyJS({ mangle: true }))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('min_less', [], function() {
    gulp.src(path.join(paths.css, "*.less"))   
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.destCss));
});

gulp.task("copy_lib", function() {
    var libs = [
        "jquery/dist/jquery.min.js",
        "angular/angular.min.js"
    ];
    
    for(var l in libs) {
        gulp.src(path.join(paths.bowerlib, libs[l]))
            .pipe(gulp.dest(paths.destJs));
    }
});

gulp.task('build', ["html", "staticfiles", "min_less", "min_js", "copy_lib"], function() {
});

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve', ['build'], function(done) {
  browserSync({
    online: false,
    open: false,
    port: 9002,
    server: {
      baseDir: ['./dist'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});

