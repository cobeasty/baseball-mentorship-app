import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, PlaySquare, Video, Settings, LogOut, Users, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@/components/ui";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { name: "Users", path: "/", icon: Users },
        { name: "Video Reviews", path: "/videos", icon: ShieldAlert },
        { name: "Modules", path: "/modules", icon: PlaySquare },
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

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-white/5 flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-display font-bold uppercase tracking-widest text-white hover:text-primary transition-colors">
            <span className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground">M</span>
            Mentorship
          </Link>
        </div>

        <div className="px-4 pb-6 flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
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
        </div>

        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold border border-white/10 overflow-hidden">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.firstName || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize font-display tracking-wider">{user?.role || "Athlete"}</p>
            </div>
            <button onClick={() => logout()} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center px-8 border-b border-white/5 bg-background/50 backdrop-blur">
          <h2 className="font-display font-bold uppercase tracking-wide text-lg text-white">
            {navItems.find((i) => i.path === location)?.name || "Mentorship Platform"}
          </h2>
          {user?.tier && user.tier !== "none" && (
            <div className="ml-auto flex items-center">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-display font-bold uppercase tracking-widest">
                PRO Member
              </span>
            </div>
          )}
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
