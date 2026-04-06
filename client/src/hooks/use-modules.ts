import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type CreateModuleRequest } from "@shared/schema";
import { authFetch } from "@/lib/queryClient";

export function useModules() {
  return useQuery({
    queryKey: [api.modules.list.path],
    queryFn: async () => {
      const res = await authFetch(api.modules.list.path);
      if (!res.ok) throw new Error("Failed to fetch modules");
      return api.modules.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateModuleRequest) => {
      const res = await authFetch(api.modules.create.path, {
        method: api.modules.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create module");
      return api.modules.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.modules.list.path] }),
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<import("@shared/schema").CreateModuleRequest> }) => {
      const res = await authFetch(`/api/modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update module");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.modules.list.path] }),
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/modules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete module");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.modules.list.path] }),
  });
}

export function useUserProgress() {
  return useQuery({
    queryKey: [api.progress.list.path],
    queryFn: async () => {
      const res = await authFetch(api.progress.list.path);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return api.progress.list.responses[200].parse(await res.json());
    },
  });
}

export function useCompleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await authFetch(api.progress.complete.path, {
        method: api.progress.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (!res.ok) throw new Error("Failed to complete module");
      return api.progress.complete.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.progress.list.path] }),
  });
}
