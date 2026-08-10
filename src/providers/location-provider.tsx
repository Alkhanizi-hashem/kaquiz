import * as Location from "expo-location";
import { createContext, type PropsWithChildren, use, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { api } from "@/lib/api";
import { LOCATION_INTERVAL_MS } from "@/lib/location-interval";
import { createLocationSender } from "@/lib/location-sender";
import { useAuth } from "@/providers/auth-provider";

export type SharingStatus = "idle" | "requesting" | "live" | "paused" | "denied" | "error";

type LocationContextValue = {
  status: SharingStatus;
  error: string | null;
  lastSentAt: number | null;
  canAskAgain: boolean;
  retryPermission: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: PropsWithChildren) {
  const { status: authStatus } = useAuth();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [status, setStatus] = useState<SharingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [permissionAttempt, setPermissionAttempt] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    const sender = createLocationSender<Location.LocationObject>({
      intervalMs: LOCATION_INTERVAL_MS,
      send: async (position) => {
        await api.request("/locations", {
          method: "POST",
          body: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            ...(position.coords.accuracy === null
              ? {}
              : { accuracy: position.coords.accuracy }),
          },
        });
      },
      onSuccess: (sentAt) => {
        if (!cancelled) {
          setLastSentAt(sentAt);
          setStatus("live");
          setError(null);
        }
      },
      onError: (sendError) => {
        if (!cancelled) {
          setStatus("error");
          setError(sendError instanceof Error ? sendError.message : "Location update failed.");
        }
      },
    });

    async function start() {
      if (authStatus !== "authenticated") {
        setStatus("idle");
        return;
      }
      if (appState !== "active") {
        setStatus("paused");
        return;
      }

      setStatus("requesting");
      setError(null);
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status === Location.PermissionStatus.UNDETERMINED || permissionAttempt > 0) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (cancelled) return;
        setCanAskAgain(permission.canAskAgain);
        if (!permission.granted) {
          setStatus("denied");
          return;
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: LOCATION_INTERVAL_MS },
          (position) => {
            void sender.update(position);
            interval ??= setInterval(() => void sender.flush(), LOCATION_INTERVAL_MS);
          },
          (reason) => {
            if (!cancelled) {
              setStatus("error");
              setError(reason);
            }
          },
        );
        if (cancelled) subscription.remove();
      } catch (locationError) {
        if (!cancelled) {
          setStatus("error");
          setError(locationError instanceof Error ? locationError.message : "Location is unavailable.");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      sender.stop();
      subscription?.remove();
      if (interval) clearInterval(interval);
    };
  }, [appState, authStatus, permissionAttempt]);

  return (
    <LocationContext
      value={{
        status,
        error,
        lastSentAt,
        canAskAgain,
        retryPermission: () => setPermissionAttempt((value) => value + 1),
      }}
    >
      {children}
    </LocationContext>
  );
}

export function useLocationSharing() {
  const value = use(LocationContext);
  if (!value) throw new Error("useLocationSharing must be used inside LocationProvider");
  return value;
}
