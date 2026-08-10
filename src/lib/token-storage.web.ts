import { createTokenStorage } from "./auth-storage";

const webStorage = {
  async getItem(key: string) {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch {
      throw new Error("Browser storage is unavailable. Enable site storage to sign in.");
    }
  },
  async removeItem(key: string) {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      // A blocked store already behaves like a signed-out session.
    }
  },
};

export const tokenStorage = createTokenStorage(webStorage);
