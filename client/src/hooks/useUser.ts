import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserProfile, Analytics } from "@/types/billing";

const PROFILE_KEY = "profile";

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: [PROFILE_KEY],
    queryFn: () => api.get("/user/profile").then((r) => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; email?: string }) =>
      api.put("/user/profile", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}

export function useUpdateBrandVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      defaultTone?: string;
      customToneInstructions?: string;
      brandName?: string;
    }) => api.put("/user/brand-voice", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}

export function useAnalytics() {
  return useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: () => api.get("/user/analytics").then((r) => r.data),
  });
}
