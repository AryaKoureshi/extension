import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import webExtension from "@samrum/vite-plugin-web-extension";
import manifest from "./manifest.config";
import { name, version } from "./package.json";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	resolve: {
		alias: {
			"@": `${path.resolve(__dirname, "src")}`,
		},
	},
	plugins: [
                webExtension({ manifest } as any) as any,
                react(),

		viteStaticCopy({
			targets: [
				{
					src: "node_modules/@urnetwork/sdk-js/wasm/*",
					dest: "wasm",
				},
			],
		}),
		zip({
			outDir: "release",
			outFileName: `crx-${name.replace("/", "-")}-${version}.zip`,
			filter: (fileName) => !fileName.includes(".vite"),
		}),
		tailwindcss(),
	],
	server: {
		cors: {
			origin: [/chrome-extension:\/\//],
		},
	},
});
