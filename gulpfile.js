var gulp = require('gulp'),
    changed = require('gulp-changed'),
    autoprefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync'),
    cleanCSS    = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    del = require('del'),
    useref = require('gulp-useref'),
    gulpIf = require('gulp-if'),
    runSequence = require('run-sequence'),
    wiredep = require('gulp-wiredep'),
    gulpIgnore = require('gulp-ignore'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    path = require('path'),
    sourcemaps = require('gulp-sourcemaps'),
    less = require('gulp-less'),
    notify = require('gulp-notify');

gulp.task('svgstore', function () {
  return gulp.src('svg/src/*.svg')
    .pipe(svgmin(function (file) {
      var prefix = path.basename(file.relative, path.extname(file.relative));
      return {
        plugins: [{
          cleanupIDs: {
            prefix: prefix + '-',
            minify: true
          }
        }]
      }
    }))
    .pipe(svgstore())
    .pipe(gulp.dest('svg/dest'));
});

// Start browserSync server
gulp.task('browser-sync', function() {
  browserSync({
      server: {
        baseDir: 'app',
      },
      port: 3000,
      open: true,
      notify: false
  });
});

// Preprocessor Less

gulp.task('less', function () {
  return gulp.src('app/less/main.less')
    .pipe(sourcemaps.init())
    // .pipe(debug({title: "LESS:"}))
    .pipe(less())
    .on('error', notify.onError(function(err){
      return {
        title: 'Styles compilation error',
        message: err.message
      }
    }))
    .pipe(autoprefixer(['last 4 versions']))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream());
});

// Bower wiredep
gulp.task('bower', function () {
  gulp.src('app/*.html')
    .pipe(wiredep({
      optional: 'app/bower_components'
    }))
    .pipe(gulp.dest('app'));
});

// Copying fonts 
gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));
})

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cleanCSS()))
    .pipe(gulp.dest('dist'));
});

// Optimizing Images
gulp.task('img', function() {
  return gulp.src(['app/img/**/*', '!app/img/imgorigin/**'])
    .pipe(cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest('dist/img'));
});

// Cleaning 
gulp.task('clean', function() {
  return del.sync('dist');
});
gulp.task('cleanimg', function() {
  return del.sync('dist/img/imgorigin');
});
gulp.task('clear', function() {
  return cache.clearAll();
});

// Watchers
gulp.task('watch', ['less', 'browser-sync', 'bower'], function() {
  gulp.watch('app/less/**/*.less', ['less']);
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/js/**/*.js', browserSync.reload);
  gulp.watch('bower.json', ['bower']);
});

// Build

gulp.task('default', ['watch']);

gulp.task('build', function(callback) {
  runSequence(
    'clean',
    ['less', 'bower', 'useref', 'fonts', 'img'], 'cleanimg',
    callback
  )
});