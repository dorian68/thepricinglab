
import { defineConfig, type ViteDevServer, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { localPreviewPlugin } from './scripts/localPreviewPlugin';

// Dev-only: serve the static campaign landing at the clean URL
// `/market-finance-starter-kit` (the Vite dev server otherwise lets the SPA
// fallback swallow directory requests). In production, static hosts resolve
// `/market-finance-starter-kit/` -> index.html natively, so this is dev-only.
const starterKitLanding = () => ({
  name: "tpl-starter-kit-landing",
  configureServer(server: ViteDevServer) {
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

// Only the free Black-Scholes preview may be a static web asset. Paid course
// scripts are delivered by the entitlement-aware backend and must never land
// in the public build directory (or be reachable through Vite in development).
const installCourseAssetFirewall = (server: Pick<ViteDevServer, 'middlewares'>) => {
    server.middlewares.use((req, res, next) => {
      const url = decodeURIComponent((req.url || "").split("?")[0]);
      if (
        (url.startsWith("/course-scripts/") && url !== "/course-scripts/vanilla-options-quote.md")
        || url.startsWith("/course-scripts_backup")
      ) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not found");
        return;
      }
      next();
    });
};

const protectedCourseAssets = () => ({
  name: "tpl-protected-course-assets",
  configureServer: installCourseAssetFirewall,
  configurePreviewServer: installCourseAssetFirewall,
  closeBundle() {
    const directory = path.resolve(__dirname, "dist/course-scripts");
    if (fs.existsSync(directory)) {
      for (const entry of fs.readdirSync(directory)) {
        if (entry !== "vanilla-options-quote.md") {
          fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
        }
      }
    }
    const distRoot = path.resolve(__dirname, "dist");
    if (fs.existsSync(distRoot)) {
      for (const entry of fs.readdirSync(distRoot)) {
        if (entry.startsWith("course-scripts_backup")) {
          fs.rmSync(path.join(distRoot, entry), { recursive: true, force: true });
        }
      }
    }
  },
});

// The old public Agent Room design kit is an internal reference, not a
// released product surface. It contains historical mock copy such as "Live
// Market Snapshot" and must never be reachable from the dev/preview server
// or copied into the production artifact. The active paid route is the
// backend-wired React cockpit under /agent-room.
const installRetiredSurfaceFirewall = (server: Pick<ViteDevServer, 'middlewares'>) => {
  server.middlewares.use((req, res, next) => {
    const url = decodeURIComponent((req.url || '').split('?')[0]);
    if (url === '/agent-room-kit' || url.startsWith('/agent-room-kit/')) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }
    next();
  });
};

const retiredAgentRoomKit = () => ({
  name: 'tpl-retired-agent-room-kit',
  configureServer: installRetiredSurfaceFirewall,
  configurePreviewServer: installRetiredSurfaceFirewall,
  closeBundle() {
    const directory = path.resolve(__dirname, 'dist/agent-room-kit');
    if (fs.existsSync(directory)) fs.rmSync(directory, { recursive: true, force: true });
  },
});

const dependencyChunk = (rawId: string) => {
  const id = rawId.replaceAll('\\', '/');
  if (!id.includes('/node_modules/')) return undefined;
  if (id.includes('/pyodide/')) return 'pyodide';
  if (id.includes('/mermaid/')) return 'mermaid';
  // Keep Supabase inside its dynamic client chunk. A shared manual chunk made
  // Rollup emit a static side-effect import and modulepreload on anonymous pages.
  if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react-core';
  if (/\/node_modules\/(recharts|victory-vendor|d3-[^/]+)\//.test(id)) return 'charts';
  if (/\/node_modules\/(@radix-ui|lucide-react|cmdk|vaul)\//.test(id)) return 'ui-kit';
  if (/\/node_modules\/(react-markdown|remark-[^/]+|rehype-[^/]+|unified|micromark[^/]*|mdast-util-[^/]+|hast-util-[^/]+)\//.test(id)) return 'markdown';
  if (/\/node_modules\/(@hookform|react-hook-form|zod)\//.test(id)) return 'forms';
  if (/\/node_modules\/(@tanstack)\//.test(id)) return 'query';
  if (/\/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id)) return 'i18n';
  if (/\/node_modules\/(date-fns|dompurify|clsx|tailwind-merge|class-variance-authority|uuid)\//.test(id)) return 'utilities';
  return undefined;
};

// https://vitejs.dev/config/
export default defineConfig((): UserConfig => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,key}', '**/.git/**', '**/.local-preview/**'] },
    allowedHosts: [
      "thepricinglab.onrender.com",
      "70aefe57-b3fa-4664-aaf6-86e47d3ce99d.lovableproject.com"
    ],
    watch: {
      // More aggressive file exclusions to prevent EMFILE error
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.local-preview/**',
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
    localPreviewPlugin(),
    react(),
    starterKitLanding(),
    protectedCourseAssets(),
    retiredAgentRoomKit(),
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
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: dependencyChunk,
      }
    }
  }
}));
