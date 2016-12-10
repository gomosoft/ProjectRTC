

var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache');
var minifycss = require('gulp-minify-css');
var less = require('gulp-less');
var browserSync = require('browser-sync');

var folder911 = "911videos/";
var folderBase = "base/";
var styles911 = folder911 + "resources/css/";
var stylesBase = folderBase + "resources/css/";
var scripts911 = [folder911 + "*.js", folder911 + "resources/js/**/*.js"];
var scriptsBase = [folderBase + "*.js", folderBase + "resources/js/**/*.js"];

var styles911dest = folder911 +  "resources/css/dist/";
var stylesBasedest = folderBase + "resources/css/dist/";
var scripts911dest = folder911 + "resources/prod/js/dist/";
var scriptsBaesedest = folderBase + "resources/prod/js/dist/";


gulp.task('browser-sync', function() {
  browserSync({
    port: 3006,
    proxy: "http://localhost:3000",
    files: ["*"],
  });
});

gulp.task('bs-reload', function () {
  browserSync.reload();
});


gulp.task('baseScripts', function(){
    
     return gulp.src(scriptsBase)
    .pipe(plumber({
      errorHandler: function (error) {
        console.log(error.message);
        this.emit('end');
    }}))
    .pipe(concat('main.js'))
    .pipe(gulp.dest(scriptsBaesedest))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(scriptsBaesedest))
    .pipe(browserSync.reload({stream:true}))

})



gulp.task('default', ['browser-sync'], function(){
 
 
  gulp.watch(["views/**/*.ejs", "views/**/*.html", "public/**/*.js", "public/**/*.css", "public/**/*.less"], ['bs-reload']);

});