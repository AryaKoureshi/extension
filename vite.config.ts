import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, normalizePath, type Plugin } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config";
import { name, version } from "./package.json";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const backgroundEntry = "src/background/index.ts";
const popupEntry = "src/popup/index.html";

function extensionManifestPlugin(extensionManifest: chrome.runtime.ManifestV3): Plugin {
	return {
		name: "urnetwork-extension-manifest",
		apply: "build",
		generateBundle(_options, bundle) {
			const backgroundFileName = Object.values(bundle).find(
				(output) =>
					output.type === "chunk" &&
					output.facadeModuleId &&
					normalizePath(output.facadeModuleId) ===
						normalizePath(path.resolve(__dirname, backgroundEntry)),
			)?.fileName;

			if (!backgroundFileName) {
				this.error(`Unable to find generated output for ${backgroundEntry}`);
				return;
			}

			const outputManifest: chrome.runtime.ManifestV3 = structuredClone(extensionManifest);
			outputManifest.background = {
				...outputManifest.background,
				service_worker: backgroundFileName,
			};

			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: JSON.stringify(outputManifest, null, "\t"),
			});
		},
	};
}

export default defineConfig({
	resolve: {
		alias: {
			"@": `${path.resolve(__dirname, "src")}`,
		},
	},
	plugins: [
		extensionManifestPlugin(manifest),
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
	build: {
		rollupOptions: {
			input: {
				popup: path.resolve(__dirname, popupEntry),
				background: path.resolve(__dirname, backgroundEntry),
			},
		},
	},
	server: {
		cors: {
			origin: [/chrome-extension:\/\//],
		},
	},
});
