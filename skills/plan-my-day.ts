import { defineSkill } from 'ohnejs';

/**
 * Orders the person's day: what slipped, what is due, and what can wait.
 *
 * A skill is instructions for the assistant, never code, and the file name is its name.
 * The model reads `prompt` when a question calls for it, or when a person types `/` in Cmd+K and picks it.
 * `title` and `description` are message keys, so Cmd+K shows them in the person's language.
 * `capability` hides it from anyone who may not change tasks.
 * See https://ohne.dev/docs/ai/skills
 */
export default defineSkill({
  title: 'todo.skills.planMyDay.title',
  description: 'todo.skills.planMyDay.description',
  capability: 'collection.Tasks.update',
  prompt: [
    'Read the open tasks due today or earlier, and the open tasks due in the next three days.',
    'Order today: overdue high priority first, then what is due today, then overdue normal and low.',
    'Keep the day to what one person can finish; name the tasks that will not fit.',
    'Offer to move those to a later day, and change `due` only through the approval table.',
    'Answer with the plan as a short numbered list of titles, then one line on what moved.',
  ],
});
