import {
  badRequest,
  defineHandler,
  forbidden,
  query,
  queryUntyped,
  readJSONBody,
  useT,
} from 'ohnejs';
import { accountLayout, createSession, toUser, type User } from 'ohnejs/auth';
import { isString } from 'ohnejs/utils';

/**
 * `POST /signup`
 *
 * Creates a `member` account from `{ email, password }`, signs it in, and answers the `User`.
 * A body without both as strings is a `400`, and a body past 4 KB a `413`.
 * A bad or taken email, or a short password, is a `422` with per-field messages, as any `Users` write.
 * Before the first account exists it answers `403`, so the install page creates the admin first.
 * One client gets five calls an hour, and a call past that answers `429`.
 *
 * The file name is the route: `api/signup.post.ts` answers `POST /signup`.
 * See https://ohne.dev/docs/auth/authentication#creating-accounts
 */
export default defineHandler(
  async (): Promise<User> => {
    const body = await readJSONBody<{ email?: unknown; password?: unknown } | null>();
    const email = body?.email;
    const password = body?.password;
    if (!isString(email) || !isString(password)) throw badRequest();

    // `unscoped()` skips any `query:filter` hook, so this asks the same question the install page does.
    if (!(await queryUntyped('Users').unscoped().exists())) {
      const t = useT();
      throw forbidden(t('todo.signup.installFirst'));
    }

    // Only `email` and `password` come from the body, so nobody can sign up with the `admin` role.
    // `createOrThrow` checks every `Users` rule and answers `422` when one fails.
    // The `password` field stores only a hash, so you pass the plain text here.
    const record = await query('Users').createOrThrow({ email, password, roles: ['member'] });
    await createSession(record.UUID);
    return toUser(record, await accountLayout(toUser(record)));
  },
  { maxBodySize: '4kb', rateLimit: { limit: 5, window: '1h' } },
);
