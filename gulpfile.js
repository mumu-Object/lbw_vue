const {src, watch, dest, series} = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const server = require('browser-sync').create();
const rename = require('gulp-rename');
const js = () => {
  return src('./src/*.js')
    .pipe(babel())
    .pipe(dest('test'))
    .pipe(server.reload({stream: true}))
};

const minJs = () => {
  return src('./src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(dest('dist'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(dest('dist'))
};

const html = () => {
  return src('./src/index.html')
    .pipe(dest('test'))
    .pipe(server.reload({stream: true}))
};

const start = () => {
  server.init({
    port: 8080,
    server: {
      baseDir: 'test'
    }
  });
  watch('src/*.js', js);
  watch('src/index.html', html);
};

exports.serve = series(html, js, start);
exports.build = minJs;