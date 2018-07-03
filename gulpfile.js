const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const saveLicense = require('uglify-save-license');
const babel = require('gulp-babel');
const through = require('through2');
const vinylfs = require('vinyl-fs');
const argv = require('yargs').argv;

gulp.task('js', () => {
  return gulp.src(['./src/js/*.js'])
    .pipe(babel({
      presets: [
        ['env', {
          modules: false
        }]
      ]
    }))
    .pipe(argv.dev ? through.obj() : uglify({
      output: {
        comments: saveLicense
      }
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('scss', () => {
  return vinylfs.src(['./src/scss/*.scss', '!./src/scss/demo.scss'])
    .pipe(sass({
      'outputStyle': argv.dev ? 'development' : 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('demo', () => {
  return gulp.src(['./src/scss/demo.scss'])
    .pipe(sass({
      'outputStyle': argv.dev ? 'development' : 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./demo/'));
});

gulp.task('default', ['js', 'scss', 'demo'], () => {});

gulp.task('watch', ['default'], () => {
  gulp.watch(['./src/js/*.js'], ['js']);
  gulp.watch(['./src/scss/*.scss'], ['scss', 'demo']);
});