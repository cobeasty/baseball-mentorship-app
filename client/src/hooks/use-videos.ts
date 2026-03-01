import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateVideoRequest, type CreateFeedbackRequest } from "@shared/schema";

export function useVideos() {
  return useQuery({
    queryKey: [api.videos.list.path],
    queryFn: async () => {
      const res = await fetch(api.videos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return api.videos.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVideoRequest) => {
      const res = await fetch(api.videos.create.path, {
        method: api.videos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Failed to submit video" }));
        throw new Error(errData.message || "Failed to submit video");
      }
      return api.videos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.videos.list.path] }),
  });
}

export function useUpdateVideoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.videos.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.videos.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Failed to update status" }));
        throw new Error(errData.message || "Failed to update status");
      }
      return api.videos.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.videos.list.path] }),
  });
}

export function useVideoFeedback(videoId: number | null) {
  return useQuery({
    queryKey: [api.feedback.list.path, videoId],
    queryFn: async () => {
      if (!videoId) return [];
      const url = buildUrl(api.feedback.list.path, { videoId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feedback");
      return api.feedback.list.responses[200].parse(await res.json());
    },
    enabled: !!videoId,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFeedbackRequest) => {
      const res = await fetch(api.feedback.create.path, {
        method: api.feedback.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Failed to create feedback" }));
        throw new Error(errData.message || "Failed to create feedback");
      }
      return api.feedback.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.feedback.list.path, variables.videoId] });
      queryClient.invalidateQueries({ queryKey: [api.videos.list.path] });
    },
  });
}
