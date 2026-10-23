import { defineCollection, field } from 'ohnejs';
import { aiUsersDefinition } from 'ohnejs/ai';

const PASSWORD_MIN = 8;

/**
 * The `Users` collection of `ohnejs/base`, with a minimum password length.
 * It spreads `aiUsersDefinition`, the base definition plus the switch that turns auto-accept on.
 * The rule sits on the field, so sign-up, the install page, the account page and admin edits all keep it.
 */
export default defineCollection({
  ...aiUsersDefinition,
  fields: {
    ...aiUsersDefinition.fields,
    password: field('password', {
      ...aiUsersDefinition.fields.password.options,
      // A validator returns a message to refuse the value, or `undefined` to accept it.
      validators: [
        (value) =>
          value.length < PASSWORD_MIN
            ? { key: 'validation.minLength', params: { min: PASSWORD_MIN } }
            : undefined,
      ],
    }),
  },
});
