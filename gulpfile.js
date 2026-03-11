const { src, dest, parallel, series, watch } = require( 'gulp' );
const glob = require( 'glob' );
const sass = require( 'gulp-sass' )( require( 'sass' ) );
const postcss = require( 'gulp-postcss' );
const autoprefixer = require( 'autoprefixer' );
const uglify = require( 'gulp-uglify' );
const concat = require( 'gulp-concat' );
const saveLicense = require( 'uglify-save-license' );
const babel = require( 'gulp-babel' );
const through = require( 'through2' );
const argv = require( 'yargs' ).argv;
const bump = require( 'gulp-bump' );
const replace = require( 'gulp-replace' );
const browserSync = require( 'browser-sync' ).create();

const compileJs = () => {
  return src( [
      './src/js/hc-offcanvas-nav.js',
      './src/js/hc-offcanvas-nav.helpers.js'
    ] )
    .pipe( concat( 'hc-offcanvas-nav.js' ) )
    .pipe( babel(
      {
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              loose: true,
              exclude: [ 'transform-typeof-symbol' ]
            }
          ]
        ]
      }
    ) )
    .pipe( argv.dev ? through.obj() : uglify( {
      output: {
        comments: saveLicense
      }
    } ) )
    .pipe( dest( './docs/' ) )
    .pipe( dest( './dist/' ) );
};

const compileScss = () => {
  return src( [ './src/scss/*.scss' ] )
    .pipe( sass.sync( {
      'includePaths': [ 'node_modules' ],
      'outputStyle': argv.dev ? 'expanded' : 'compressed'
    } ).on( 'error', sass.logError ) )
    .pipe( postcss( [ autoprefixer() ] ) )
    .pipe( dest( './dist/' ) );
};

const compileDemoScss = () => {
  return src( [ './docs/demo.scss' ] )
    .pipe( sass.sync( {
      'includePaths': [ 'node_modules' ],
      'outputStyle': argv.dev ? 'expanded' : 'compressed'
    } ).on( 'error', sass.logError ) )
    .pipe( postcss( [ autoprefixer() ] ) )
    .pipe( dest( './docs/' ) );
};

const bumpPackage = () => {
  return src( './*.json' )
    .pipe( bump( argv.ver && argv.ver.indexOf( '.' ) > -1 ? { version: argv.ver } : { type: argv.ver || 'patch' } ) )
    .pipe( dest( './' ) );
};

const bumpJs = () => {
  const pkg = require( './package.json' );
  return src( [ './src/js/*.js' ] )
    .pipe( replace( / \* Version: ([\d\.]+)/g, () => {
      return ` * Version: ${pkg.version}`;
    } ) )
    .pipe( dest( './src/js/' ) );
};

const bumpHtml = () => {
  const pkg = require( './package.json' );
  return src( [ './docs/*.html' ] )
    .pipe( replace( /\?ver=([\d\.]+)/g, () => {
      return `?ver=${pkg.version}`;
    } ) )
    .pipe( replace( /v<span>([\d\.]+)/g, () => {
      return `v<span>${pkg.version}`;
    } ) )
    .pipe( dest( './docs/' ) );
};

const serve = ( done ) => {
  browserSync.init( {
    server: { baseDir: './docs/' },
    port: 3000,
    open: true
  } );
  done();
};

const reload = ( done ) => {
  browserSync.reload();
  done();
};

const defaultTask = parallel( compileJs, compileScss, compileDemoScss );

const watchFiles = () => {
  const watch_scss = glob.sync( './src/scss/*.scss' );
  const watch_js = glob.sync( './src/js/*.js' );
  const watch_demo = glob.sync( './docs/demo.scss' );

  watch( watch_scss, series( parallel( compileScss, compileDemoScss ), reload ) );
  watch( watch_demo, series( compileDemoScss, reload ) );
  watch( watch_js, series( compileJs, reload ) );
};

module.exports.default = defaultTask;
module.exports.watch = series( defaultTask, watchFiles );
module.exports.bump = series( bumpPackage, bumpJs, bumpHtml, compileJs );
module.exports.demo = series( defaultTask, serve, watchFiles );
