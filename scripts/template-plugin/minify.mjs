import CleanCSS from "clean-css";
import { minify as minifyHtmlTerser } from "html-minifier-terser";
import { minify as minifyJsTerser } from "terser";

export function minifyCss(source) {
	if (!source.trim()) {
		return "";
	}

	const output = new CleanCSS({
		level: 0,
	}).minify(source);

	if (output.errors.length) {
		throw new Error(output.errors.join("\n"));
	}

	return output.styles.trim();
}

export async function minifyJs(source, options = {}) {
	if (!source.trim()) {
		return options.withSourceMap ? { code: "", map: "" } : "";
	}

	const result = await minifyJsTerser(source, {
		compress: false,
		mangle: false,
		format: {
			comments: false,
		},
		sourceMap: options.withSourceMap
			? {
					filename: options.fileName,
					url: options.sourceMapUrl,
				}
			: false,
	});

	if (result.error) {
		throw result.error;
	}

	if (options.withSourceMap) {
		return {
			code: result.code.trim(),
			map: result.map,
		};
	}

	return result.code.trim();
}

export async function minifyHtml(source) {
	return minifyHtmlTerser(source, {
		collapseWhitespace: true,
		conservativeCollapse: true,
		removeComments: true,
		minifyCSS: false,
		minifyJS: false,
	});
}
