
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

var paths = {
  "staticfiles": "static/**/",
  "bowerlib": "./bower_components/",
  "css": "src/css/",
  "html": "src/",
  "dest": "dist/",  
  "destCss": "dist/css/",
  "destJs": "dist/js/"
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
        .pipe(fileinclude())
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
    port: 9001,
    server: {
      baseDir: ['./dist'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});

// var gulp = require("gulp"),
//     rimraf = require("rimraf"),
//     concat = require("gulp-concat"),
//     cssmin = require("gulp-cssmin"),
//     uglify = require("gulp-uglify");
// 
// var paths = {
//     webroot: "./wwwroot/"
// };
// 
// paths.js = paths.webroot + "js/**/*.js";
// paths.minJs = paths.webroot + "js/**/*.min.js";
// paths.css = paths.webroot + "css/**/*.css";
// paths.minCss = paths.webroot + "css/**/*.min.css";
// paths.concatJsDest = paths.webroot + "js/site.min.js";
// paths.concatCssDest = paths.webroot + "css/site.min.css";
// 
// gulp.task("clean:js", function (cb) {
//     rimraf(paths.concatJsDest, cb);
// });
// 
// gulp.task("clean:css", function (cb) {
//     rimraf(paths.concatCssDest, cb);
// });
// 
// gulp.task("clean", ["clean:js", "clean:css"]);
// 
// gulp.task("min:js", function () {
//     return gulp.src([paths.js, "!" + paths.minJs], { base: "." })
//         .pipe(concat(paths.concatJsDest))
//         .pipe(uglify())
//         .pipe(gulp.dest("."));
// });
// 
// gulp.task("min:css", function () {
//     return gulp.src([paths.css, "!" + paths.minCss])
//         .pipe(concat(paths.concatCssDest))
//         .pipe(cssmin())
//         .pipe(gulp.dest("."));
// });
// 
// gulp.task("min", ["min:js", "min:css"]);
