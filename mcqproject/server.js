/* eslint-env node */
/* global process */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const assetsDir = path.join(__dirname, 'src', 'assets');

app.get('/api/questionsets', (req, res) => {
  try {
    const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.json'));
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Unable to read assets' });
  }
});

app.get('/api/questionsets/:name', (req, res) => {
  const filePath = path.join(assetsDir, req.params.name);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(404).json({ error: 'Set not found' });
      return;
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch {
      res.status(500).json({ error: 'Invalid JSON format' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
