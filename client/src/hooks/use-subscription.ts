import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Subscription } from "@shared/schema";

export function useSubscription() {
  return useQuery<Subscription | null>({
    queryKey: ["/api/subscriptions/me"],
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (tier: string) => {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create checkout");
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: async (_: {}) => {
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create portal session");
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel subscription");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/me"] }),
  });
}
