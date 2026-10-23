import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { query } from 'ohnejs';

import { DEMO_PASSWORD } from '../../boot/_seed.ts';
import { startApp, type TestApp } from '../_app.ts';

describe('Lists', () => {
  let app: TestApp;
  let demo: { UUID: string; cookie: string };
  let thrall: { UUID: string; cookie: string };
  let home: string;

  before(async () => {
    app = await startApp();
    const thrallUser = await query('Users').createOrThrow({
      email: 'thrall@example.org',
      password: DEMO_PASSWORD,
      roles: ['member'],
    });
    const demoUser = await query('Users').where('email', 'demo@example.com').findFirst();
    ok(demoUser);
    demo = { UUID: demoUser.UUID, cookie: await app.signIn('demo@example.com') };
    thrall = { UUID: thrallUser.UUID, cookie: await app.signIn('thrall@example.org') };
    const list = await query('Lists').where('name', 'Home').findFirst();
    ok(list);
    home = list.UUID;
  });

  after(() => app.stop());

  it('lists only the lists the caller owns', async () => {
    const mine = await app.request('GET', '/collections/lists?order=[name]', {
      cookie: demo.cookie,
    });
    strictEqual(mine.status, 200);
    deepStrictEqual(
      mine.body.map((list: { name: string }) => list.name),
      ['Errands', 'Home', 'Work'],
    );

    const theirs = await app.request('GET', '/collections/lists', { cookie: thrall.cookie });
    deepStrictEqual(theirs.body, []);
  });

  it('gives a new list to its creator', async () => {
    const created = await app.request('POST', '/collections/lists', {
      cookie: thrall.cookie,
      json: { name: 'Garden' },
    });
    strictEqual(created.status, 201);
    strictEqual(created.body.owner, thrall.UUID);
  });

  it('answers 404 for a list of another account', async () => {
    const path = `/collections/lists/${home}`;
    for (const [method, json] of [['GET'], ['PATCH', { name: 'Mine now' }], ['DELETE']] as const) {
      const answer = await app.request(method, path, { cookie: thrall.cookie, json });
      strictEqual(answer.status, 404, method);
    }
    strictEqual((await query('Lists').where('UUID', home).findFirst())?.name, 'Home');
  });

  it('refuses a write that names another owner, or none', async () => {
    for (const owner of [demo.UUID, null]) {
      const created = await app.request('POST', '/collections/lists', {
        cookie: thrall.cookie,
        json: { name: 'Planted', owner },
      });
      strictEqual(created.status, 404, String(owner));
    }

    const moved = await app.request('PATCH', `/collections/lists/${home}`, {
      cookie: demo.cookie,
      json: { owner: null },
    });
    strictEqual(moved.status, 404);
    strictEqual((await query('Lists').where('UUID', home).findFirst())?.owner, demo.UUID);
  });

  it('shows the admin the lists of every account', async () => {
    const all = await app.request('GET', '/collections/lists?order=[name]', {
      cookie: await app.signInAdmin(),
    });
    strictEqual(all.status, 200);
    deepStrictEqual(
      all.body.map((list: { name: string; owner: string }) => [list.name, list.owner]),
      [
        ['Errands', demo.UUID],
        ['Garden', thrall.UUID],
        ['Home', demo.UUID],
        ['Work', demo.UUID],
      ],
    );
  });
});
