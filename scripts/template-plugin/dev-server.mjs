import path from "node:path";

import { dirs } from "./config.mjs";
import { assertStylesCompile, getDevAsset } from "./assets.mjs";
import { injectCssHmrClient, renderPage } from "./pages.mjs";
import { fileExists, isStyleSource, toPosix } from "./utils.mjs";

export function configureTemplateDevServer(server, config) {
	const root = config.root;

	server.watcher.add(path.join(root, dirs.dev));
	server.watcher.on("all", async (_event, file) => {
		if (!file.includes(`${path.sep}${dirs.dev}${path.sep}`)) {
			return;
		}

		if (isStyleSource(root, file)) {
			try {
				if (file.endsWith(".scss")) {
					await assertStylesCompile(root);
				}

				server.ws.send({
					type: "custom",
					event: "template:css-update",
					data: {
						file: toPosix(path.relative(root, file)),
						timestamp: Date.now(),
					},
				});
			} catch (error) {
				sendError(server, error);
			}
		} else {
			server.ws.send({ type: "full-reload" });
		}
	});

	server.middlewares.use(async (req, res, next) => {
		try {
			const url = new URL(req.url || "/", "http://localhost");
			const pathname = decodeURIComponent(url.pathname);

			if (pathname === "/" || pathname.endsWith(".html")) {
				const pageName = pathname === "/" ? "index.html" : pathname.slice(1);
				const pagePath = path.join(root, dirs.pages, pageName.replace(/\.html$/, ".pug"));

				if (await fileExists(pagePath)) {
					const html = injectCssHmrClient(renderPage(root, pagePath, false));
					const transformedHtml = await server.transformIndexHtml(pathname, html);

					res.statusCode = 200;
					res.setHeader("Content-Type", "text/html; charset=utf-8");
					res.end(transformedHtml);
					return;
				}
			}

			const asset = await getDevAsset(root, pathname);

			if (asset) {
				res.statusCode = 200;
				res.setHeader("Content-Type", asset.contentType);
				res.end(asset.source);
				return;
			}

			next();
		} catch (error) {
			sendError(server, error);
			res.statusCode = 500;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.end(error.stack || error.message || String(error));
		}
	});
}

function sendError(server, error) {
	server.ssrFixStacktrace(error);
	server.ws.send({
		type: "error",
		err: {
			name: error.name,
			message: error.message,
			stack: error.stack,
			plugin: "html-template",
			id: error.span?.url?.pathname,
			frame: error.span?.context,
		},
	});
}
