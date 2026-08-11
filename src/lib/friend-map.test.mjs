import assert from "node:assert/strict";
import test from "node:test";

import { friendMapPins, isFriendOnline, selectedFriendPin } from "./friend-map.ts";

const friends = [
  {
    id: 1,
    name: "Alice",
    avatar: null,
    location: { latitude: "26.2235", longitude: "50.5876", timestamp: "2026-08-11T12:00:00.000Z" },
  },
  {
    id: 2,
    name: "Bob",
    avatar: null,
    location: { latitude: "invalid", longitude: "50.5", timestamp: "2026-08-11T12:00:00.000Z" },
  },
  { id: 3, name: "Carol", avatar: null, location: null },
];

test("map pins include only friends with valid coordinates", () => {
  assert.deepEqual(friendMapPins(friends), [{
    friend: friends[0],
    latitude: 26.2235,
    longitude: 50.5876,
  }]);
});

test("selected friend pin finds a located friend by route parameter", () => {
  assert.equal(selectedFriendPin(friends, "1")?.friend.name, "Alice");
  assert.equal(selectedFriendPin(friends, "2"), undefined);
  assert.equal(selectedFriendPin(friends, undefined), undefined);
});

test("online status requires a recent valid timestamp", () => {
  const now = Date.parse("2026-08-11T12:00:29.000Z");
  assert.equal(isFriendOnline(friends[0].location.timestamp, now), true);
  assert.equal(isFriendOnline("2026-08-11T11:59:00.000Z", now), false);
  assert.equal(isFriendOnline("invalid", now), false);
});
