import path from "node:path";

import pug from "pug";

import { dirs } from "./config.mjs";
import { minifyHtml } from "./minify.mjs";
import { isPugFile, listFiles } from "./utils.mjs";

export async function buildPages(root, isProd, manifest) {
	const pagePaths = await listFiles(path.join(root, dirs.pages), isPugFile, false);

	return Promise.all(
		pagePaths.map(async (pagePath) => {
			const pageName = path.basename(pagePath, ".pug");
			let html = renderPage(root, pagePath, isProd);

			for (const [from, to] of Object.entries(manifest)) {
				html = html.replaceAll(from, to);
			}

			if (isProd) {
				html = await minifyHtml(html);
			}

			return {
				fileName: `${pageName}.html`,
				source: html,
			};
		})
	);
}

export function renderPage(root, pagePath, isProd) {
	return pug.renderFile(pagePath, {
		filename: pagePath,
		basedir: path.join(root, dirs.dev),
		pretty: isProd ? false : "\t",
	});
}

export function injectCssHmrClient(html) {
	const script = `
<script type="module">
	import { createHotContext } from "/@vite/client";

	const hot = createHotContext("/@template-css-hmr");

	hot.on("template:css-update", ({ timestamp }) => {
		document.querySelector("vite-error-overlay")?.remove();

		document.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
			const currentHref = link.getAttribute("href");

			if (!currentHref) {
				return;
			}

			const url = new URL(currentHref, window.location.href);

			if (url.origin !== window.location.origin) {
				return;
			}

			url.searchParams.set("template-css-hmr", timestamp);
			link.href = url.href;
		});
	});
</script>`;

	if (html.includes("</body>")) {
		return html.replace("</body>", `${script}\n</body>`);
	}

	return `${html}${script}`;
}
