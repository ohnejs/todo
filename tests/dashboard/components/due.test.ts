import { deepStrictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';

import { localDay } from '../../../boot/_seed.ts';
import { dueBuckets, todayQuery } from '../../../dashboard/components/due.ts';
import { startApp, type TestApp } from '../../_app.ts';

describe('dueBuckets', () => {
  it('splits open overdue tasks from every task due today', () => {
    const tasks = [
      { title: 'a', due: '2026-10-20', done: false },
      { title: 'b', due: '2026-10-20', done: true },
      { title: 'c', due: '2026-10-21', done: false },
      { title: 'd', due: '2026-10-21', done: true },
      { title: 'e', due: '2026-10-22', done: false },
      { title: 'f', due: null, done: false },
    ];
    const { overdue, today } = dueBuckets(tasks, '2026-10-21');
    deepStrictEqual(
      [overdue.map((task) => task.title), today.map((task) => task.title)],
      [['a'], ['c', 'd']],
    );
  });
});

describe('todayQuery', () => {
  let app: TestApp;

  before(async () => {
    app = await startApp();
  });

  after(() => app.stop());

  const titles = async (cookie: string, email: string): Promise<string[][]> => {
    const me = await app.request('GET', '/auth/me', { cookie });
    const answer = await app.request('POST', '/collections/tasks/query', {
      cookie,
      json: todayQuery(me.body.UUID, localDay()),
    });
    deepStrictEqual([answer.status, me.body.email], [200, email]);
    return answer.body.map((task: { title: string; list: { name: string } }) => [
      task.title,
      task.list.name,
    ]);
  };

  it('reads the overdue tasks, then the ones due today, finished ones last', async () => {
    deepStrictEqual(await titles(await app.signIn('demo@example.com'), 'demo@example.com'), [
      ['Fix the dripping tap', 'Home'],
      ['Return the library books', 'Errands'],
      ['Send the budget draft', 'Work'],
      ['Water the plants', 'Home'],
      ['Pick up the dry cleaning', 'Errands'],
    ]);
  });

  it('keeps the Today page of an admin to their own tasks', async () => {
    deepStrictEqual(await titles(await app.signInAdmin(), 'admin@example.com'), []);
  });
});
