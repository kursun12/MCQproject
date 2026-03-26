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

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function listQuestionSetFiles(rootDir = assetsDir) {
  const files = [];

  function visit(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        return;
      }
      if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(toPosixPath(path.relative(rootDir, fullPath)));
      }
    });
  }

  visit(rootDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function resolveQuestionSetPath(name, rootDir = assetsDir) {
  if (!name || typeof name !== 'string') return null;
  const decoded = decodeURIComponent(name).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!decoded.endsWith('.json')) return null;
  const filePath = path.resolve(rootDir, decoded);
  const relative = path.relative(rootDir, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return filePath;
}

app.get('/api/questionsets', (req, res) => {
  try {
    const requestedName = req.query?.name;
    if (requestedName) {
      const filePath = resolveQuestionSetPath(requestedName);
      if (!filePath) {
        res.status(400).json({ error: 'Invalid set name' });
        return;
      }
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
      return;
    }

    res.json(listQuestionSetFiles());
  } catch {
    res.status(500).json({ error: 'Unable to read assets' });
  }
});

app.get('/api/questionsets/:name', (req, res) => {
  const filePath = resolveQuestionSetPath(req.params.name);
  if (!filePath) {
    res.status(400).json({ error: 'Invalid set name' });
    return;
  }
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

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log('Server running on port ' + port);
  });
}

export default app;
export { listQuestionSetFiles, resolveQuestionSetPath };
