// Declaring the app's own capability makes `todo.manage` autocomplete in `userCan` and `defineRole`.
// See https://ohne.dev/docs/auth/roles#custom-capabilities
declare module 'ohnejs' {
  interface KnownCapabilities {
    /**
     * Reaching every account's lists and tasks, past the `own` scope.
     * The `admin` role holds it through `*`.
     */
    'todo.manage': true;
  }
}
