import * as SecureStore from "expo-secure-store";

import { createTokenStorage } from "./auth-storage";

export const tokenStorage = createTokenStorage({
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
});
