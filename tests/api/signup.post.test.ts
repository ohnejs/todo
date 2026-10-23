import { deepStrictEqual, match, ok, strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';

import { startApp, type TestApp } from '../_app.ts';

// The route allows five calls an hour per client, and every call below counts, so they run in order.
describe('POST /signup', () => {
  let app: TestApp;

  before(async () => {
    app = await startApp();
  });

  after(() => app.stop());

  it('refuses a body without an email and a password', async () => {
    strictEqual((await app.request('POST', '/signup', { json: null })).status, 400);
    const numeric = await app.request('POST', '/signup', {
      json: { email: 42, password: 'long-enough' },
    });
    strictEqual(numeric.status, 400);
  });

  it('refuses a short password', async () => {
    const short = await app.request('POST', '/signup', {
      json: { email: 'anduin@example.org', password: 'short' },
    });
    strictEqual(short.status, 422);
    match(short.body.data.errors.password, /8/);
  });

  it('creates a signed-in member', async () => {
    const created = await app.request('POST', '/signup', {
      json: { email: 'Anduin@Example.org', password: 'long-enough', roles: ['admin'] },
    });
    strictEqual(created.status, 200);
    strictEqual(created.body.email, 'anduin@example.org');
    deepStrictEqual(created.body.roles, ['member']);
    ok(created.cookie);

    const lists = await app.request('GET', '/collections/lists', { cookie: created.cookie });
    deepStrictEqual([lists.status, lists.body], [200, []]);
    const list = await app.request('POST', '/collections/lists', {
      cookie: created.cookie,
      json: { name: 'Groceries' },
    });
    strictEqual(list.status, 201);
  });

  it('refuses a taken email in any letter case', async () => {
    const taken = await app.request('POST', '/signup', {
      json: { email: 'ANDUIN@example.org', password: 'long-enough' },
    });
    strictEqual(taken.status, 422);
    ok(taken.body.data.errors.email);
  });

  it('limits the calls of one client', async () => {
    const limited = await app.request('POST', '/signup', {
      json: { email: 'baine@example.org', password: 'long-enough' },
    });
    strictEqual(limited.status, 429);
  });
});
