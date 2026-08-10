import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "./api-client.ts";
import { restoreFailureAction } from "./auth-restore.ts";

test("a 401 restore failure invalidates the saved session", () => {
  assert.equal(restoreFailureAction(new ApiError("Unauthorized", 401)), "sign-out");
});

test("network and server restore failures retain the saved session for retry", () => {
  assert.equal(restoreFailureAction(new ApiError("Offline", 0)), "retry");
  assert.equal(restoreFailureAction(new ApiError("Unavailable", 503)), "retry");
});
