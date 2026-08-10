import { createApiClient } from "./api-client";
import { resolveApiUrl } from "./api-url";
import { tokenStorage } from "./token-storage";

export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL);

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: tokenStorage.getToken,
});
