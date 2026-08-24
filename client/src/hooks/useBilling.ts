import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Plan {
  name: "free" | "starter" | "pro" | "enterprise";
  price: number;
  limit: number;
  features: string[];
  stripePriceId?: string;
}

export interface BillingStatus {
  plan: Plan["name"];
  monthlyGenerations: number;
  generationLimit: number;
  usageResetDate: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "past_due" | "canceled" | "trialing";
}

const PLANS_KEY = "plans";
const BILLING_KEY = "billing";

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: [PLANS_KEY],
    queryFn: () => api.get("/billing/plans").then((r) => r.data),
    staleTime: 1000 * 60 * 60, // 1 hour — plan list rarely changes
  });
}

export function useBillingStatus() {
  return useQuery<BillingStatus>({
    queryKey: [BILLING_KEY],
    queryFn: () => api.get("/billing/usage").then((r) => r.data),
  });
}

export function useUsage() {
  return useBillingStatus();
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (priceId: string) =>
      api
        .post<{ url: string }>("/billing/subscribe", { priceId })
        .then((r) => r.data),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}

export function useManageBilling() {
  return useMutation({
    mutationFn: () =>
      api.post<{ url: string }>("/billing/portal").then((r) => r.data),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}

export function usePortalSession() {
  return useManageBilling();
}
