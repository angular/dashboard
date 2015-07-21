/// <reference path="./typings/node/node.d.ts" />
var format = require('gulp-clang-format');
var gulp = require('gulp');
var gulpClean = require('gulp-clean');
var gulpTsc = require('gulp-typescript');


// ==========
// config

// Sets typescript compilation options using tsconfig.json.
var tsProject = gulpTsc.createProject('./tsconfig.json');
  

// ==========
// format

/**
 * Checks that all files in modules match the format specified in .clang-format.
 */
gulp.task('check-format', function() {
  return gulp.src('./modules/**/*.ts')
    .pipe(format.checkFormat('file'))
    .on('warning', function(e) { process.stdout.write(e.message); process.exit(1) });
});


// ==========
// compile

gulp.task('!clean', function() {
  return gulp.src('./dist', {read: false}).pipe(gulpClean());
});

/**
 * Transcompile all TypeScript code to JavaScript.
 */
gulp.task('build', ['!clean'], function() {
  var tsResult = gulp.src(['./**/*.ts', '!./node_modules/**']).pipe(gulpTsc(tsProject));
  return tsResult.js.pipe(gulp.dest(tsProject.options.outDir));
});

