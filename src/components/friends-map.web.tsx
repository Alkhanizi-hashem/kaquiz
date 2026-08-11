import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import "leaflet/dist/leaflet.css";

import { MapControls } from "@/components/map-controls";
import { friendMapPins, selectedFriendPin } from "@/lib/friend-map";
import { displayName } from "@/lib/user-display";
import type { Friend } from "@/types/api";

type Leaflet = typeof import("leaflet");

export function FriendsMap({ friends, selectedFriendId }: { friends: Friend[]; selectedFriendId?: string }) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const initialFriendsRef = useRef(friends);
  const initialSelectedFriendIdRef = useRef(selectedFriendId);
  const [leaflet, setLeaflet] = useState<Leaflet | null>(null);

  useEffect(() => {
    let active = true;
    void import("leaflet").then((module) => {
      if (active) setLeaflet(module);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;
    const pins = friendMapPins(initialFriendsRef.current);
    const selected = selectedFriendPin(initialFriendsRef.current, initialSelectedFriendIdRef.current);
    const center = selected ?? pins[0] ?? { latitude: 40.7128, longitude: -74.006 };
    const container = containerRef.current as unknown as HTMLElement;
    const map = leaflet.map(container, { zoomControl: false })
      .setView([center.latitude, center.longitude], pins.length ? 13 : 3);
    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    markersRef.current = leaflet.layerGroup().addTo(map);
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [leaflet]);

  useEffect(() => {
    if (!leaflet || !markersRef.current) return;
    markersRef.current.clearLayers();
    for (const pin of friendMapPins(friends)) {
      const label = document.createElement("span");
      label.textContent = `${displayName(pin.friend)} · latest shared location`;
      leaflet.circleMarker([pin.latitude, pin.longitude], {
        radius: 9,
        color: "#08794A",
        fillColor: "#20C77A",
        fillOpacity: 1,
        weight: 3,
      }).bindPopup(label).addTo(markersRef.current);
    }
  }, [friends, leaflet]);

  useEffect(() => {
    const selected = selectedFriendPin(friends, selectedFriendId);
    if (selected && mapRef.current) {
      mapRef.current.setView([selected.latitude, selected.longitude], 16, { animate: true });
    }
  }, [friends, selectedFriendId]);

  return (
    <View accessibilityLabel="Interactive map showing friends' latest shared locations" style={{ flex: 1 }}>
      <View ref={containerRef} style={{ flex: 1 }} />
      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
      />
    </View>
  );
}
