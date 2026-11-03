
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  // Keep the anonymous entry small; render course mathematics only on demand.
  build: {
    target: 'es2020',
    minify: 'esbuild',
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll('\\', '/');
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalized)) {
            return 'react-vendor';
          }
          if (normalized.includes('/node_modules/katex/')) return 'katex';
          return undefined;
        }
      }
    }
  }
}));
