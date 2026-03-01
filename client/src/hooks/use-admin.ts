import { useQuery } from "@tanstack/react-query";

export interface AdminMetrics {
  totalUsers: number;
  activeAthletes: number;
  pendingApprovals: number;
  suspendedUsers: number;
  tierBreakdown: { none: number; tier1: number; tier2: number; tier3: number };
  totalVideos: number;
  pendingVideos: number;
  totalModules: number;
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
  });
}
