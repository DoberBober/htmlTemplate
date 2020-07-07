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
const server = () => {
	browserSync.init({
		server: {
			baseDir: "./public"
		}
	});
}
exports.server = server;

// Images.
const images = () => {
	return gulp.src([dev + 'images/*', dev + 'images/*/*', '!' + dev + 'images/icons', '!' + dev + 'images/icons/*'])
		.pipe(gulp.dest(prod + 'images'))
		.pipe(browserSync.stream());
}
exports.images = images;

// Assets.
const assets = () => {
	return gulp.src([dev + 'assets/*', dev + 'assets/*/*'])
		.pipe(gulp.dest(prod + 'assets'))
		.pipe(browserSync.stream());
}
exports.assets = assets;

// Fonts.
const fonts = () => {
	return gulp.src(dev + 'fonts/*')
		.pipe(gulp.dest(prod + 'fonts'))
		.pipe(browserSync.stream());
}
exports.fonts = fonts;

// Pages.
const pages = () => {
	return gulp.src(dev + 'pages/*.pug')
		.pipe(errorNotifier())
		.pipe(pug({
			pretty: '	'
		}))
		.pipe(gulp.dest('./public'))
		.pipe(browserSync.stream());
}
exports.pages = pages;

// Styles.
const styles = () => {
	return gulp.src(dev + 'styles/*.styl')
		.pipe(errorNotifier())
		.pipe(sourcemaps.init())
		.pipe(stylus())
		// .pipe(postcss(postplugins))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
}
exports.styles = styles;

// CSS.
const css = () => {
	return gulp.src(dev + 'styles/*.css')
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
}
exports.css = css;

// JS / Block JS.
const scripts = () => {
	return gulp.src([dev + 'blocks/*/*.js', dev + 'js/*.js'])
		.pipe(sourcemaps.init())
		.pipe(concatJs('main.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(prod + 'js'))
		.pipe(browserSync.stream());
}
exports.scripts = scripts;

// Libs.
const libs = () => {
	return gulp.src(mainBowerFiles())
		.pipe(gulp.dest(dev + 'libs'));
}
exports.libs = libs;

// CSS libs.
const pluginsCss = () => {
	return gulp.src(dev + 'libs/*.css')
		.pipe(concatCss('plugins.css'))
		.pipe(gulp.dest(prod + 'css'))
		.pipe(browserSync.stream());
}
exports.pluginsCss = pluginsCss;

// JS libs.
const pluginsJs = () => {
	return gulp.src(dev + 'libs/*.js')
		.pipe(concatJs('plugins.js'))
		.pipe(gulp.dest(prod + 'js'))
		.pipe(browserSync.stream());
}
exports.pluginsJs = pluginsJs;

// SVG-sprite.
const svgSpriteBuild = () => {
	return gulp.src(dev + 'images/icons/*.svg')
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
}
exports.svgSpriteBuild = svgSpriteBuild;


/* Deploy tasks. */
// Images optimization.
const imageOptimization = () => {
	return gulp.src(dev + 'images/*.{jpg, jpeg, png}')
		.pipe(tinypng('KEY'))
		.pipe(gulp.dest(prod + 'images'));
}
exports.imageOptimization = imageOptimization;

// ttf2woff.
const ttfToWoff = () => {
	return gulp.src([dev + 'fonts/*.ttf'])
		.pipe(ttf2woff())
		.pipe(gulp.dest(prod + 'fonts'));
}
exports.ttfToWoff = ttfToWoff;

// ttf2woff2.
const ttf2ToWoff2 = () => {
	return gulp.src([dev + 'fonts/*.ttf'])
		.pipe(ttf2woff2())
		.pipe(gulp.dest(prod + 'fonts'));
}
exports.ttf2ToWoff2 = ttf2ToWoff2;

// CSS minification.
const cssMin = () => {
	return gulp.src([prod + 'css/*.css'])
		.pipe(cssmin())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(prod + 'css'));
}
exports.cssMin = cssMin;

// JS minification.
const jsMin = () => {
	return gulp.src([prod + 'js/*.js'])
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(prod + 'js'));
}
exports.jsMin = jsMin;

// Watch
const watchFiles = () => {
	// Assets.
	watch([dev + 'assets/*'], gulp.parallel(assets));
	watch([dev + 'assets/*/*'], gulp.parallel(assets));
	// Images.
	watch([dev + 'images/*'], gulp.parallel(images));
	watch([dev + 'images/*/*', '!' + dev + 'images/icons/*'], gulp.parallel(images));
	// Fonts.
	watch([dev + 'fonts/*'], gulp.parallel(fonts));
	// Pages.
	watch([dev + 'pages/*.pug'], gulp.parallel(pages));
	// Reloader.
	watch([dev + 'blocks/*/*'], gulp.parallel(pages));
	// Styles.
	watch([dev + 'styles/*.styl'], gulp.parallel(styles));
	// Block styles.
	watch([dev + 'blocks/*/*.styl'], gulp.parallel(styles));
	// CSS.
	watch([dev + 'styles/*.css'], gulp.parallel(css));
	// JS.
	watch([dev + 'js/*.js'], gulp.parallel(scripts));
	// Block scripts.
	watch([dev + 'blocks/*/*.js'], gulp.parallel(scripts));
	// CSS libs.
	watch([dev + 'libs/*.css'], gulp.parallel(pluginsCss));
	// JS libs.
	watch([dev + 'libs/*.js'], gulp.parallel(pluginsJs));
	// SVG-sprite.
	watch([dev + 'images/icons/*.svg'], gulp.parallel(svgSpriteBuild));
}
exports.watchFiles = watchFiles;

// Default.
exports.default = gulp.parallel(
	server,
	images,
	// libs,
	assets,
	fonts,
	pages,
	css,
	styles,
	scripts,
	pluginsCss,
	pluginsJs,
	svgSpriteBuild,
	watchFiles
)

// Deploy.
const deploy = () => {
	gulp.start(ttfToWoff);
	gulp.start(ttfToWoff2);
	gulp.start(imageOptimization);
	gulp.start(cssMin);
	gulp.start(jsMin);
}
exports.deploy = deploy;
