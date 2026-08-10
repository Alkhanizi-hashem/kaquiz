import assert from "node:assert/strict";
import test from "node:test";

import { resolveApiUrl } from "./api-url.ts";

test("development uses localhost when the API URL is omitted", () => {
  assert.equal(resolveApiUrl(undefined, true), "http://localhost:3000/api");
});

test("local exports use localhost when the API URL is omitted", () => {
  assert.equal(resolveApiUrl("", false), "http://localhost:3000/api");
});

test("configured local API URLs are trimmed", () => {
  assert.equal(resolveApiUrl(" http://192.168.1.20:3000/api ", false), "http://192.168.1.20:3000/api");
});
