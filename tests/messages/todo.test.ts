import { deepStrictEqual, ok } from 'node:assert';
import { describe, it } from 'node:test';
import { dotFlatten, isString } from 'ohnejs/utils';

import de from '../../messages/todo/de.json' with { type: 'json' };
import en from '../../messages/todo/en.json' with { type: 'json' };

describe('the todo messages', () => {
  it('define the same keys in every language', () => {
    deepStrictEqual(Object.keys(dotFlatten(de)).sort(), Object.keys(dotFlatten(en)).sort());
  });

  it('hold a text for every key', () => {
    for (const catalog of [en, de]) {
      for (const [key, text] of Object.entries(dotFlatten(catalog)))
        ok(isString(text) && text !== '', key);
    }
  });
});
