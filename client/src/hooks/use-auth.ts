import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { getToken, clearToken } from "@/lib/queryClient";

async function fetchUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  const response = await fetch("/api/auth/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    clearToken();
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  function logout() {
    clearToken();
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.clear();
    window.location.href = "/";
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: false,
  };
}
