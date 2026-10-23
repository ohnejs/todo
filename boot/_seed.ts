import { query, queryUntyped, useEnv, usePrinter } from 'ohnejs';
import { msToISODay } from 'ohnejs/utils';
import { randomToken } from 'ohnejs/utils/crypto';

/**
 * The seeded demo member's password.
 */
export const DEMO_PASSWORD = 'ohne-demo';

/**
 * The calendar day `offset` days from today in the machine's time zone, as an ISO day like `2026-10-21`.
 */
export function localDay(offset = 0): string {
  const now = new Date();
  return msToISODay(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

/**
 * Fills an empty database with a demo member, an admin, and the member's lists and tasks.
 * Due days count from the day the seed runs, so the Today page opens with work on it.
 * The admin's password is random and printed once, so no install starts with a known admin password.
 * A database that already holds an account is left alone, and so is every production boot.
 *
 * The `_` in the file name marks a helper, so the boot scan skips it and `boot/seed.ts` imports it.
 */
export async function seed(): Promise<void> {
  if (useEnv().get('NODE_ENV') === 'production') return;
  // The seed runs on every start, so it only fills a fresh database and never touches your edits.
  if (await queryUntyped('Users').unscoped().exists()) return;

  const adminPassword = randomToken(12);
  const demo = await query('Users').createOrThrow({
    email: 'demo@example.com',
    password: DEMO_PASSWORD,
    firstName: 'Jaina',
    lastName: 'Proudmoore',
    roles: ['member'],
  });
  await query('Users').createOrThrow({
    email: 'admin@example.com',
    password: adminPassword,
    firstName: 'Varian',
    lastName: 'Wrynn',
    roles: ['admin'],
  });

  // A boot file runs outside a request, with nobody signed in, so the seed names each `owner` itself.
  const owner = demo.UUID;
  const home = await query('Lists').createOrThrow({ name: 'Home', color: '#22c55e', owner });
  const work = await query('Lists').createOrThrow({ name: 'Work', color: '#3b82f6', owner });
  const errands = await query('Lists').createOrThrow({ name: 'Errands', color: '#f59e0b', owner });

  const tasks = [
    { title: 'Water the plants', due: localDay(), list: home.UUID },
    { title: 'Fix the dripping tap', due: localDay(-2), priority: 'high', list: home.UUID },
    {
      title: 'Learn to bake sourdough',
      notes: 'Start the starter on a Friday.',
      priority: 'low',
      list: home.UUID,
    },
    {
      title: 'Send the budget draft',
      notes: 'The numbers are in the shared sheet.',
      due: localDay(),
      priority: 'high',
      list: work.UUID,
    },
    { title: 'Prepare the Monday standup', due: localDay(3), list: work.UUID },
    { title: 'Submit the expense report', due: localDay(-3), done: true, list: work.UUID },
    { title: 'Pick up the dry cleaning', due: localDay(), done: true, list: errands.UUID },
    { title: 'Return the library books', due: localDay(-1), list: errands.UUID },
    { title: 'Buy a birthday card', due: localDay(1), list: errands.UUID },
  ] as const;
  for (const task of tasks) await query('Tasks').createOrThrow({ ...task, owner });

  usePrinter().info(
    `Seeded \`demo@example.com\` with password \`${DEMO_PASSWORD}\`, and \`admin@example.com\` with \`${adminPassword}\``,
  );
}
