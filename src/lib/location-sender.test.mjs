import assert from "node:assert/strict";
import test from "node:test";

import { createLocationSender } from "./location-sender.ts";

function deferred() {
  let resolve;
  const promise = new Promise((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
}

test("location sends never overlap and the latest coordinates follow an older request", async () => {
  let now = 1_000;
  const firstRequest = deferred();
  const sent = [];
  const sender = createLocationSender({
    now: () => now,
    send: async (position) => {
      sent.push(position);
      if (sent.length === 1) await firstRequest.promise;
    },
  });

  const firstFlush = sender.update({ latitude: 1, longitude: 1 });
  await sender.update({ latitude: 2, longitude: 2 });
  assert.deepEqual(sent, [{ latitude: 1, longitude: 1 }]);

  now = 6_000;
  firstRequest.resolve();
  await firstFlush;

  assert.deepEqual(sent, [
    { latitude: 1, longitude: 1 },
    { latitude: 2, longitude: 2 },
  ]);
});

test("a queued location waits until the interval has elapsed", async () => {
  let now = 1_000;
  const firstRequest = deferred();
  const sent = [];
  const sender = createLocationSender({
    now: () => now,
    send: async (position) => {
      sent.push(position);
      if (sent.length === 1) await firstRequest.promise;
    },
  });

  const firstFlush = sender.update({ latitude: 1, longitude: 1 });
  await sender.update({ latitude: 2, longitude: 2 });
  now = 2_000;
  firstRequest.resolve();
  await firstFlush;
  assert.equal(sent.length, 1);

  now = 6_000;
  await sender.flush();
  assert.deepEqual(sent[1], { latitude: 2, longitude: 2 });
});
