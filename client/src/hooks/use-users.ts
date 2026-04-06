import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type User } from "@shared/models/auth";
import { authFetch } from "@/lib/queryClient";

export function useUsersList() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await authFetch(api.users.list.path);
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<User>) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await authFetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}
