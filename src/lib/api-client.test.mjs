import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, createApiClient } from "./api-client.ts";

test("authenticated JSON requests include the bearer token and body", async () => {
  let request;
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api/",
    getToken: async () => "secret-token",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const result = await client.request("/locations", {
    method: "POST",
    body: { latitude: 1, longitude: 2 },
  });

  assert.deepEqual(result, { id: 7 });
  assert.equal(request.url, "http://localhost:3000/api/locations");
  assert.equal(request.init.headers.Authorization, "Bearer secret-token");
  assert.equal(request.init.headers["Content-Type"], "application/json");
  assert.equal(request.init.body, '{"latitude":1,"longitude":2}');
});

test("API errors preserve backend validation messages", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api",
    getToken: async () => "token",
    fetchImpl: async () =>
      new Response(JSON.stringify({ message: "Invite already exists" }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }),
  });

  await assert.rejects(
    client.request("/invites/9", { method: "POST" }),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.message === "Invite already exists",
  );
});

test("API errors preserve the backend error envelope", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api",
    getToken: async () => "token",
    fetchImpl: async () =>
      new Response(JSON.stringify({ error: { code: "INVITE_CONFLICT", message: "A pending invitation already exists" } }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }),
  });

  await assert.rejects(
    client.request("/invites/9", { method: "POST" }),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.code === "INVITE_CONFLICT" &&
      error.message === "A pending invitation already exists",
  );
});

test("network failures return a friendly typed error", async () => {
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api",
    getToken: async () => null,
    fetchImpl: async () => {
      throw new TypeError("Failed to fetch");
    },
  });

  await assert.rejects(
    client.request("/users/me"),
    (error) =>
      error instanceof ApiError &&
      error.status === 0 &&
      error.message === "Unable to reach the server. Check your connection and try again.",
  );
});

test("authenticated 401 responses notify the global unauthorized handler", async () => {
  let unauthorizedCalls = 0;
  let rejectedToken;
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api",
    getToken: async () => "expired-token",
    fetchImpl: async () => new Response(null, { status: 401 }),
  });
  client.setUnauthorizedHandler(async (token) => {
    unauthorizedCalls += 1;
    rejectedToken = token;
  });

  await assert.rejects(client.request("/friends"), ApiError);

  assert.equal(unauthorizedCalls, 1);
  assert.equal(rejectedToken, "expired-token");
});

test("anonymous 401 responses do not clear an unrelated authenticated session", async () => {
  let unauthorizedCalls = 0;
  const client = createApiClient({
    baseUrl: "http://localhost:3000/api",
    getToken: async () => "existing-token",
    fetchImpl: async () => new Response(null, { status: 401 }),
  });
  client.setUnauthorizedHandler(async () => {
    unauthorizedCalls += 1;
  });

  await assert.rejects(client.request("/auth", { authenticated: false }), ApiError);

  assert.equal(unauthorizedCalls, 0);
});
