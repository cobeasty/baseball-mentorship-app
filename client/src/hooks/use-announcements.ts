import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Announcement, type CreateAnnouncementRequest } from "@shared/schema";
import { authFetch } from "@/lib/queryClient";

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateAnnouncementRequest>) => {
      const res = await authFetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return res.json() as Promise<Announcement>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete announcement");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/announcements"] }),
  });
}
