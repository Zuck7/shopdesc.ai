import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface IUser {
  _id: string;
  email: string;
  name: string;
  image?: string;
  brandName?: string;
  defaultTone: "professional" | "casual" | "luxury" | "playful" | "custom";
  customToneInstructions?: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  usageCount: number;
  usageResetAt: string;
}

export interface UpdateUserPayload {
  name?: string;
  brandName?: string;
  defaultTone?: IUser["defaultTone"];
  customToneInstructions?: string;
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

const USER_KEY = "user";
const ANALYTICS_KEY = "analytics";

export function useUser() {
  return useQuery<IUser>({
    queryKey: [USER_KEY],
    queryFn: () => api.get("/users/me").then((r) => r.data),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      api.put<IUser>("/users/me", payload).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData([USER_KEY], updated);
    },
  });
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: [ANALYTICS_KEY],
    queryFn: () => api.get("/users/analytics").then((r) => r.data),
  });
}
