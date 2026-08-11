import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { emailError, normalizeEmail } from "@/lib/auth-validation";
import { FRIENDS_REFRESH_INTERVAL_MS, INVITES_REFRESH_INTERVAL_MS } from "@/lib/live-updates";
import type { Friend, Invites, SearchUser } from "@/types/api";

export const queryKeys = {
  me: ["me"] as const,
  friends: ["friends"] as const,
  invites: (id: number) => ["invites", id] as const,
};

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: () => api.request<Friend[]>("/friends"),
    refetchInterval: FRIENDS_REFRESH_INTERVAL_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
}

export function useInvites(userId?: number) {
  return useQuery({
    queryKey: queryKeys.invites(userId ?? 0),
    queryFn: () => api.request<Invites>(`/invites/${userId}`),
    enabled: Boolean(userId),
    refetchInterval: INVITES_REFRESH_INTERVAL_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
}

export function useSearchUsers(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return useQuery({
    queryKey: ["user-search", normalizedEmail],
    queryFn: async () => {
      const result = await api.request<SearchUser | SearchUser[]>(
        `/users/search?email=${encodeURIComponent(normalizedEmail)}`,
      );
      return Array.isArray(result) ? result : result ? [result] : [];
    },
    enabled: !emailError(normalizedEmail),
    retry: false,
  });
}

export function useInviteActions(userId?: number) {
  const client = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["invites"] }),
      client.invalidateQueries({ queryKey: queryKeys.friends }),
      client.invalidateQueries({ queryKey: ["user-search"] }),
    ]);
  };

  return {
    send: useMutation({
      mutationFn: (id: number) => api.request(`/invites/${id}`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    accept: useMutation({
      mutationFn: (id: number) => api.request(`/invites/${id}/accept`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    decline: useMutation({
      mutationFn: (id: number) => api.request(`/invites/${id}/decline`, { method: "POST" }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.request(`/friends/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    invitesKey: queryKeys.invites(userId ?? 0),
  };
}
