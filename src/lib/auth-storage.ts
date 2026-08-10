export const AUTH_TOKEN_KEY = "kaquiz.access-token";

export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};

export function createTokenStorage(adapter: StorageAdapter) {
  return {
    getToken: () => adapter.getItem(AUTH_TOKEN_KEY),
    setToken: async (token: string) => {
      await adapter.setItem(AUTH_TOKEN_KEY, token);
    },
    clearToken: async () => {
      await adapter.removeItem(AUTH_TOKEN_KEY);
    },
  };
}
