import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateVideoRequest, type CreateFeedbackRequest } from "@shared/schema";
import { authFetch } from "@/lib/queryClient";

export function useVideos() {
  return useQuery({
    queryKey: [api.videos.list.path],
    queryFn: async () => {
      const res = await authFetch(api.videos.list.path);
      if (!res.ok) throw new Error("Failed to fetch videos");
      return api.videos.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVideoRequest) => {
      const res = await authFetch(api.videos.create.path, {
        method: api.videos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      const res = await authFetch(url, {
        method: api.videos.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
      const res = await authFetch(url);
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
      const res = await authFetch(api.feedback.create.path, {
        method: api.feedback.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

// ─── S3 / Secure Video Storage ────────────────────────────────────────────────

/** Check whether the server has S3 configured. */
export function useS3Status() {
  return useQuery({
    queryKey: ["/api/videos/s3-status"],
    queryFn: async () => {
      const res = await authFetch("/api/videos/s3-status");
      if (!res.ok) return { configured: false };
      return res.json() as Promise<{ configured: boolean }>;
    },
    staleTime: 60_000,
  });
}

/**
 * Upload a video file directly to S3 via a presigned PUT URL.
 * Steps: 1) request presigned URL from server, 2) PUT to S3, 3) return storageKey.
 */
export function useS3VideoUpload() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ storageKey: string }> => {
      // Step 1: get presigned upload URL from server
      const res = await authFetch("/api/videos/presigned-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Failed to get upload URL");
      }
      const { uploadUrl, storageKey } = await res.json();

      // Step 2: PUT file directly to S3 (no auth header — the presigned URL handles auth)
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!s3Res.ok) {
        throw new Error("Failed to upload video to storage. Please try again.");
      }

      return { storageKey };
    },
  });
}

/**
 * Fetch a short-lived signed URL for viewing a private S3 video.
 * Should be refetched when the user wants to watch — don't cache for more than 50 min.
 */
export function useSignedVideoUrl(videoId: number | null) {
  return useQuery({
    queryKey: ["/api/videos", videoId, "signed-url"],
    queryFn: async () => {
      if (!videoId) return null;
      const res = await authFetch(`/api/videos/${videoId}/signed-url`);
      if (!res.ok) return null;
      return res.json() as Promise<{ viewUrl: string; expiresIn: number }>;
    },
    enabled: !!videoId,
    staleTime: 50 * 60 * 1000, // refetch after 50 min (URL expires at 60 min)
  });
}
