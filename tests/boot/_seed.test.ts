import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { query } from 'ohnejs';
import { isNull } from 'ohnejs/utils';

import { localDay, seed } from '../../boot/_seed.ts';
import { startApp, type TestApp } from '../_app.ts';

describe('seed', () => {
  let app: TestApp;

  before(async () => {
    app = await startApp();
  });

  after(() => app.stop());

  const user = async (email: string) => {
    const found = await query('Users').where('email', email).findFirst();
    ok(found, email);
    return found;
  };

  it('creates the demo member and the admin', async () => {
    deepStrictEqual((await user('demo@example.com')).roles, ['member']);
    deepStrictEqual((await user('admin@example.com')).roles, ['admin']);
  });

  it('gives every list and task to the demo member', async () => {
    const demo = await user('demo@example.com');
    strictEqual(await query('Lists').where('owner', demo.UUID).count(), 3);
    strictEqual(await query('Tasks').where('owner', demo.UUID).count(), 9);
    strictEqual(await query('Lists').count(), 3);
    strictEqual(await query('Tasks').count(), 9);
  });

  it('spreads the due days around today', async () => {
    const tasks = await query('Tasks').findMany();
    const today = localDay();
    ok(tasks.some((task) => task.due === today && !task.done));
    ok(tasks.some((task) => !isNull(task.due) && task.due < today && !task.done));
    ok(tasks.some((task) => !isNull(task.due) && task.due < today && task.done));
  });

  it('disarms the install page', async () => {
    deepStrictEqual((await app.request('GET', '/auth/install')).body, { required: false });
  });

  it('leaves a database that holds an account alone', async () => {
    const counts = async () => [
      await query('Users').count(),
      await query('Lists').count(),
      await query('Tasks').count(),
    ];
    const before = await counts();
    await seed();
    deepStrictEqual(await counts(), before);
  });
});
