import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ATTACHMENTS_DIR = path.resolve('data/attachments');
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

const DEFAULT_SCRIPT_URL =
  process.env.VITE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxW2abcNwqfQe1w4jxrGXKTMfv6ERqgF8P_DljdHeKm-TouI21tBcNcfFx-DixjMZ_wuw/exec';
const SHEET_ID = '1bltksqx6uNbnWO3_OYLBxcL_3oBKuQPPUOzB3F3PClQ';

// GET /api/config: Always provides the configured Google Apps Script Web App URL
app.get('/api/config', (req, res) => {
  const configPath = path.resolve('app-config.json');
  let scriptUrl = DEFAULT_SCRIPT_URL;
  let sheetId = SHEET_ID;

  try {
    if (fs.existsSync(configPath)) {
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (saved.scriptUrl && typeof saved.scriptUrl === 'string' && saved.scriptUrl.trim()) {
        scriptUrl = saved.scriptUrl.trim();
      }
      if (saved.sheetId) {
        sheetId = saved.sheetId;
      }
    }
  } catch {}

  res.setHeader('Content-Type', 'application/json');
  res.json({ scriptUrl, sheetId });
});

// POST /api/config: Updates the active Google Apps Script URL across all devices
app.post('/api/config', (req, res) => {
  try {
    const configPath = path.resolve('app-config.json');
    const { scriptUrl, sheetId } = req.body;
    const cleanUrl = (scriptUrl || '').trim() || DEFAULT_SCRIPT_URL;

    const config = {
      scriptUrl: cleanUrl,
      sheetId: sheetId || SHEET_ID,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, scriptUrl: cleanUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attachments: Retrieve map of all attachments stored on the server
app.get('/api/attachments', (req, res) => {
  try {
    const files = fs.readdirSync(ATTACHMENTS_DIR);
    const result: Record<string, any> = {};
    for (const f of files) {
      if (f.endsWith('.json')) {
        const id = f.replace('.json', '');
        try {
          const data = JSON.parse(fs.readFileSync(path.join(ATTACHMENTS_DIR, f), 'utf-8'));
          result[id] = data;
        } catch {}
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/attachments/:id: Fetch specific attachment by ID with full dataUrl
app.get('/api/attachments/:id', (req, res) => {
  try {
    const safeId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(ATTACHMENTS_DIR, `${safeId}.json`);

    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } else {
      res.status(404).json({ error: 'Attachment not found' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/attachments: Store attachment persistently for cross-device view & download
app.post('/api/attachments', (req, res) => {
  try {
    const { id, name, type, size, dataUrl, txId } = req.body;
    if (!id || !dataUrl) {
      return res.status(400).json({ error: 'id and dataUrl are required' });
    }

    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(ATTACHMENTS_DIR, `${safeId}.json`);

    const attObj = {
      id: safeId,
      name: name || 'Attachment',
      type: type || 'image/jpeg',
      size: Number(size) || 0,
      dataUrl,
      txId: txId || '',
      uploadedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(attObj), 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, attachment: attObj });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Application server running on port ${PORT}`);
  });
}

startServer();
