/* @vitest-environment node */
import request from 'supertest';
import app, { listQuestionSetFiles, resolveQuestionSetPath } from '../server.js';

import { describe, expect, it } from 'vitest';

describe('server routes', () => {
  it('responds with healthz payload', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('lists available question set assets', async () => {
    const res = await request(app).get('/api/questionsets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain('SC-200/_MConverter.eu_1-30.json');
    expect(res.body).toContain('KCDA/KCNA-1.json');
  });

  it('loads a shipped question bank by query parameter', async () => {
    const res = await request(app).get('/api/questionsets').query({
      name: 'SC-200/_MConverter.eu_1-30.json',
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('question');
  });
});

describe('server asset helpers', () => {
  it('discovers nested shipped question banks', () => {
    const files = listQuestionSetFiles();
    expect(files).toContain('SC-200/_MConverter.eu_1-30.json');
    expect(files).toContain('KCDA/KCNA-1.json');
  });

  it('rejects path traversal attempts', () => {
    expect(resolveQuestionSetPath('../secrets.json')).toBeNull();
  });
});
