import { defineCollection, field } from 'ohnejs';
import { useUser } from 'ohnejs/auth';

import { own } from './_own.ts';

/**
 * The `Lists` collection: named, colored groups of tasks.
 * Each list belongs to the account that created it, and `own` keeps it theirs.
 * Deleting the account deletes its lists.
 */
export default defineCollection({
  label: 'todo.lists.label',
  // Every operation of the collections API runs `own` first, so each account reaches only its lists.
  // See https://ohne.dev/docs/api/collections#access
  api: {
    read: { access: own },
    create: { access: own },
    update: { access: own },
    delete: { access: own },
  },
  // How the dashboard shows the collection: its icon, the name a record goes by, and the table.
  dashboard: {
    icon: 'list',
    recordLabel: 'name',
    table: { columns: ['name | 40%', 'color | 10rem', '_updatedAt'] },
  },
  fields: {
    name: field('text', { max: 80, label: 'todo.lists.name.label' }),
    color: field('color', {
      default: '#3b82f6',
      swatches: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#64748b'],
      label: 'todo.lists.color.label',
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
