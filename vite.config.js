// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     port: 3000,
//     historyApiFallback: true,
//   },
//   build: {
//     outDir: "dist",
//     assetsDir: "assets",
//     assetsInlineLimit: 4096,
//     sourcemap: false,
//     rollupOptions: {
//       output: {
//         assetFileNames: "assets/[name]-[hash][extname]",
//       },
//     },
//   },
//   esbuild: {
//     drop: ["console", "debugger"],
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },
      includeAssets: ["iklogo.svg", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Institute of Knowledge",
        short_name: "IOK",
        description: "Institute of Knowledge Web Application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Open your learning dashboard",
            url: "/",
          },
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    historyApiFallback: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    assetsInlineLimit: 4096,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
