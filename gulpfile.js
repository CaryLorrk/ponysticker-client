var gulp = require('gulp');
var del = require('del');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');

var minifyHtml = require('gulp-minify-html');
var ngHtmlify = require('gulp-angular-htmlify');
var ngAnnotate = require('gulp-ng-annotate');

var minifyCss = require('gulp-minify-css');

gulp.task('js', function() {
    return gulp.src([
        'dev/lib/jquery/jquery-1.11.2.js',
        'dev/lib/ionic/js/ionic.bundle.js',
        'dev/lib/angular-translate/**/*.js',
        'dev/lib/**/*.js',
        'dev/js/utilites.js',
        'dev/js/ponysticker.js',
        'dev/js/*/module.js',
        'dev/js/**/*.js'])
            .pipe(plumber())
            .pipe(concat('ponysticker.concat.js'))
            .pipe(ngAnnotate())
            .pipe(uglify())
            .pipe(rename('ponysticker.min.js'))
            .pipe(gulp.dest('www/js'));
});

gulp.task('i18n', function() {
    gulp.src(['dev/i18n/**/*'])
    .pipe(gulp.dest('www/i18n'));
});

gulp.task('res', function() {
    gulp.src(['./dev/lib/ionic/fonts/*'])
    .pipe(gulp.dest('www/fonts'));
});

gulp.task('html', function() {
    gulp.src(['dev/**/*.html'])
    //.pipe(ngHtmlify())
    .pipe(minifyHtml({empty: true}))
    .pipe(gulp.dest('www'));
});

gulp.task('css', function() {
    gulp.src(['dev/lib/**/*.css',
        'dev/css/*.css'])
    .pipe(concat('ponysticker.concat.css'))
    .pipe(minifyCss())
    .pipe(rename('ponysticker.min.css'))
    .pipe(gulp.dest('www/css'));
});

gulp.task('clean', function(cb) {
    del(['www/*', '!www/README.md', '!www/.git'], cb);
}); 

gulp.task('default', ['clean'], function() {
    gulp.start('js', 'html', 'css', 'i18n', 'res');
});

gulp.task('watch', ['default'], function() {
    watch('dev/**/*.js', function() {
        gulp.start('js');
    });
    watch('dev/**/*.html', function() {
        gulp.start('html');
    });
    watch('dev/**/*.css', function() {
        gulp.start('css');
    });

    watch('dev/i18n/**/*', function() {
        gulp.start('i18n');
    });
});
