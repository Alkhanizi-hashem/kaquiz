import { useEffect, useRef } from "react";
import MapView, { Marker, type Region } from "react-native-maps";

import { MapControls } from "@/components/map-controls";
import { friendMapPins, selectedFriendPin } from "@/lib/friend-map";
import type { Friend } from "@/types/api";
import { relativeTime } from "@/lib/format";
import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

export function FriendsMap({ friends, selectedFriendId }: { friends: Friend[]; selectedFriendId?: string }) {
  const pins = friendMapPins(friends);
  const center = pins[0] ?? { latitude: 40.7128, longitude: -74.006 };
  const initialRegion = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: pins.length ? 0.08 : 18,
    longitudeDelta: pins.length ? 0.08 : 18,
  };
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(initialRegion);

  useEffect(() => {
    const selected = selectedFriendPin(friends, selectedFriendId);
    if (!selected) return;
    const region = {
      latitude: selected.latitude,
      longitude: selected.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    regionRef.current = region;
    mapRef.current?.animateToRegion(region, 500);
  }, [friends, selectedFriendId]);

  const zoom = (factor: number) => {
    const current = regionRef.current;
    const region = {
      ...current,
      latitudeDelta: Math.min(90, Math.max(0.002, current.latitudeDelta * factor)),
      longitudeDelta: Math.min(180, Math.max(0.002, current.longitudeDelta * factor)),
    };
    regionRef.current = region;
    mapRef.current?.animateToRegion(region, 250);
  };

  return (
    <>
      <MapView
        ref={mapRef}
        accessibilityLabel="Map showing friends' latest shared locations"
        initialRegion={initialRegion}
        onRegionChangeComplete={(region) => {
          regionRef.current = region;
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
            description={`Updated ${relativeTime(friend.location?.timestamp)}`}
            pinColor={colors.greenDark}
          />
        ))}
      </MapView>
      <MapControls onZoomIn={() => zoom(0.5)} onZoomOut={() => zoom(2)} />
    </>
  );
}
