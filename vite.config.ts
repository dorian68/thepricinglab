
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Dev-only: serve the static campaign landing at the clean URL
// `/market-finance-starter-kit` (the Vite dev server otherwise lets the SPA
// fallback swallow directory requests). In production, static hosts resolve
// `/market-finance-starter-kit/` -> index.html natively, so this is dev-only.
const starterKitLanding = () => ({
  name: "tpl-starter-kit-landing",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || "").split("?")[0];
      if (url === "/market-finance-starter-kit" || url === "/market-finance-starter-kit/") {
        const file = path.resolve(__dirname, "public/market-finance-starter-kit/index.html");
        try {
          const html = fs.readFileSync(file, "utf-8");
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
          return;
        } catch {
          // fall through to default handling if the file is missing
        }
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "thepricinglab.onrender.com",
      "70aefe57-b3fa-4664-aaf6-86e47d3ce99d.lovableproject.com"
    ],
    watch: {
      // More aggressive file exclusions to prevent EMFILE error
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/public/lovable-uploads/**',
        '**/supabase/**',
        '**/*.log',
        '**/bun.lockb',
        '**/package-lock.json',
        '**/yarn.lock',
        '**/.DS_Store',
        '**/thumbs.db',
        '**/desktop.ini',
        '**/*.backup.*',
        '**/*.original.*',
        '**/*.txt'
      ],
      // Disable polling to reduce resource usage
      usePolling: false,
      // Reduce the number of files watched
      followSymlinks: false,
      // Ignore dotfiles
      ignoreInitial: true
    },
  },
  plugins: [
    react(),
    starterKitLanding(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // More aggressive optimization to reduce file watching
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom'],
    // Force pre-bundling to reduce file watching
    force: true
  },
  // Reduce build complexity
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}));
