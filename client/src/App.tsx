import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/athlete/Dashboard";
import Modules from "@/pages/athlete/Modules";
import VideoSubmissions from "@/pages/athlete/VideoSubmissions";
import AdminPortal from "@/pages/AdminPortal";
import ParentPortal from "@/pages/ParentPortal";
import Settings from "@/pages/Settings";
import { AppLayout } from "@/components/layout/AppLayout";

function ProtectedRouter() {
  const { user } = useAuth();
  
  if (!user?.role) {
    return <Onboarding />;
  }

  return (
    <AppLayout>
      <Switch>
        {user.role === "athlete" && (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/modules" component={Modules} />
            <Route path="/videos" component={VideoSubmissions} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        
        {user.role === "parent" && (
          <>
            <Route path="/" component={ParentPortal} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        
        {user.role === "admin" && (
          <>
            <Route path="/" component={AdminPortal} />
            <Route path="/videos" component={AdminPortal} />
            <Route path="/modules" component={AdminPortal} /> {/* Simplified for MVP */}
          </>
        )}

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function MainApp() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <ProtectedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
