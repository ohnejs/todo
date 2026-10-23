import { defineConfig } from 'ohnejs';

export default defineConfig({
  // `ohnejs/base` brings sign-in, users and the dashboard. `ohnejs/ai` adds the assistant behind Cmd+K.
  layers: ['ohnejs/base', 'ohnejs/ai'],
  ai: {
    // `key` names the environment variable that holds the API key, so the key itself stays in `.env`.
    model: 'claude',
    models: {
      claude: { provider: 'anthropic', model: 'claude-opus-5-5', key: 'ANTHROPIC_API_KEY' },
    },
    // The model sees no field values unless you list them here, so it reads these and nothing else.
    // See https://ohne.dev/docs/ai/assistant#what-reaches-the-model
    data: {
      Lists: ['name', 'color'],
      Tasks: ['title', 'notes', 'done', 'due', 'priority', 'list'],
    },
    // The rules of this app, which the model reads on every question.
    instructions: [
      'This is a to-do app: `Lists` group `Tasks`, and every record belongs to the person asking.',
      'Never send `owner`: the server stamps it with the person.',
      '`due` is a calendar day as `YYYY-MM-DD`, read in the time zone of the turn context.',
      'Resolve words like today, tomorrow, Friday or next week from the date in the turn context.',
      "A task's `list` is the `UUID` of one of the person's lists: find it by name before you write.",
      'Create a list only when the person asks for one, or when none of theirs fits and they agree.',
      '`priority` is `low`, `normal` or `high`; keep `normal` unless the words signal urgency.',
      'Finish a task by setting `done` to true, and delete only when the person asks to delete.',
      'Turn a vague goal into small, concrete tasks, each one a person can finish in one sitting.',
      "Answer in the person's language, briefly, and name tasks by their titles.",
    ],
    // Edits that touch only these fields may skip the approval table, once a person allows it.
    // Each person turns that on for themselves, with a switch on their account page.
    // See https://ohne.dev/docs/ai/assistant#auto-accept
    autoAccept: { max: 20, fields: { Tasks: ['done', 'due', 'priority'] } },
  },
  dashboard: {
    // Links the Today page in the sidebar, for everyone who may read tasks.
    // See https://ohne.dev/docs/dashboard/pages#the-sidebar
    menu: {
      today: {
        parent: 'general',
        order: 2,
        to: '/today',
        label: 'todo.today.title',
        icon: 'calendar-due',
        can: 'collection.Tasks.read',
      },
      // A collection is a menu node too, keyed by its name, so this puts Tasks above Lists.
      Tasks: { order: 1 },
      Lists: { order: 2 },
    },
  },
});
