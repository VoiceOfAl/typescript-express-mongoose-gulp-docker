var gulp            = require("gulp"),
    ts              = require("gulp-typescript"),
    tsProject       = ts.createProject("tsconfig.json"),
    clientTsProject = ts.createProject("client/tsconfig.json"),
    webpack         = require('webpack-stream'),
    nodemon         = require('gulp-nodemon'),
    spawn           = require('child_process').spawn,
    mocha           = require('gulp-spawn-mocha'),
    tslint          = require("gulp-tslint"),
    newer           = require('gulp-newer'),
    sourcemaps      = require('gulp-sourcemaps'),
    sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer'),
    livereload      = require('gulp-livereload'),
    rimraf          = require('rimraf')
  ;

//www
gulp.task('default', ['www']);
gulp.task('www', ['serve', 'www-watch', 'client-watch', 'public-watch-sass', 'static-move-watch'], function () {

});

gulp.task('serve', ['build-dist'], function () {
  nodemon({
    script: './dist/server/server',
    ext   : 'js',
  }).on('restart', function () {
    setTimeout(function () {
      livereload.changed();
    }, 500);
  });
});

/**
 * Watchers
 */
gulp.task('www-watch', function () {
  // restarts the server when server side code changes, or the client side asset map
  return gulp.watch(['server/**/*.ts', 'dist/assets/webpack-assets.json'], ["compile-typescript"]);
});

gulp.task('client-watch', function () {
  return gulp.watch(['client/**/*.ts', 'client/**/*.tsx'], ["client-compile-typescript"]);
});

gulp.task('public-watch-sass', function () {
  return gulp.watch(['public/**/*.scss'], ["public-compile-sass"]);
});

var filesToMove = ['public/**/*', 'views/**/*', '!public/sass/**/*', '!public/sass'];

gulp.task("move-files", function () {
  return gulp.src(filesToMove, { base: '.' })
    .pipe(gulp.dest('dist'));
});

gulp.task('static-move-watch', function () {
  return gulp.watch(filesToMove, ["move-files"]);
});
// END Watchers


// Server build

gulp.task("build-dist", ['compile-typescript', 'client-compile-typescript', 'public-compile-sass', 'move-files']);

gulp.task("compile-typescript", ["ts-lint"], function () {
  var tsResult = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(tsProject());

  return tsResult.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("dist"));
});

gulp.task("ts-lint", function () {
  return tsProject.src()
    .pipe(tslint({
      formatter: "prose"
    }))
    .pipe(tslint.report({
      summarizeFailureOutput: false
    }));
});


// Client build

gulp.task("client-compile-typescript", ["client-ts-lint"], function () {
  return clientTsProject.src()
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest('dist/assets'));
});

gulp.task("client-ts-lint", function () {
  return clientTsProject.src()
    .pipe(tslint({
      formatter: "prose"
    }))
    .pipe(tslint.report({
      summarizeFailureOutput: false
    }));
});


// Sass compile

gulp.task('public-compile-sass', function () {
  return gulp.src('./public/sass/index.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .pipe(gulp.dest('dist/public/css/'));
});


//Testing
gulp.task('test', ["run-tests", "test-watch"]);

gulp.task('run-tests', ['build-dist'], function () {
  return gulp
    .src(['./dist/test/*.js'])
    .pipe(mocha());
});

gulp.task('test-watch', function () {
  gulp.watch(['server/**/*.ts', 'test/**/*.ts'], ['run-tests']);
});