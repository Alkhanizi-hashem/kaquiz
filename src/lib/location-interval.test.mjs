import assert from "node:assert/strict";
import test from "node:test";

import { shouldSendLocation } from "./location-interval.ts";

test("the first location is sent immediately", () => {
  assert.equal(shouldSendLocation(1_000, null), true);
});

test("locations inside the five-second boundary are not sent", () => {
  assert.equal(shouldSendLocation(5_999, 1_000), false);
});

test("a location at the five-second boundary is sent", () => {
  assert.equal(shouldSendLocation(6_000, 1_000), true);
});
