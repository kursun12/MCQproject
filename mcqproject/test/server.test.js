/* @vitest-environment node */
import request from 'supertest';
import app from '../server.js';

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
  });
});
