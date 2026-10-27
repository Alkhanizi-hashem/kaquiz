import assert from "node:assert/strict";
import test from "node:test";
import { googleAndStartSession } from "./registration-session.ts";

test("Google ID token is exchanged and only Kaquiz session is persisted", async () => {
  const calls = [];
  const session = { access_token: "kaquiz-session", user: { id: 4, email: "test@example.com" } };
  await googleAndStartSession({
    exchange: async (body) => { calls.push(body); return session; },
    startSession: async (value) => { calls.push(value); },
  }, "google-token");
  assert.deepEqual(calls, [{ id_token: "google-token" }, session]);
});

test("Google account conflict or invalid session never starts local session", async () => {
  for (const exchange of [async () => { throw new Error("Account conflict"); }, async () => ({ access_token: "" })]) {
    let started = false;
    await assert.rejects(googleAndStartSession({ exchange, startSession: async () => { started = true; } }, "google-token"));
    assert.equal(started, false);
  }
});

test("empty Google credential is rejected before API call", async () => {
  await assert.rejects(googleAndStartSession({
    exchange: async () => { assert.fail("should not call API"); },
    startSession: async () => { assert.fail("should not start session"); },
  }, "  "), /ID token/);
});
