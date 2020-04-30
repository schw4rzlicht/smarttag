const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const stripCssComments = require('gulp-strip-css-comments');
const terser = require('gulp-terser');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

function sassDev() {
    return gulp.src('css/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('css'));
}

function sassProduction() {
    return gulp.src('css/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(stripCssComments({preserve: false}))
        .pipe(autoprefixer())
        .pipe(gulp.dest('css'));
}

function minifyJs() {
    return gulp.src('js/*.js')
        .pipe(terser())
        .pipe(gulp.dest('js'));
}

function watchSass() {
    return gulp.watch('css/**/*.scss',
        gulp.series(
            sassDev
        )
    )
}

function doBrowserify() {
    return browserify({entries: 'js/index.js'})
        .bundle()
        .pipe(source('index.js'))
        .pipe(gulp.dest('dist/js'))
}

function watchJs() {
    return gulp.watch('js/index.js',
        gulp.series(
            doBrowserify
        )
    )
}

gulp.task(
    'watch',
    gulp.series(
        sassDev,
        watchSass
    )
);

gulp.task(
    'buildDev',
    gulp.series(
        sassDev
    )
);

gulp.task(
    'buildProduction',
    gulp.series(
        sassProduction,
        minifyJs
    )
)

gulp.task(
    'watchJs',
    gulp.series(
        doBrowserify,
        watchJs
    )
)
