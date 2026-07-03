import { defineConfig } from "vite";
import { templatePlugin } from "./scripts/vite-template-plugin.mjs";

export default defineConfig({
	publicDir: false,
	plugins: [templatePlugin()],
	build: {
		outDir: "public",
		emptyOutDir: true,
		copyPublicDir: false,
		// The template plugin emits final CSS/JS/HTML assets itself so it can
		// preserve legacy file names and query-hash URLs. Vite minify does not
		// process those emitted assets, so minification is handled in the plugin.
		minify: false,
		rollupOptions: {
			input: "virtual:template-entry",
		},
	},
	server: {
		port: 3000,
		host: "0.0.0.0",
		open: true,
	},
	preview: {
		host: "0.0.0.0",
	},
	optimizeDeps: {
		noDiscovery: true,
	},
});
