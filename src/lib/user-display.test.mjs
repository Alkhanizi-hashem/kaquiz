import assert from "node:assert/strict";
import test from "node:test";

import { displayName } from "./user-display.ts";

test("a missing name falls back to the email username", () => {
  assert.equal(displayName({ name: null, email: "atlas.friend@example.com" }), "atlas.friend");
});

test("a missing name and email uses an accessible generic label", () => {
  assert.equal(displayName({ name: null }), "Kaquiz user");
});

test("a non-empty name remains the display label", () => {
  assert.equal(displayName({ name: "  Ada  ", email: "ada@example.com" }), "Ada");
});
