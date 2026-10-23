import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { query } from 'ohnejs';

import { DEMO_PASSWORD } from '../../boot/_seed.ts';
import { startApp, type TestApp } from '../_app.ts';

describe('Tasks', () => {
  let app: TestApp;
  let demo: { UUID: string; cookie: string };
  let thrall: { UUID: string; cookie: string };

  const task = async (title: string): Promise<string> => {
    const row = await query('Tasks').where('title', title).findFirst();
    ok(row, title);
    return row.UUID;
  };

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
  });

  after(() => app.stop());

  it('lists only the tasks the caller owns', async () => {
    const mine = await app.request('GET', '/collections/tasks', { cookie: demo.cookie });
    strictEqual(mine.body.length, 9);
    const theirs = await app.request('GET', '/collections/tasks', { cookie: thrall.cookie });
    deepStrictEqual(theirs.body, []);
  });

  it('gives a new task to its creator', async () => {
    const created = await app.request('POST', '/collections/tasks', {
      cookie: thrall.cookie,
      json: { title: 'Repot the fern' },
    });
    strictEqual(created.status, 201);
    strictEqual(created.body.owner, thrall.UUID);
    strictEqual(created.body.priority, 'normal');
  });

  it('refuses a link to a list of another account', async () => {
    const home = await query('Lists').where('name', 'Home').findFirst();
    ok(home);
    const created = await app.request('POST', '/collections/tasks', {
      cookie: thrall.cookie,
      json: { title: 'Borrowed', list: home.UUID },
    });
    strictEqual(created.status, 422);
    ok(created.body.data.errors.list);
  });

  it('keeps a task with its owner', async () => {
    const uuid = await task('Water the plants');
    for (const owner of [thrall.UUID, null]) {
      const moved = await app.request('PATCH', `/collections/tasks/${uuid}`, {
        cookie: demo.cookie,
        json: { owner },
      });
      strictEqual(moved.status, 404, String(owner));
    }
    strictEqual((await query('Tasks').where('UUID', uuid).findFirst())?.owner, demo.UUID);
  });

  it('lets only the owner change a task', async () => {
    const uuid = await task('Water the plants');
    const foreign = await app.request('PATCH', `/collections/tasks/${uuid}`, {
      cookie: thrall.cookie,
      json: { done: true },
    });
    strictEqual(foreign.status, 404);

    const own = await app.request('PATCH', `/collections/tasks/${uuid}`, {
      cookie: demo.cookie,
      json: { done: true },
    });
    strictEqual(own.status, 200);
    strictEqual(own.body.done, true);
  });

  it('refuses an unknown priority', async () => {
    const created = await app.request('POST', '/collections/tasks', {
      cookie: demo.cookie,
      json: { title: 'Panic', priority: 'urgent' },
    });
    strictEqual(created.status, 422);
    ok(created.body.data.errors.priority);
  });

  it('labels only the tasks the caller owns as writable', async () => {
    const UUIDs = [await task('Water the plants'), await task('Repot the fern')];
    const verdicts = await app.request('POST', '/collections/tasks/verdicts', {
      cookie: demo.cookie,
      json: { UUIDs },
    });
    strictEqual(verdicts.status, 200);
    deepStrictEqual(verdicts.body, {
      update: { UUIDs: [UUIDs[0]] },
      delete: { UUIDs: [UUIDs[0]] },
    });
  });

  it('lets the admin read and reassign every task', async () => {
    const cookie = await app.signInAdmin();
    const all = await app.request('GET', '/collections/tasks', { cookie });
    strictEqual(all.body.length, 10);

    const uuid = await task('Repot the fern');
    const moved = await app.request('PATCH', `/collections/tasks/${uuid}`, {
      cookie,
      json: { owner: demo.UUID },
    });
    strictEqual(moved.status, 200);
    strictEqual(moved.body.owner, demo.UUID);
  });

  it('deletes the tasks of a deleted list', async () => {
    const errands = await query('Lists').where('name', 'Errands').findFirst();
    ok(errands);
    strictEqual(await query('Tasks').where('list', errands.UUID).count(), 3);

    const deleted = await app.request('DELETE', `/collections/lists/${errands.UUID}`, {
      cookie: demo.cookie,
    });
    strictEqual(deleted.status, 204);
    strictEqual(await query('Tasks').where('list', errands.UUID).count(), 0);
  });
});
