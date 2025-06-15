
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
      // Exclude directories that don't need watching
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
        '**/package-lock.json'
      ],
      // Use polling for better stability in containers
      usePolling: false,
      // Reduce the number of files watched
      followSymlinks: false
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
  // Optimize dependencies to reduce file watching
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom']
  },
}));
