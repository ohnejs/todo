import type { AddressInfo } from 'node:net';

import { ok, strictEqual } from 'node:assert';
import { query, serveAPI, useEnv, useShutdown } from 'ohnejs';
import { isUndefined, joinPath } from 'ohnejs/utils';

import { DEMO_PASSWORD } from '../boot/_seed.ts';

/**
 * One answer from the app under test.
 */
export interface TestResponse {
  /**
   * The HTTP status.
   */
  status: number;

  /**
   * The parsed JSON body, `null` when the body is empty.
   */
  body: any;

  /**
   * The `session=...` pair the answer set, ready to send back as a `cookie` header.
   */
  cookie?: string;
}

/**
 * What a test request sends besides its method and path.
 */
export interface TestRequest {
  /**
   * The body, sent as JSON.
   */
  json?: unknown;

  /**
   * The `cookie` header, such as a `session=...` pair from `signIn`.
   */
  cookie?: string;
}

/**
 * The app's API, served from this process on an in-memory database the seed has filled.
 */
export interface TestApp {
  /**
   * Sends one request to the API and reads the answer.
   */
  request(method: string, path: string, options?: TestRequest): Promise<TestResponse>;

  /**
   * Signs in through `POST /auth/login` and returns the session cookie.
   */
  signIn(email: string, password?: string): Promise<string>;

  /**
   * Signs in as the seeded admin, after giving it a known password in place of the seed's random one.
   */
  signInAdmin(): Promise<string>;

  /**
   * Shuts the API down and closes the database.
   */
  stop(): Promise<void>;
}

/**
 * Boots the app's API on a free port, with an in-memory database and no output.
 * Codegen is skipped, since `ohne prepare` already wrote the types.
 */
export async function startApp(): Promise<TestApp> {
  useEnv().set('SILENT', true);
  useEnv().set('SKIP_CODEGEN', true);
  useEnv().set('DATABASE', ':memory:');
  useEnv().set('PORT', 0);
  const { server } = await serveAPI(joinPath(import.meta.dirname, '..'));
  const { port } = server.address() as AddressInfo;

  const app: TestApp = {
    async request(method, path, { json, cookie } = {}) {
      const headers = new Headers();
      const init: RequestInit = { method, headers };
      if (!isUndefined(cookie)) headers.set('cookie', cookie);
      if (!isUndefined(json)) {
        headers.set('content-type', 'application/json');
        init.body = JSON.stringify(json);
      }
      const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
      const text = await response.text();
      const session = response.headers.getSetCookie().find((line) => line.startsWith('session='));
      return {
        status: response.status,
        body: text === '' ? null : JSON.parse(text),
        cookie: session?.split(';', 1)[0],
      };
    },

    async signIn(email, password = DEMO_PASSWORD) {
      const { status, cookie } = await app.request('POST', '/auth/login', {
        json: { email, password },
      });
      strictEqual(status, 200, `Sign-in as ${email} failed`);
      ok(cookie);
      return cookie;
    },

    async signInAdmin() {
      const password = 'test-admin-password';
      await query('Users').where('email', 'admin@example.com').updateOrThrow({ password });
      return app.signIn('admin@example.com', password);
    },

    async stop() {
      await useShutdown().run();
      useShutdown().unwatch();
    },
  };
  return app;
}
