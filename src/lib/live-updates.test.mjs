import assert from "node:assert/strict";
import test from "node:test";

import { FRIENDS_REFRESH_INTERVAL_MS, INVITES_REFRESH_INTERVAL_MS, newIncomingInvites } from "./live-updates.ts";

test("friend requests refresh quickly without manual reload", () => {
  assert.equal(INVITES_REFRESH_INTERVAL_MS, 3_000);
});

test("friend locations refresh at the same cadence they are sent", () => {
  assert.equal(FRIENDS_REFRESH_INTERVAL_MS, 5_000);
});

const invite = (id) => ({ id, sender: { id, name: `User ${id}`, avatar: null }, created_at: "2026-08-11T12:00:00.000Z" });

test("the first invite response establishes a baseline without showing old notifications", () => {
  assert.deepEqual(newIncomingInvites(null, [invite(1)]), []);
});

test("only newly arrived invites trigger notifications", () => {
  assert.deepEqual(newIncomingInvites(new Set([1, 2]), [invite(2), invite(3)]), [invite(3)]);
});
