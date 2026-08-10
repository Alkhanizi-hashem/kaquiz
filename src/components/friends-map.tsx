import MapView, { Marker } from "react-native-maps";

import type { Friend } from "@/types/api";
import { displayName } from "@/lib/user-display";

function validFriends(friends: Friend[]) {
  return friends.flatMap((friend) => {
    const latitude = Number(friend.location?.latitude);
    const longitude = Number(friend.location?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ friend, latitude, longitude }]
      : [];
  });
}

export function FriendsMap({ friends }: { friends: Friend[] }) {
  const pins = validFriends(friends);
  const center = pins[0] ?? { latitude: 40.7128, longitude: -74.006 };

  return (
    <MapView
      accessibilityLabel="Map showing friends' latest shared locations"
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: pins.length ? 0.08 : 18,
        longitudeDelta: pins.length ? 0.08 : 18,
      }}
      showsUserLocation
      showsMyLocationButton
      style={{ flex: 1 }}
    >
      {pins.map(({ friend, latitude, longitude }) => (
        <Marker
          key={friend.id}
          coordinate={{ latitude, longitude }}
          title={displayName(friend)}
          description="Latest shared location"
          pinColor="#20C77A"
        />
      ))}
    </MapView>
  );
}
