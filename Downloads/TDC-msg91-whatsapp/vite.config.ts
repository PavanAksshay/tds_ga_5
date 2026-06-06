import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
  ],

  build: {
    // Chunk splitting for better caching and Core Web Vitals
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk: React ecosystem
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // Radix UI chunk
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          // Lucide icons chunk
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // Charts/three.js chunk (if used)
          if (id.includes("node_modules/three") || id.includes("node_modules/@react-three")) {
            return "vendor-three";
          }
          // Supabase chunk
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
        },
      },
    },
    // Target modern browsers for smaller output
    target: ["es2020", "chrome80", "firefox78", "safari14"],
    // Increase chunk warning to 1500kB
    chunkSizeWarningLimit: 1500,
    // Enable source maps for Lighthouse debugging
    sourcemap: false,
    // Minify with esbuild for better compression
    minify: "esbuild",
    cssMinify: true,
  },

  server: {
    // Dev server options
    hmr: true,
  },

  // Optimize deps for faster cold starts
  optimizeDeps: {
    include: ["react", "react-dom", "react-router", "lucide-react", "@supabase/supabase-js"],
  },

  // Control VITE env exposure
  envPrefix: ["VITE_", "SUPABASE_", "GOOGLE_"],
});
