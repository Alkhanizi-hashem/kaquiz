import type { Friend } from "@/types/api";

export type FriendMapPin = {
  friend: Friend;
  latitude: number;
  longitude: number;
};

export function friendMapPins(friends: Friend[]): FriendMapPin[] {
  return friends.flatMap((friend) => {
    const latitude = Number(friend.location?.latitude);
    const longitude = Number(friend.location?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ friend, latitude, longitude }]
      : [];
  });
}

export function selectedFriendPin(friends: Friend[], friendId?: string) {
  if (!friendId) return undefined;
  return friendMapPins(friends).find(({ friend }) => String(friend.id) === friendId);
}

export function isFriendOnline(timestamp: string, now = Date.now(), maxAgeMs = 30_000) {
  const updatedAt = Date.parse(timestamp);
  return Number.isFinite(updatedAt) && now - updatedAt <= maxAgeMs;
}
