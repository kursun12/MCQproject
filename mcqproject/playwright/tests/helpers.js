import { promises as fs } from 'fs';
import path from 'path';

export function sanitizeFilename(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'artifact';
}

export async function ensureDir(relativePath) {
  const resolved = path.resolve(relativePath);
  await fs.mkdir(resolved, { recursive: true });
  return resolved;
}

export async function resetAppState(page) {
  await page.addInitScript(() => {
    try {
      window.localStorage?.clear?.();
      window.sessionStorage?.clear?.();
    } catch (err) {
      console.warn('Unable to reset storage', err);
    }
  });
}

export async function capture(page, artifactPath, options = {}) {
  await ensureDir(path.dirname(artifactPath));
  await page.screenshot({ path: artifactPath, fullPage: true, ...options });
}

export async function startTrace(context) {
  await context.tracing.start({ screenshots: true, snapshots: true });
}

export async function stopTrace(context, testInfo) {
  const tracesDir = await ensureDir('artifacts/e2e/traces');
  const name = sanitizeFilename(testInfo.title);
  const tracePath = path.join(tracesDir, name + '.zip');
  try {
    await context.tracing.stop({ path: tracePath });
    testInfo.attachments.push({ name: 'trace', contentType: 'application/zip', path: tracePath });
  } catch (err) {
    console.warn('Failed to write trace', err);
  }
}

export async function persistVideos(testInfo) {
  const videoDir = await ensureDir('artifacts/e2e/videos');
  let index = 0;
  for (const attachment of testInfo.attachments) {
    if (attachment.name === 'video' && attachment.path) {
      const ext = path.extname(attachment.path) || '.webm';
      const target = path.join(videoDir, sanitizeFilename(testInfo.title) + '-' + index + ext);
      try {
        await fs.copyFile(attachment.path, target);
      } catch (err) {
        console.warn('Unable to copy video artifact', err);
      }
      index += 1;
    }
  }
}

export function registerStandardHooks(test) {
  test.beforeEach(async ({ context, page }) => {
    await startTrace(context);
    await resetAppState(page);
  });

  test.afterEach(async ({ context }, testInfo) => {
    await stopTrace(context, testInfo);
    await persistVideos(testInfo);
  });
}
