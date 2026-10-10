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

  const attachmentsDir = path.resolve('data/attachments');
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }

  const handleAttachments = (req: any, res: any) => {
    const url = req.url || '';
    if (req.method === 'GET') {
      if (url === '/api/attachments' || url === '/api/attachments/' || url === '') {
        try {
          const files = fs.readdirSync(attachmentsDir);
          const result: Record<string, any> = {};
          for (const f of files) {
            if (f.endsWith('.json')) {
              const id = f.replace('.json', '');
              try {
                result[id] = JSON.parse(fs.readFileSync(path.join(attachmentsDir, f), 'utf-8'));
              } catch {}
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      } else {
        const id = url.replace(/^\/?/, '').split('?')[0];
        const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = path.join(attachmentsDir, `${safeId}.json`);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath, 'utf-8'));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Attachment not found' }));
        }
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const { id, name, type, size, dataUrl, txId } = JSON.parse(body || '{}');
          if (!id || !dataUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'id and dataUrl required' }));
            return;
          }
          const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
          const filePath = path.join(attachmentsDir, `${safeId}.json`);
          const attObj = { id: safeId, name: name || 'Attachment', type: type || 'image/jpeg', size: Number(size) || 0, dataUrl, txId: txId || '', uploadedAt: new Date().toISOString() };
          fs.writeFileSync(filePath, JSON.stringify(attObj), 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, attachment: attObj }));
        } catch (e: any) {
          res.statusCode = 500;
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
      server.middlewares.use('/api/attachments', (req, res) => {
        handleAttachments(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/config', (req, res) => {
        handleConfig(req, res);
      });
      server.middlewares.use('/api/attachments', (req, res) => {
        handleAttachments(req, res);
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

