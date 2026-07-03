import { buildOutputs } from "./template-plugin/assets.mjs";
import { dirs, resolvedVirtualEntryId, virtualEntryId } from "./template-plugin/config.mjs";
import { configureTemplateDevServer } from "./template-plugin/dev-server.mjs";

export function templatePlugin() {
	let config;

	return {
		name: "html-template",

		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},

		resolveId(id) {
			if (id === virtualEntryId) {
				return resolvedVirtualEntryId;
			}

			return null;
		},

		load(id) {
			if (id === resolvedVirtualEntryId) {
				return "globalThis.__templateEntry = true;";
			}

			return null;
		},

		configureServer(server) {
			configureTemplateDevServer(server, config);
		},

		async generateBundle(_outputOptions, bundle) {
			for (const fileName of Object.keys(bundle)) {
				delete bundle[fileName];
			}

			const root = config.root;
			const isProd = config.mode === "production";
			const outputs = await buildOutputs(root, isProd);

			for (const output of outputs) {
				this.emitFile({
					type: "asset",
					fileName: output.fileName,
					source: output.source,
				});
			}
		},
	};
}

export { dirs };
