import { defineSkill } from 'ohnejs';

/**
 * Turns whatever the person writes, from one line to a brain dump, into filed tasks.
 *
 * A skill is instructions for the assistant, never code, and the file name is its name.
 * The model reads `prompt` when a question calls for it, or when a person types `/` in Cmd+K and picks it.
 * `title` and `description` are message keys, so Cmd+K shows them in the person's language.
 * `capability` hides it from anyone who may not create tasks.
 * See https://ohne.dev/docs/ai/skills
 */
export default defineSkill({
  title: 'todo.skills.capture.title',
  description: 'todo.skills.capture.description',
  capability: 'collection.Tasks.create',
  prompt: [
    "Read the person's lists first, by name, so every task lands in one of them.",
    'Split the text into tasks, one per concrete action, each title short and starting with a verb.',
    'Infer `due` and `priority` from the words; leave `due` empty when they name no time.',
    'Put details that do not fit a title into `notes`.',
    'When no list fits a task, ask before you create one.',
    'Create every task in one batch, then say how many you added, to which lists.',
  ],
});
