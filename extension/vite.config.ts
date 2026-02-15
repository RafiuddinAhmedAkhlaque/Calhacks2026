import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";

// Plugin to copy Chrome extension static files into dist after build
function chromeExtensionPlugin(): Plugin {
  return {
    name: "chrome-extension-copy",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");

      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(distDir, "manifest.json")
      );

      // Copy content.css
      const contentDir = resolve(distDir, "content");
      if (!existsSync(contentDir)) mkdirSync(contentDir, { recursive: true });
      copyFileSync(
        resolve(__dirname, "src/content/content.css"),
        resolve(contentDir, "content.css")
      );

      // Copy icons directory if it exists
      const iconsSource = resolve(__dirname, "public/icons");
      const iconsDest = resolve(distDir, "icons");
      if (existsSync(iconsSource)) {
        if (!existsSync(iconsDest)) mkdirSync(iconsDest, { recursive: true });
        for (const file of ["icon16.png", "icon48.png", "icon128.png"]) {
          const src = resolve(iconsSource, file);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDest, file));
          }
        }
      }

      // Move popup.html from src/popup/ to root of dist, fixing relative paths
      const popupSrc = resolve(distDir, "src/popup/popup.html");
      if (existsSync(popupSrc)) {
        let html = readFileSync(popupSrc, "utf-8");
        // Fix paths: ../../ -> ./ since we're moving from src/popup/ to root
        html = html.replace(/\.\.\/\.\.\//g, "./");
        writeFileSync(resolve(distDir, "popup.html"), html);
      }

      console.log("  ✓ Chrome extension files copied to dist/");
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), chromeExtensionPlugin()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        "background/service-worker": resolve(
          __dirname,
          "src/background/service-worker.ts"
        ),
        "content/content": resolve(__dirname, "src/content/content.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
