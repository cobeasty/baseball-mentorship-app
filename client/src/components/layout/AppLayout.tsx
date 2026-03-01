import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, PlaySquare, Video, Settings, LogOut, Users, ShieldAlert, Activity, BarChart3, Megaphone, BookOpen, CreditCard, Zap } from "lucide-react";
import { cn } from "@/components/ui";

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  none: { label: "No Plan", color: "bg-white/10 text-muted-foreground border-white/10" },
  tier1: { label: "Tier 1", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  tier2: { label: "Tier 2", color: "bg-primary/20 text-primary border-primary/30" },
  tier3: { label: "Elite", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { name: "Dashboard", path: "/", icon: BarChart3 },
        { name: "Video Queue", path: "/videos", icon: ShieldAlert },
        { name: "Content", path: "/modules", icon: BookOpen },
        { name: "Settings", path: "/settings", icon: Settings },
      ];
    }
    if (user?.role === "parent") {
      return [
        { name: "Athlete Progress", path: "/", icon: Activity },
        { name: "Settings", path: "/settings", icon: Settings },
      ];
    }
    return [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Training Modules", path: "/modules", icon: PlaySquare },
      { name: "Video Analysis", path: "/videos", icon: Video },
      { name: "Settings", path: "/settings", icon: Settings },
    ];
  };

  const navItems = getNavItems();
  const tier = user?.tier || "none";
  const tierBadge = TIER_BADGE[tier];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r border-white/5 flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-display font-bold uppercase tracking-widest text-white hover:text-primary transition-colors">
            <span className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">M</span>
            Mentorship
          </Link>
        </div>

        <div className="px-4 pb-6 flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          {user?.role === "athlete" && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest px-4 mb-2">Membership</p>
              <div className={`mx-2 px-3 py-2 rounded-lg border text-xs font-display font-bold uppercase tracking-wider flex items-center justify-between ${tierBadge.color}`}>
                <span>{tierBadge.label}</span>
                {tier === "none" && (
                  <Link href="/subscribe">
                    <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors" data-testid="button-sidebar-upgrade">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs">Upgrade</span>
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold border border-white/10 overflow-hidden shrink-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.firstName || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize font-display tracking-wider">{user?.role || "Athlete"}</p>
            </div>
            <button onClick={() => logout()} className="text-muted-foreground hover:text-destructive transition-colors" data-testid="button-logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center px-8 border-b border-white/5 bg-background/50 backdrop-blur">
          <h2 className="font-display font-bold uppercase tracking-wide text-lg text-white">
            {navItems.find((i) => i.path === location)?.name || "Mentorship Platform"}
          </h2>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
