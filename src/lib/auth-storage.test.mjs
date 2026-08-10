import assert from "node:assert/strict";
import test from "node:test";

import { createTokenStorage } from "./auth-storage.ts";

test("token storage persists, reads, and clears the session token", async () => {
  const values = new Map();
  const storage = createTokenStorage({
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async (key) => values.delete(key),
  });

  await storage.setToken("atlas-token");
  assert.equal(await storage.getToken(), "atlas-token");

  await storage.clearToken();
  assert.equal(await storage.getToken(), null);
});
