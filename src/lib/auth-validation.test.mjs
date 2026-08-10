import assert from "node:assert/strict";
import test from "node:test";

const validationModule = await import("./auth-validation.ts").catch(() => null);

test("login validation trims and normalizes a valid email", () => {
  assert.ok(validationModule, "auth validation module should exist");
  assert.deepEqual(
    validationModule.validateLogin({ email: "  Friend@Example.COM ", password: "atlas-pass" }),
    { values: { email: "friend@example.com", password: "atlas-pass" }, errors: {} },
  );
});

test("login validation reports empty and malformed fields", () => {
  assert.ok(validationModule, "auth validation module should exist");
  assert.deepEqual(
    validationModule.validateLogin({ email: "not-an-email", password: "" }).errors,
    { email: "Enter a valid email address.", password: "Enter your password." },
  );
});

test("registration validation applies the visible password policy", () => {
  assert.ok(validationModule, "auth validation module should exist");
  assert.deepEqual(
    validationModule.validateRegistration({ name: " ", email: "person@example.com", password: "short" }).errors,
    {
      name: "Enter your name.",
      password: "Use at least 12 characters, including a letter and a number.",
    },
  );
  assert.deepEqual(
    validationModule.validateRegistration({ name: " Atlas Friend ", email: "PERSON@example.com", password: "atlas-friend1" }),
    {
      values: { name: "Atlas Friend", email: "person@example.com", password: "atlas-friend1" },
      errors: {},
    },
  );
});
