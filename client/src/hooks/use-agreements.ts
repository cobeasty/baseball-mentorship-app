import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useCreateAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agreementType: string) => {
      const res = await fetch(api.agreements.create.path, {
        method: api.agreements.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementType }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record agreement");
      return api.agreements.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
