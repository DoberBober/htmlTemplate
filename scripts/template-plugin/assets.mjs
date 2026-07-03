import fs from "node:fs/promises";
import path from "node:path";

import * as sass from "sass";

import { dirs } from "./config.mjs";
import { minifyCss, minifyJs } from "./minify.mjs";
import { buildPages } from "./pages.mjs";
import {
	dedupeOutputs,
	fileExists,
	getContentType,
	isCssFile,
	isDotFile,
	isInside,
	isJsFile,
	isPlainCssFile,
	isPugFile,
	isSvgFile,
	listFiles,
	readAndJoin,
	shouldCopyAsset,
	shouldSkipAsset,
	toPosix,
	withQueryHash,
} from "./utils.mjs";

export async function buildOutputs(root, isProd) {
	const outputs = [];
	const styleOutputs = await buildStyles(root, isProd);
	const scriptOutputs = await buildScripts(root, isProd);
	const pluginOutputs = await buildPlugins(root, isProd);
	const spriteOutput = await buildSprite(root);

	outputs.push(...styleOutputs.assets);
	outputs.push(...scriptOutputs.assets);
	outputs.push(...pluginOutputs.assets);
	outputs.push(spriteOutput);
	outputs.push(...(await copyFiles(root, dirs.assets, "assets", shouldCopyAsset)));
	outputs.push(...(await copyFiles(root, dirs.images, "images")));
	outputs.push(...(await copyFiles(root, dirs.fonts, "fonts")));
	outputs.push(...(await copyFiles(root, dirs.root, "", () => true, { includeDotFiles: true })));
	outputs.push(...(await copyFiles(root, path.join(dirs.libs, "notConcat"), "css", isCssFile)));
	outputs.push(...(await copyFiles(root, path.join(dirs.libs, "notConcat"), "js", isJsFile)));
	outputs.push(...(await copyFiles(root, dirs.styles, "css", isPlainCssFile)));
	outputs.push(...(await buildPages(root, isProd, {
		...styleOutputs.manifest,
		...scriptOutputs.manifest,
		...pluginOutputs.manifest,
	})));

	return dedupeOutputs(outputs);
}

export async function getDevAsset(root, pathname) {
	if (pathname === "/css/styles.css" || pathname === "/css/styles.css.map") {
		return getSassDevAsset(root, false, "styles.css", pathname.endsWith(".map"));
	}

	if (pathname === "/css/styles.min.css" || pathname === "/css/styles.min.css.map") {
		return getSassDevAsset(root, true, "styles.min.css", pathname.endsWith(".map"));
	}

	if (pathname === "/js/main.js") {
		return {
			contentType: "text/javascript; charset=utf-8",
			source: await concatMainJs(root),
		};
	}

	if (pathname === "/js/main.min.js" || pathname === "/js/main.min.js.map") {
		return getMinifiedJsDevAsset(
			await concatMainJs(root),
			"main.min.js",
			"main.min.js.map",
			pathname.endsWith(".map")
		);
	}

	if (pathname === "/css/plugins.css" || pathname === "/css/plugins.min.css") {
		const source = await concatFiles(root, dirs.libs, isCssFile);

		return {
			contentType: "text/css; charset=utf-8",
			source: pathname.endsWith(".min.css") ? minifyCss(source) : source,
		};
	}

	if (pathname === "/js/plugins.js") {
		return {
			contentType: "text/javascript; charset=utf-8",
			source: await concatFiles(root, dirs.libs, isJsFile),
		};
	}

	if (pathname === "/js/plugins.min.js" || pathname === "/js/plugins.min.js.map") {
		return getMinifiedJsDevAsset(
			await concatFiles(root, dirs.libs, isJsFile),
			"plugins.min.js",
			"plugins.min.js.map",
			pathname.endsWith(".map")
		);
	}

	if (pathname === "/assets/sprite.svg") {
		return {
			contentType: "image/svg+xml; charset=utf-8",
			source: await createSvgSprite(root),
		};
	}

	return serveDevFile(root, pathname);
}

export async function assertStylesCompile(root) {
	getSassDevAsset(root, true, "styles.min.css", false);
}

async function getSassDevAsset(root, compressed, fileName, isMapRequest) {
	const result = compileSass(root, compressed, true);
	const map = JSON.stringify(result.sourceMap);

	if (isMapRequest) {
		return {
			contentType: "application/json; charset=utf-8",
			source: map,
		};
	}

	return {
		contentType: "text/css; charset=utf-8",
		source: `${result.css}\n/*# sourceMappingURL=${fileName}.map */`,
	};
}

async function getMinifiedJsDevAsset(source, fileName, sourceMapUrl, isMapRequest) {
	const result = await minifyJs(source, {
		withSourceMap: true,
		fileName,
		sourceMapUrl,
	});

	if (isMapRequest) {
		return {
			contentType: "application/json; charset=utf-8",
			source: result.map,
		};
	}

	return {
		contentType: "text/javascript; charset=utf-8",
		source: result.code,
	};
}

async function serveDevFile(root, pathname) {
	const staticCandidates = [
		{ prefix: "/assets/", sourceDir: dirs.assets, exclude: shouldSkipAsset },
		{ prefix: "/images/", sourceDir: dirs.images },
		{ prefix: "/fonts/", sourceDir: dirs.fonts },
		{ prefix: "/css/", sourceDir: path.join(dirs.libs, "notConcat"), filter: isCssFile },
		{ prefix: "/js/", sourceDir: path.join(dirs.libs, "notConcat"), filter: isJsFile },
		{ prefix: "/css/", sourceDir: dirs.styles, filter: isPlainCssFile },
		{ prefix: "/", sourceDir: dirs.root },
	];

	for (const candidate of staticCandidates) {
		if (!pathname.startsWith(candidate.prefix)) {
			continue;
		}

		const relativePath = pathname.slice(candidate.prefix.length);
		const filePath = path.join(root, candidate.sourceDir, relativePath);

		if (!isInside(path.join(root, candidate.sourceDir), filePath)) {
			continue;
		}

		if (candidate.exclude?.(filePath)) {
			continue;
		}

		if (candidate.filter && !candidate.filter(filePath)) {
			continue;
		}

		if (await fileExists(filePath)) {
			return {
				contentType: getContentType(filePath),
				source: await fs.readFile(filePath),
			};
		}
	}

	return null;
}

async function buildStyles(root, isProd) {
	const assets = [];
	const { css } = compileSass(root, false, false);
	const minifiedCss = minifyCss(css);
	const minFileName = "css/styles.min.css";

	assets.push({ fileName: "css/styles.css", source: css });
	assets.push({ fileName: minFileName, source: minifiedCss });

	return {
		assets,
		manifest: {
			"css/styles.min.css": isProd ? withQueryHash(minFileName, minifiedCss) : minFileName,
		},
	};
}

function compileSass(root, compressed, sourceMap) {
	return sass.compile(path.join(root, dirs.styles, "styles.scss"), {
		style: compressed ? "compressed" : "expanded",
		sourceMap,
		sourceMapIncludeSources: sourceMap,
		silenceDeprecations: ["import"],
	});
}

async function buildScripts(root, isProd) {
	const assets = [];
	const js = await concatMainJs(root);
	const minifiedJs = await minifyJs(js);
	const minFileName = "js/main.min.js";

	assets.push({ fileName: "js/main.js", source: js });
	assets.push({ fileName: minFileName, source: minifiedJs });

	return {
		assets,
		manifest: {
			"js/main.min.js": isProd ? withQueryHash(minFileName, minifiedJs) : minFileName,
		},
	};
}

async function buildPlugins(root, isProd) {
	const css = await concatFiles(root, dirs.libs, isCssFile);
	const js = await concatFiles(root, dirs.libs, isJsFile);
	const minifiedCss = minifyCss(css);
	const minifiedJs = await minifyJs(js);
	const minCssFileName = "css/plugins.min.css";
	const minJsFileName = "js/plugins.min.js";

	return {
		assets: [
			{ fileName: "css/plugins.css", source: css },
			{ fileName: minCssFileName, source: minifiedCss },
			{ fileName: "js/plugins.js", source: js },
			{ fileName: minJsFileName, source: minifiedJs },
		],
		manifest: {
			"css/plugins.min.css": isProd ? withQueryHash(minCssFileName, minifiedCss) : minCssFileName,
			"js/plugins.min.js": isProd ? withQueryHash(minJsFileName, minifiedJs) : minJsFileName,
		},
	};
}

async function buildSprite(root) {
	return {
		fileName: "assets/sprite.svg",
		source: await createSvgSprite(root),
	};
}

async function concatMainJs(root) {
	const jsFiles = [
		...(await listFiles(path.join(root, dirs.js), isJsFile, false)),
		...(await listFiles(path.join(root, dirs.blocks), isJsFile, true)),
	];

	return readAndJoin(jsFiles, "\n");
}

async function concatFiles(root, sourceDir, filter) {
	const files = await listFiles(path.join(root, sourceDir), filter, false);

	return readAndJoin(files, "\n");
}

async function createSvgSprite(root) {
	const iconPaths = await listFiles(path.join(root, dirs.icons), isSvgFile, false);
	const symbols = [];

	for (const iconPath of iconPaths) {
		const id = path.basename(iconPath, ".svg");
		const source = await fs.readFile(iconPath, "utf8");
		const svgMatch = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);

		if (!svgMatch) {
			continue;
		}

		const viewBox = svgMatch[1].match(/\bviewBox=(["'])(.*?)\1/i)?.[2];
		const viewBoxAttribute = viewBox ? ` viewBox="${viewBox}"` : "";
		const content = svgMatch[2]
			.replace(/\s(?:fill|stroke|style|xmlns)(=(["']).*?\2)?/gi, "")
			.trim();

		symbols.push(`<symbol id="${id}"${viewBoxAttribute}>${content}</symbol>`);
	}

	return `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("\n")}\n</svg>\n`;
}

async function copyFiles(root, sourceDir, outputDir, filter = () => true, options = {}) {
	const absoluteSourceDir = path.join(root, sourceDir);
	const files = await listFiles(
		absoluteSourceDir,
		(file) => (options.includeDotFiles || !isDotFile(file)) && filter(file),
		true
	);

	return Promise.all(
		files.map(async (file) => ({
			fileName: toPosix(path.join(outputDir, path.relative(absoluteSourceDir, file))),
			source: await fs.readFile(file),
		}))
	);
}
