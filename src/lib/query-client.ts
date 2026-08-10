import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, error) => {
        const status = error && typeof error === "object" && "status" in error
          ? Number(error.status)
          : 0;
        return status >= 400 && status < 500 ? false : count < 2;
      },
    },
    mutations: { retry: false },
  },
});
