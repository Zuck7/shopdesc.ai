import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Plan, UsageInfo } from "@/types/billing";

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get("/billing/plans").then((r) => r.data),
    staleTime: 60 * 60 * 1000, // cache 1 hour
  });
}

export function useUsage() {
  return useQuery<UsageInfo>({
    queryKey: ["usage"],
    queryFn: () => api.get("/billing/usage").then((r) => r.data),
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (plan: string) =>
      api
        .post<{ url: string }>("/billing/subscribe", { plan })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}

export function usePortalSession() {
  return useMutation({
    mutationFn: () =>
      api.post<{ url: string }>("/billing/portal").then((r) => r.data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}
