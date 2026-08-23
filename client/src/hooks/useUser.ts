import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface IUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  brandName?: string;
  defaultTone: "professional" | "casual" | "luxury" | "playful" | "custom";
  customToneInstructions?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: string;
}

export interface UpdateUserPayload {
  name?: string;
  brandName?: string;
}

export interface UpdateBrandVoicePayload {
  defaultTone?: IUser["defaultTone"];
  customToneInstructions?: string;
  brandName?: string;
}

export interface AnalyticsData {
  totalProducts: number;
  totalGenerations: number;
  avgSeoScore: number;
  totalCost: number;
  generationsByDay: Array<{ date: string; count: number }>;
  seoScoreDistribution: Array<{ range: string; count: number }>;
  platformBreakdown: Array<{ platform: string; count: number }>;
}

const PROFILE_KEY = "profile";
const ANALYTICS_KEY = "analytics";

export function useProfile() {
  return useQuery<IUser>({
    queryKey: [PROFILE_KEY],
    queryFn: () => api.get("/users/profile").then((r) => r.data),
  });
}

/** @deprecated use useProfile */
export function useUser() {
  return useProfile();
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      api.put<IUser>("/users/profile", payload).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData([PROFILE_KEY], updated);
    },
  });
}

export function useUpdateBrandVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrandVoicePayload) =>
      api.put<Pick<IUser, "defaultTone" | "customToneInstructions">>("/users/brand-voice", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: [ANALYTICS_KEY],
    queryFn: () => api.get("/users/analytics").then((r) => r.data),
  });
}
