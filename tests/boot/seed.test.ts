import { deepStrictEqual, strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { query, useEnv } from 'ohnejs';

import { startApp, type TestApp } from '../_app.ts';

describe('seed in production', () => {
  let app: TestApp;

  before(async () => {
    useEnv().set('NODE_ENV', 'production');
    app = await startApp();
  });

  after(() => app.stop());

  it('seeds nothing', async () => {
    strictEqual(await query('Users').count(), 0);
    deepStrictEqual((await app.request('GET', '/auth/install')).body, { required: true });
  });

  it('keeps sign-up closed until the install page creates the admin', async () => {
    const early = await app.request('POST', '/signup', {
      json: { email: 'early@example.org', password: 'long-enough' },
    });
    strictEqual(early.status, 403);
    deepStrictEqual((await app.request('GET', '/auth/install')).body, { required: true });

    const admin = await app.request('POST', '/auth/install', {
      json: { email: 'owner@example.org', password: 'long-enough' },
    });
    strictEqual(admin.status, 200);
    const member = await app.request('POST', '/signup', {
      json: { email: 'early@example.org', password: 'long-enough' },
    });
    strictEqual(member.status, 200);
  });
});
