const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const stripCssComments = require('gulp-strip-css-comments');
const terser = require('gulp-terser');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

function sassDev() {
    return gulp.src('src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
}

function sassProduction() {
    return gulp.src('src/scss/style.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(stripCssComments({preserve: false}))
        .pipe(autoprefixer())
        .pipe(gulp.dest('dist/css'));
}

function minifyJs() {
    return gulp.src('dist/js/**/*.js')
        .pipe(terser())
        .pipe(gulp.dest('dist/js'));
}

function doBrowserify() {
    return browserify({entries: 'src/js/index.js'})
        .bundle()
        .pipe(source('index.js'))
        .pipe(gulp.dest('dist/js'));
}

function html() {
    return gulp.src('src/**/*.html')
        .pipe(gulp.dest('dist'));
}

function resources() {
    return gulp.src('resources/dev/**/*')
        .pipe(gulp.dest('dist'));
}

function watchSass() {
    return gulp.watch('src/scss/**/*.scss',
        gulp.series(
            sassDev
        )
    );
}

function watchJs() {
    return gulp.watch('src/js/**/*.js',
        gulp.series(
            doBrowserify
        )
    );
}

function watchHtml() {
    return gulp.watch('src/**/*.html',
        gulp.series(
            html
        )
    );
}

function watchResources() {
    return gulp.watch('resources/dev/**/*',
        gulp.series(
            resources
        )
    );
}

gulp.task(
    'watch',
    gulp.parallel(
        gulp.series(
            sassDev,
            watchSass
        ),
        gulp.series(
            doBrowserify,
            watchJs
        ),
        gulp.series(
            html,
            watchHtml
        ),
        gulp.series(
            resources,
            watchResources
        )
    )
);

gulp.task(
    'buildDev',
    gulp.series(
        sassDev,
        doBrowserify,
        html,
        resources
    )
);

gulp.task(
    'buildProduction',
    gulp.series(
        sassProduction,
        doBrowserify,
        minifyJs,
        html
    )
)
