import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type CreateModuleRequest } from "@shared/schema";

export function useModules() {
  return useQuery({
    queryKey: [api.modules.list.path],
    queryFn: async () => {
      const res = await fetch(api.modules.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modules");
      return api.modules.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateModuleRequest) => {
      const res = await fetch(api.modules.create.path, {
        method: api.modules.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create module");
      return api.modules.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.modules.list.path] }),
  });
}

export function useUserProgress() {
  return useQuery({
    queryKey: [api.progress.list.path],
    queryFn: async () => {
      const res = await fetch(api.progress.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return api.progress.list.responses[200].parse(await res.json());
    },
  });
}

export function useCompleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await fetch(api.progress.complete.path, {
        method: api.progress.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete module");
      return api.progress.complete.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.progress.list.path] }),
  });
}
