import { defineRole } from 'ohnejs';

/**
 * The `member` role sign-up grants: everything on `Lists` and `Tasks`, and the assistant.
 * The `own` scope then narrows it to the member's own records, the assistant's requests included.
 *
 * The file name is the role's name, so this is `member`.
 * See https://ohne.dev/docs/auth/roles#defining-roles
 */
export default defineRole({
  label: 'todo.roles.member.label',
  description: 'todo.roles.member.description',
  capabilities: ['collection.Lists.*', 'collection.Tasks.*', 'ai.use'],
});
