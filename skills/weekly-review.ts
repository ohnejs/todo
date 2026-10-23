import { defineSkill } from 'ohnejs';

/**
 * Looks back over the week and tidies what is left, the way a weekly review does.
 *
 * A skill is instructions for the assistant, never code, and the file name is its name.
 * The model reads `prompt` when a question calls for it, or when a person types `/` in Cmd+K and picks it.
 * `title` and `description` are message keys, so Cmd+K shows them in the person's language.
 * `capability` hides it from anyone who may not read tasks.
 * See https://ohne.dev/docs/ai/skills
 */
export default defineSkill({
  title: 'todo.skills.weeklyReview.title',
  description: 'todo.skills.weeklyReview.description',
  capability: 'collection.Tasks.read',
  prompt: [
    'Count the tasks finished in the last seven days: `done` is true and `_updatedAt` falls in them.',
    'List what is still open, grouped by list, with what is overdue first.',
    'Point out open tasks with no `due`, and tasks that are too vague to start, by title.',
    'Suggest at most three changes: a date, a split into smaller tasks, or a deletion.',
    'Change nothing until the person picks a suggestion.',
  ],
});
