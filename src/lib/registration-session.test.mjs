import assert from "node:assert/strict";
import test from "node:test";

import { parseAppSession, registerAndStartSession } from "./registration-session.ts";

test("registration posts normalized credentials and starts the returned session", async () => {
  const calls = [];
  const session = {
    access_token: "new-account-token",
    user: { id: 2, name: "Atlas Friend", email: "friend@example.com", avatar: null },
  };

  await registerAndStartSession({
    register: async (values) => {
      calls.push(["register", values]);
      return session;
    },
    startSession: async (value) => {
      calls.push(["start-session", value]);
    },
  }, {
    name: "Atlas Friend",
    email: "friend@example.com",
    password: "atlas-friend1",
  });

  assert.deepEqual(calls, [
    ["register", { name: "Atlas Friend", email: "friend@example.com", password: "atlas-friend1" }],
    ["start-session", session],
  ]);
});

test("registration does not start a session when the request fails", async () => {
  let sessionStarted = false;

  await assert.rejects(
    registerAndStartSession({
      register: async () => {
        throw new Error("Email is already registered");
      },
      startSession: async () => {
        sessionStarted = true;
      },
    }, {
      name: "Atlas Friend",
      email: "friend@example.com",
      password: "atlas-friend1",
    }),
    /already registered/,
  );

  assert.equal(sessionStarted, false);
});

test("session responses require a non-empty access token", () => {
  assert.deepEqual(parseAppSession({ access_token: " token " }), { access_token: "token" });
  assert.throws(() => parseAppSession({ access_token: "" }), /valid session token/);
});
