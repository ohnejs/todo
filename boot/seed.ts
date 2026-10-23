import { hook } from 'ohnejs';

import { seed } from './_seed.ts';

// Boot files run before the schema sync creates the tables, so the seed waits for `schema:synced`.
// It fires on every start, and the seed itself skips a database that already holds an account.
// See https://ohne.dev/docs/project/hooks#schemasynced
hook('schema:synced', seed);
