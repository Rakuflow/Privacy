import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/api": path.resolve(__dirname, "./src/api"),
      "@/contracts": path.resolve(__dirname, "./src/contracts"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/routes": path.resolve(__dirname, "./src/routes"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/styles": path.resolve(__dirname, "./src/styles"),
      "@/types": path.resolve(__dirname, "./src/types"),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: [
    "**/*.svg",
    "**/*.csv",
    "**/*.webp",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    target: "esnext",
    outDir: "dist",
  },
  preview: {
    port: 5001,
    strictPort: true,
  },
  server: {
    port: 5001,
    open: false,
    allowedHosts: true,
  },
  define: {
    global: "globalThis",
  },
  envPrefix: "VITE_",
});
