"use strict";

const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const cheerio = require('gulp-cheerio');
const concatCss = require('gulp-concat-css');
const concatJs = require('gulp-concat');
const cssmin = require('gulp-cssmin');
const errorNotifier = require('gulp-error-notifier');
const gulp = require('gulp');
const mainBowerFiles = require('main-bower-files');
const postcss = require('gulp-postcss');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('gulp-stylus');
const svgmin = require('gulp-svgmin');
const svgSprite = require('gulp-svg-sprite');
const tinypng = require('gulp-tinypng');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');

let postplugins = [autoprefixer];

var dev = "./dev/";
var prod = "./public/";

/* Main tasks. */
// Server.
gulp.task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: "./public"
		}
	});
});
// Images.
gulp.task('images', function() {
	gulp.src([dev + 'images/*', dev + 'images/*/*', '!' + dev + 'images/icons', '!' + dev + 'images/icons/*'])
		.pipe(gulp.dest(prod + 'images'))
		.pipe(browserSync.stream());
});
// Assets.
gulp.task('assets', function() {
	gulp.src([dev + 'assets/*', dev + 'assets/*/*'])
		.pipe(gulp.dest(prod + 'assets'))
		.pipe(browserSync.stream());
});
// Fonts.
gulp.task('fonts', function() {
	gulp.src(dev + 'fonts/*')
		.pipe(gulp.dest(prod + 'fonts'))
		.pipe(browserSync.stream());
})
// Pages.
gulp.task('pages', function() {
	gulp.src(dev + 'pages/*.pug')
		.pipe(errorNotifier())
		.pipe(pug({
			pretty: '	'
		}))
		.pipe(gulp.dest('./public'))
		.pipe(browserSync.stream());
})
// Styles.
gulp.task('styles', function() {
	gulp.src(dev + 'styles/*.styl')
		.pipe(errorNotifier())
		.pipe(sourcemaps.init())
		.pipe(stylus())
		.pipe(postcss(postplugins))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
})
// CSS.
gulp.task('css', function() {
	gulp.src(dev + 'styles/*.css')
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
})
// JS / Block JS.
gulp.task('scripts', function() {
	gulp.src([dev + 'blocks/*/*.js', dev + 'js/*.js'])
		.pipe(sourcemaps.init())
		.pipe(concatJs('main.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(prod + 'js'))
		.pipe(browserSync.stream());
})
// Libs.
gulp.task('libs', function() {
	gulp.src(mainBowerFiles())
		.pipe(gulp.dest(dev + 'libs'));
});
// CSS libs.
gulp.task('pluginsCss', function() {
	gulp.src(dev + 'libs/*.css')
		.pipe(concatCss('plugins.css'))
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
});
// JS libs.
gulp.task('pluginsJs', function() {
	gulp.src(dev + 'libs/*.js')
		.pipe(concatJs('plugins.js'))
		.pipe(gulp.dest(prod + 'js'))
		.pipe(browserSync.stream());
});
// SVG-sprite.
gulp.task('svgSpriteBuild', function() {
	gulp.src(dev + 'images/icons/*.svg')
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(cheerio({
			run: function($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
				$('[xmlns]').removeAttr('xmlns');
			},
			parserOptions: {
				xmlMode: true
			}
		}))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "../sprite.svg",
					svg: {
						xmlDeclaration: false
					}
				}
			}
		}))
		.pipe(gulp.dest(prod + 'images'))
		.pipe(browserSync.stream());
});

/* Deploy tasks. */
// Images optimization.
gulp.task('tinypng', function() {
	gulp.src(dev + 'images/*.{jpg, jpeg, png}')
		.pipe(tinypng('KEY'))
		.pipe(gulp.dest(prod + 'images'));
});
// ttf2woff.
gulp.task('ttf2woff', function() {
	gulp.src([dev + 'fonts/*.ttf'])
		.pipe(ttf2woff())
		.pipe(gulp.dest(prod + 'fonts'));
});
// ttf2woff2.
gulp.task('ttf2woff2', function() {
	gulp.src([dev + 'fonts/*.ttf'])
		.pipe(ttf2woff2())
		.pipe(gulp.dest(prod + 'fonts'));
});
// CSS minification.
gulp.task('cssMin', function() {
	gulp.src([prod + 'css/*.css'])
		.pipe(cssmin())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(prod + 'css'));
});
// JS minification.
gulp.task('jsMin', function() {
	gulp.src([prod + 'js/*.js'])
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(prod + 'js'));
});

// Watch
gulp.task('watch', function() {
	// Assets.
	watch([dev + 'assets/*'], gulp.parallel('assets'));
	watch([dev + 'assets/*/*'], gulp.parallel('assets'));
	// Images.
	watch([dev + 'images/*'], gulp.parallel('images'));
	watch([dev + 'images/*/*', '!' + dev + 'images/icons/*'], gulp.parallel('images'));
	// Fonts.
	watch([dev + 'fonts/*'], gulp.parallel('fonts'));
	// Pages.
	watch([dev + 'pages/*.pug'], gulp.parallel('pages'));
	// Reloader.
	watch([dev + 'blocks/*/*'], gulp.parallel('pages'));
	// Styles.
	watch([dev + 'styles/*.styl'], gulp.parallel('styles'));
	// Block styles.
	watch([dev + 'blocks/*/*.styl'], gulp.parallel('styles'));
	// CSS.
	watch([dev + 'styles/*.css'], gulp.parallel('css'));
	// JS.
	watch([dev + 'js/*.js'], gulp.parallel('scripts'));
	// Block scripts.
	watch([dev + 'blocks/*/*.js'], gulp.parallel('scripts'));
	// CSS libs.
	watch([dev + 'libs/*.css'], gulp.parallel('pluginsCss'));
	// JS libs.
	watch([dev + 'libs/*.js'], gulp.parallel('pluginsJs'));
	// SVG-sprite.
	watch([dev + 'images/icons/*.svg'], gulp.parallel('svgSpriteBuild'));
});

// Default.
// v3 gulp.task('default', ['browserSync', 'images', 'fonts', 'pages', 'css', 'styles', 'scripts', 'pluginsCss', 'pluginsJs', 'svgSpriteBuild', 'libs', 'watch']);
gulp.task('default', gulp.parallel('browserSync', 'images', 'assets', 'fonts', 'pages', 'css', 'styles', 'scripts', 'pluginsCss', 'pluginsJs', 'svgSpriteBuild', 'watch'));
// v3 gulp.task('default', ['browserSync', 'images', 'libs', 'fonts', 'pages', 'css', 'styles', 'scripts', 'normalize', 'pluginsCss', 'pluginsJs', 'svgSpriteBuild', 'watch']);
// gulp.task('default', gulp.parallel('browserSync', 'images', 'libs', 'fonts', 'pages', 'css', 'styles', 'scripts', 'normalize', 'pluginsCss', 'pluginsJs', 'svgSpriteBuild', 'watch'));


// Deploy.
gulp.task('deploy', function() {
	gulp.start('ttf2woff');
	gulp.start('ttf2woff2');
	gulp.start('tinypng');
	gulp.start('cssMin');
	gulp.start('jsMin');
});
