import { defineSkill } from 'ohnejs';

/**
 * Spreads the open tasks that slipped over the coming days instead of letting them pile up.
 *
 * A skill is instructions for the assistant, never code, and the file name is its name.
 * The model reads `prompt` when a question calls for it, or when a person types `/` in Cmd+K and picks it.
 * `title` and `description` are message keys, so Cmd+K shows them in the person's language.
 * `capability` hides it from anyone who may not change tasks.
 * See https://ohne.dev/docs/ai/skills
 */
export default defineSkill({
  title: 'todo.skills.rescheduleOverdue.title',
  description: 'todo.skills.rescheduleOverdue.description',
  capability: 'collection.Tasks.update',
  prompt: [
    'Find the open tasks whose `due` is before today.',
    'Read what is already due over the next seven days, so no day gets crowded.',
    'Give each overdue task a new `due`: high priority today or tomorrow, the rest spread out.',
    'Put no more than three rescheduled tasks on one day.',
    'Propose every new `due` in one batch, and list each task with its new day.',
  ],
});
