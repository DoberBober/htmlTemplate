"use strict";

const browserSync = require("browser-sync");
const cached = require("gulp-cached");
const cheerio = require("gulp-cheerio");
const concatCss = require("gulp-concat-css");
const concatJs = require("gulp-concat");
const csso = require("gulp-csso");
const errorNotifier = require("gulp-error-notifier");
const gulp = require("gulp");
const pug = require("gulp-pug");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const svgmin = require("gulp-svgmin");
const svgSprite = require("gulp-svg-sprite");
const terser = require("gulp-terser");
const realFavicon = require("gulp-real-favicon");
const fs = require("fs");

const FAVICON_DATA_FILE = "faviconData.json";
const dev = "./dev/";
const prod = "./public/";
const MANIFEST_INFO = dev + "root/manifestInfo.json";

/* Main tasks. */
// Server.
const server = () => {
	browserSync.init({
		server: {
			baseDir: "./public",
			serveStaticOptions: {
				extensions: ["html"],
			},
		},
	});
};
exports.server = server;

// Assets.
const assets = () => {
	return gulp
		.src(
			[
				dev + "assets/*",
				dev + "assets/**/*",
				"!" + dev + "assets/icons",
				"!" + dev + "assets/icons/*",
			],
			{ encoding: false }
		)
		.pipe(gulp.dest(prod + "assets"))
		.pipe(browserSync.stream());
};
exports.assets = assets;

// Images.
const images = () => {
	return gulp
		.src([dev + "images/*", dev + "images/**/*"])
		.pipe(gulp.dest(prod + "images"))
		.pipe(browserSync.stream());
};
exports.images = images;

// Fonts.
const fonts = () => {
	return gulp
		.src(dev + "fonts/*")
		.pipe(gulp.dest(prod + "fonts"))
		.pipe(browserSync.stream());
};
exports.fonts = fonts;

// Pages.
const pages = () => {
	return gulp
		.src([dev + "layouts/*.pug", dev + "pages/*.pug"])
		.pipe(errorNotifier())
		.pipe(
			pug({
				pretty: "	",
			})
		)
		.pipe(cached("pug"))
		.pipe(gulp.dest("./public"))
		.pipe(browserSync.stream());
};
exports.pages = pages;

// Styles.
const styles = () => {
	return gulp
		.src(dev + "styles/*.scss")
		.pipe(errorNotifier())
		.pipe(sourcemaps.init())
		.pipe(
			sass({
				silenceDeprecations: ["import"],
			}).on("error", sass.logError)
		)
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(prod + "css"))
		.pipe(
			csso({
				restructure: false,
			})
		)
		.pipe(
			rename({
				suffix: ".min",
			})
		)
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(prod + "css"))
		.pipe(browserSync.stream());
};
exports.styles = styles;

// CSS.
const css = () => {
	return gulp
		.src(dev + "styles/*.css")
		.pipe(gulp.dest(prod + "css"))
		.pipe(browserSync.stream());
};
exports.css = css;

// JS / Block JS.
const scripts = () => {
	return gulp
		.src([dev + "js/*.js", dev + "blocks/**/*.js"])
		.pipe(sourcemaps.init())
		.pipe(concatJs("main.js"))
		.pipe(gulp.dest(prod + "js"))
		.pipe(
			rename({
				suffix: ".min",
			})
		)
		.pipe(terser())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(prod + "js"))
		.pipe(browserSync.stream());
};
exports.scripts = scripts;

// CSS libs.
const pluginsCss = () => {
	return gulp
		.src(dev + "libs/*.css")
		.pipe(concatCss("plugins.css"))
		.pipe(gulp.dest(prod + "css"))
		.pipe(csso())
		.pipe(
			rename({
				suffix: ".min",
			})
		)
		.pipe(gulp.dest(prod + "css"))
		.pipe(browserSync.stream());
};
exports.pluginsCss = pluginsCss;

// JS libs.
const pluginsJs = () => {
	return gulp
		.src(dev + "libs/*.js")
		.pipe(concatJs("plugins.js"))
		.pipe(gulp.dest(prod + "js"))
		.pipe(
			rename({
				suffix: ".min",
			})
		)
		.pipe(terser())
		.pipe(gulp.dest(prod + "js"))
		.pipe(browserSync.stream());
};
exports.pluginsJs = pluginsJs;

// Move CSS-files.
const moveCss = () => {
	return gulp
		.src(dev + "libs/notConcat/*.css")
		.pipe(gulp.dest(prod + "css"))
		.pipe(browserSync.stream());
};
exports.moveCss = moveCss;

// Move JS-files.
const moveJs = () => {
	return gulp
		.src(dev + "libs/notConcat/*.js")
		.pipe(gulp.dest(prod + "js"))
		.pipe(browserSync.stream());
};
exports.moveJs = moveJs;

// SVG-sprite.
const svgSpriteBuild = () => {
	return gulp
		.src(dev + "assets/icons/*.svg")
		.pipe(
			svgmin({
				js2svg: {
					pretty: true,
				},
			})
		)
		.pipe(
			cheerio({
				run: function ($) {
					$("[fill]").removeAttr("fill");
					$("[stroke]").removeAttr("stroke");
					$("[style]").removeAttr("style");
					$("[xmlns]").removeAttr("xmlns");
				},
				parserOptions: {
					xmlMode: true,
				},
			})
		)
		.pipe(replace("&gt;", ">"))
		.pipe(
			svgSprite({
				mode: {
					symbol: {
						sprite: "../sprite.svg",
						svg: {
							xmlDeclaration: false,
						},
					},
				},
			})
		)
		.pipe(gulp.dest(prod + "assets"))
		.pipe(browserSync.stream());
};
exports.svgSpriteBuild = svgSpriteBuild;

/* Deploy tasks. */
// Generate favicons.
const generateFavicon = (done) => {
	realFavicon.generateFavicon(
		{
			masterPicture: dev + "root/favicon.png",
			dest: prod,
			iconsPath: "/",
			design: {
				ios: {
					pictureAspect: "backgroundAndMargin",
					backgroundColor: "#000000",
					margin: "28%",
					assets: {
						ios6AndPriorIcons: false,
						ios7AndLaterIcons: false,
						precomposedIcons: false,
						declareOnlyDefaultIcon: true,
					},
				},
				desktopBrowser: {
					design: "raw",
				},
				windows: {
					pictureAspect: "noChange",
					backgroundColor: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
						"windowsThemeColor"
					],
					onConflict: "override",
					assets: {
						windows80Ie10Tile: false,
						windows10Ie11EdgeTiles: {
							small: false,
							medium: true,
							big: false,
							rectangle: false,
						},
					},
				},
				androidChrome: {
					pictureAspect: "noChange",
					themeColor: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
						"androidThemeColor"
					],
					manifest: {
						name: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
							"appName"
						],
						startUrl: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
							"startUrl"
						],
						display: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
							"showingType"
						],
						orientation: "notSet",
						onConflict: "override",
						declared: true,
					},
					assets: {
						legacyIcon: false,
						lowResolutionIcons: false,
					},
				},
				safariPinnedTab: {
					pictureAspect: "silhouette",
					themeColor: JSON.parse(fs.readFileSync(MANIFEST_INFO))[
						"safariPinnedColor"
					],
				},
			},
			settings: {
				scalingAlgorithm: "Mitchell",
				errorOnImageTooSmall: false,
				readmeFile: false,
				htmlCodeFile: false,
				usePathAsIs: false,
			},
			markupFile: FAVICON_DATA_FILE,
		},
		function () {
			done();
		}
	);
};
exports.generateFavicon = generateFavicon;

// Inject favicons.
const injectFaviconMarkups = () => {
	return gulp
		.src([prod + "*.html"])
		.pipe(
			realFavicon.injectFaviconMarkups(
				JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code
			)
		)
		.pipe(gulp.dest(prod));
};
exports.injectFaviconMarkups = injectFaviconMarkups;

// Move root-files.
const root = () => {
	return gulp
		.src([
			dev + "root/*",
			"!" + dev + "root/favicon.png",
			"!" + dev + "root/manifestInfo.json",
		])
		.pipe(gulp.dest(prod))
		.pipe(browserSync.stream());
};
exports.root = root;

// Watch
const watchFiles = () => {
	// Assets.
	gulp.watch(
		[dev + "assets/**/*", "!" + dev + "assets/icons/*"],
		gulp.series(assets)
	);
	// Images.
	gulp.watch([dev + "images/**/*"], gulp.series(images));
	// Fonts.
	gulp.watch([dev + "fonts/*"], gulp.series(fonts));
	// Pages.
	gulp.watch(
		[dev + "layouts/*.pug", dev + "pages/*.pug", dev + "blocks/**/*.pug"],
		gulp.series(pages)
	);
	// Styles and block styles.
	gulp.watch(
		[dev + "styles/**/*.scss", dev + "blocks/**/*.scss"],
		gulp.series(styles)
	);
	// CSS.
	gulp.watch([dev + "styles/*.css"], gulp.series(css));
	// JS and block js.
	gulp.watch([dev + "js/*.js", dev + "blocks/**/*.js"], gulp.series(scripts));
	// CSS libs.
	gulp.watch([dev + "libs/*.css"], gulp.series(pluginsCss));
	// JS libs.
	gulp.watch([dev + "libs/*.js"], gulp.series(pluginsJs));
	// CSS not libs.
	gulp.watch([dev + "libs/notConcat/*.css"], gulp.series(moveCss));
	// JS not libs.
	gulp.watch([dev + "libs/notConcat/*.js"], gulp.series(moveJs));
	// SVG-sprite.
	gulp.watch([dev + "assets/icons/*.svg"], gulp.series(svgSpriteBuild));
};
exports.watchFiles = watchFiles;

// Default.
exports.default = gulp.parallel(
	server,
	images,
	assets,
	fonts,
	pages,
	css,
	styles,
	scripts,
	pluginsCss,
	pluginsJs,
	moveCss,
	moveJs,
	svgSpriteBuild,
	watchFiles
);

// Favicons.
const favicons = gulp.series(generateFavicon, injectFaviconMarkups);
exports.favicons = favicons;

// Deploy.
const deploy = gulp.series(
	images,
	assets,
	fonts,
	pages,
	css,
	styles,
	scripts,
	pluginsCss,
	pluginsJs,
	moveCss,
	moveJs,
	svgSpriteBuild,
	favicons,
	root
);
exports.deploy = deploy;
