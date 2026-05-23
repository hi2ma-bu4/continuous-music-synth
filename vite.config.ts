import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	root: resolve(__dirname, "src"),
	build: {
		emptyOutDir: true,
		outDir: resolve(__dirname, "dist"),
	},
});
