// Plain functions with no browser code, so the Today page uses them and `tests/` checks them in Node.
import { isNull } from 'ohnejs/utils';

/**
 * The fields of a task that decide which Today card shows it.
 */
export interface DueTask {
  /**
   * The day the task is due, as `YYYY-MM-DD`.
   */
  due: string | null;

  /**
   * Whether the task is finished.
   */
  done: boolean;
}

/**
 * The collections API query behind one owner's Today page.
 * It reads every task due on `today` and every open one due before it, finished tasks last.
 *
 * It is the body of `POST /collections/tasks/query`, which reads like `GET` with the query in JSON.
 * See https://ohne.dev/docs/api/collections#reading
 */
export function todayQuery(owner: string, today: string) {
  return {
    // `own` already limits a member to their tasks, but an admin reads everyone's, so name the owner.
    where: { owner, or: [{ due: today }, { done: false, due: { lessThan: today } }] },
    order: ['done', 'due', 'title'],
    // `populate` swaps the `list` UUID for the list itself, here only its `name`.
    populate: [{ list: { select: ['name'] } }],
  };
}

/**
 * Splits tasks into the open ones due before `today` and every one due on `today`.
 */
export function dueBuckets<T extends DueTask>(
  tasks: readonly T[],
  today: string,
): { overdue: T[]; today: T[] } {
  return {
    overdue: tasks.filter((task) => !isNull(task.due) && task.due < today && !task.done),
    today: tasks.filter((task) => task.due === today),
  };
}
