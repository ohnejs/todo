import { defineCollection, field } from 'ohnejs';
import { useUser } from 'ohnejs/auth';

import { own } from './_own.ts';

/**
 * The `Tasks` collection: what someone has to do, with an optional due day and list.
 * Each task belongs to the account that created it, and `own` keeps it theirs.
 * The API checks a link against the caller, so a member's task links only one of their own lists.
 * An admin reads every list, so an admin's write can file a task under another account's list.
 * Deleting the list or the account deletes the task.
 */
export default defineCollection({
  label: 'todo.tasks.label',
  // Every operation of the collections API runs `own` first, so each account reaches only its tasks.
  // See https://ohne.dev/docs/api/collections#access
  api: {
    read: { access: own },
    create: { access: own },
    update: { access: own },
    delete: { access: own },
  },
  dashboard: {
    icon: 'checkbox',
    recordLabel: 'title',
    table: {
      columns: ['done | 6rem', 'title | 40%', 'due | 12rem', 'priority | 8rem', 'list'],
      order: ['done', 'due', 'title'],
    },
    // The editor form: `row` puts fields side by side, and `| 8rem` sets a width.
    layout: [{ row: ['title', 'done | 8rem'] }, 'notes', { row: ['due', 'priority', 'list'] }],
  },
  fields: {
    title: field('text', { max: 200, label: 'todo.tasks.title.label' }),
    notes: field('text', { multiline: true, nullable: true, label: 'todo.tasks.notes.label' }),
    done: field('boolean', { default: false, display: 'switch', label: 'todo.tasks.done.label' }),
    due: field('date', { nullable: true, index: true, label: 'todo.tasks.due.label' }),
    priority: field('select', {
      choices: [
        { value: 'low', label: 'todo.tasks.priority.low' },
        { value: 'normal', label: 'todo.tasks.priority.normal' },
        { value: 'high', label: 'todo.tasks.priority.high' },
      ],
      default: 'normal',
      display: 'buttons',
      label: 'todo.tasks.priority.label',
    }),
    list: field('record', {
      collection: 'Lists',
      onDelete: 'cascade',
      label: 'todo.tasks.list.label',
    }),
    // The signed-in caller is the default, so neither the dashboard nor the API client has to send it.
    owner: field('record', {
      collection: 'Users',
      onDelete: 'cascade',
      default: async () => (await useUser())?.UUID ?? null,
      label: 'todo.owner.label',
    }),
  },
});
