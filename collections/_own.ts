import type { AccessContext, AccessScope } from 'ohnejs';

import { requireUser, userCan } from 'ohnejs/auth';

/**
 * Scopes an operation on `Lists` or `Tasks` to the caller's own records.
 * A write may name only the caller as `owner`, so no record changes hands or loses its owner.
 * A refused write answers the same `404` as a record that does not exist.
 * `todo.manage`, which the `admin` role covers, reaches every record.
 *
 * The `_` in the file name marks a helper, so ohne does not load it as a collection.
 * See https://ohne.dev/docs/api/collections#access
 */
export async function own(context: AccessContext): Promise<AccessScope<'owner'> | boolean> {
  // `requireUser` answers `401` when nobody is signed in.
  const user = await requireUser();
  if (userCan(user, 'todo.manage')) return true;

  // Only a create or an update carries `input`, the JSON body as the client sent it.
  const input = 'input' in context ? context.input : {};
  if ('owner' in input && input.owner !== user.UUID) return false;

  // A scope's `where` is added to the query with AND, so a request can never reach past it.
  // A create has no stored rows to filter, and the `owner` default gives it to the caller.
  return context.operation === 'create' ? true : { where: { owner: user.UUID } };
}
