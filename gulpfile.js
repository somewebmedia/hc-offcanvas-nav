const { src, dest, parallel, series, watch } = require('gulp');
const glob = require('glob');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const saveLicense = require('uglify-save-license');
const babel = require('gulp-babel');
const through = require('through2');
const path = require('path');
const argv = require('yargs').argv;

const compileJs = () => {
  return src(['./src/js/*.js'])
    .pipe(babel(
      {
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false
            }
          ]
        ]
      }
    ))
    .pipe(argv.dev ? through.obj() : uglify({
      output: {
        comments: saveLicense
      }
    }))
    .pipe(dest('./demo/'))
    .pipe(dest('./dist/'));
};

const compileScss = () => {
  return src(['./src/scss/*.scss', '!./src/scss/demo.scss'])
    .pipe(sass({
      'includePaths': ['node_modules'],
      'outputStyle': argv.dev ? 'development' : 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(dest('./dist/'));
};

const runDemo = () => {
  return src(['./src/scss/demo.scss'])
    .pipe(sass({
      'includePaths': ['node_modules'],
      'outputStyle': argv.dev ? 'development' : 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(dest('./demo/'));
};

const defaultTask = series(parallel(compileJs, compileScss), runDemo);

const watchFiles = () => {
  const watch_scss = glob.sync('./src/scss/*.scss');
  const watch_js = glob.sync('./src/js/*.js');

  watch(watch_scss, series(compileScss, runDemo));
  watch(watch_js, compileJs);
};

module.exports.default = defaultTask;
module.exports.watch = series(defaultTask, watchFiles);