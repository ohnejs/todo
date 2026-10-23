import {
  badge,
  button,
  card,
  checkbox,
  dateTimePreferences,
  defineDashboardPage,
  formatDate,
  formatNumber,
  type KnownCollections,
  list,
  loaded,
  page,
  type Resource,
  resolveTimezone,
  sessionUser,
  type Text,
  useAction,
  useNow,
  useResource,
  zonedFromTimestamp,
} from 'ohnejs/dashboard';
import {
  isNullish,
  isoDayToMs,
  isString,
  isUndefined,
  msToISODay,
  ref,
  type Ref,
} from 'ohnejs/utils';

import { dueBuckets, todayQuery } from '../components/due.ts';

// A task as the Today query answers it, with `list` populated down to its name.
type Task = Omit<KnownCollections['Tasks'], 'list'> & {
  list: Pick<KnownCollections['Lists'], 'name'> | null;
};

/**
 * The Today page: the signed-in account's overdue tasks and the ones due today, each with a done box.
 * Today is the calendar day in the account's time zone, so the cards turn over at its midnight.
 *
 * The file's path under `pages/` is its route, so this page opens at `/today`.
 * The page function runs once per visit, and each getter in it re-runs when what it reads changes.
 * See https://ohne.dev/docs/dashboard/pages and https://ohne.dev/docs/dashboard/data
 */
export default defineDashboardPage(() => {
  // `useNow` ticks every 30 seconds, so the page notices when midnight passes.
  const today = (): string => {
    const zone = resolveTimezone(dateTimePreferences().timeZone);
    const { year, month, day } = zonedFromTimestamp(useNow().value, zone);
    return msToISODay(Date.UTC(year, month - 1, day));
  };

  // Reads the tasks over the API with the signed-in session, so the `own` scope applies here too.
  // The body is a getter: it re-sends when the day changes, and waits while the session loads.
  const tasks = useResource<Task[]>('POST /collections/[collection]/query', {
    params: { collection: 'tasks' },
    body: () => {
      const user = sessionUser();
      return isNullish(user) ? undefined : todayQuery(user.UUID, today());
    },
  });
  // One action for every done box. `busy({ uuid })` tells which box has a request in flight.
  const toggle = useAction('PATCH /collections/[collection]/[uuid]', {
    params: { collection: 'tasks' },
  });

  /**
   * Holds the clicked value until the reload lands, so the box never flips back in between.
   */
  const done = (task: () => Task): Ref<boolean> => {
    const pending = ref<boolean | undefined>(undefined);
    return {
      get value() {
        return pending.value ?? task().done;
      },
      set value(next) {
        pending.value = next;
        void toggle
          .run({ params: { uuid: task().UUID }, body: { done: next } })
          .then(async (ok) => {
            if (ok) await tasks.reload();
            pending.value = undefined;
          });
      },
    };
  };

  const details = (task: Task): string => {
    const day = isNullish(task.due) || task.due === today() ? undefined : isoDayToMs(task.due);
    return [task.list?.name, isUndefined(day) ? undefined : formatDate(day)]
      .filter(isString)
      .join(' · ');
  };

  const row = (task: () => Task) =>
    checkbox(done(task), () => task().title, {
      disabled: () => toggle.busy({ uuid: task().UUID }),
      description: () => details(task()),
    });

  const section = (title: Text, emptyText: Text, rows: Resource<Task[]>) =>
    card(
      loaded(rows, (items) => list(items, row, { key: (task) => task.UUID }), { emptyText }),
      {
        title,
        badge: badge(
          () => {
            const items = rows();
            return isUndefined(items) ? '' : formatNumber(items.length);
          },
          { size: -2 },
        ),
      },
    );

  // `pick` derives the two cards from one request, so both load and refresh together.
  const buckets = tasks.pick((all) => dueBuckets(all, today()));
  const overdue = buckets.pick((bucket) => bucket.overdue);
  const dueToday = buckets.pick((bucket) => bucket.today);
  return page(
    {
      title: 'todo.today.title',
      description: 'todo.today.description',
      actions: button('todo.today.newTask', { href: '/collections/tasks/new', icon: 'plus' }),
    },
    section('todo.today.overdue', 'todo.today.noneOverdue', overdue),
    section('todo.today.dueToday', 'todo.today.noneToday', dueToday),
  );
});
