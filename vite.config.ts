import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function appConfigPlugin(): Plugin {
  const configPath = path.resolve('app-config.json');
  const constantsPath = path.resolve('src/constants.ts');

  const handleConfig = (req: any, res: any) => {
    if (req.method === 'GET') {
      try {
        let config = {
          scriptUrl: 'https://script.google.com/macros/s/AKfycbxW2abcNwqfQe1w4jxrGXKTMfv6ERqgF8P_DljdHeKm-TouI21tBcNcfFx-DixjMZ_wuw/exec',
          sheetId: '1bltksqx6uNbnWO3_OYLBxcL_3oBKuQPPUOzB3F3PClQ'
        };
        if (fs.existsSync(configPath)) {
          const raw = fs.readFileSync(configPath, 'utf-8');
          config = JSON.parse(raw);
        }
        if (!config.scriptUrl && process.env.VITE_APPS_SCRIPT_URL) {
          config.scriptUrl = process.env.VITE_APPS_SCRIPT_URL;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(config));
      } catch (e: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const scriptUrl = (data.scriptUrl || '').trim();
          const config = {
            scriptUrl,
            sheetId: '1bltksqx6uNbnWO3_OYLBxcL_3oBKuQPPUOzB3F3PClQ',
            updatedAt: new Date().toISOString()
          };
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

          // If scriptUrl is valid, also update DEFAULT_APPS_SCRIPT_URL in constants.ts
          if (scriptUrl && scriptUrl.startsWith('https://script.google.com/macros/s/')) {
            try {
              if (fs.existsSync(constantsPath)) {
                let code = fs.readFileSync(constantsPath, 'utf-8');
                code = code.replace(
                  /export const DEFAULT_APPS_SCRIPT_URL: string =\s*\(typeof import\.meta !== 'undefined'[\s\S]*?'https:\/\/script\.google\.com\/macros\/s\/[^']+'/,
                  `export const DEFAULT_APPS_SCRIPT_URL: string =\n  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_APPS_SCRIPT_URL as string)) ||\n  '${scriptUrl}'`
                );
                fs.writeFileSync(constantsPath, code, 'utf-8');
              }
            } catch (err) {
              console.warn('Failed to update constants.ts with script URL', err);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, scriptUrl }));
        } catch (e: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end('Method Not Allowed');
    }
  };

  return {
    name: 'app-config-plugin',
    configureServer(server) {
      server.middlewares.use('/api/config', (req, res) => {
        handleConfig(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/config', (req, res) => {
        handleConfig(req, res);
      });
    }
  };
}

export default defineConfig(() => {
  return {
    // Relative base path ensures assets load properly on GitHub Pages (https://<user>.github.io/<repo>/) and custom domains
    base: './',
    plugins: [react(), tailwindcss(), appConfigPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

