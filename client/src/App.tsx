import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Onboarding from "@/pages/Onboarding";
import PendingApproval from "@/pages/PendingApproval";
import Subscribe from "@/pages/Subscribe";
import Dashboard from "@/pages/athlete/Dashboard";
import GetStarted from "@/pages/athlete/GetStarted";
import Modules from "@/pages/athlete/Modules";
import VideoSubmissions from "@/pages/athlete/VideoSubmissions";
import AdminPortal from "@/pages/AdminPortal";
import ParentPortal from "@/pages/ParentPortal";
import Settings from "@/pages/Settings";
import { AppLayout } from "@/components/layout/AppLayout";

// ─── Subscription gate for athletes ──────────────────────────────────────────
// Active athletes must have an active Stripe subscription before accessing
// the full dashboard. If they don't, redirect them to the Subscribe page.
function AthleteSubscriptionGate() {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasActiveSub = subscription?.status === "active" && subscription?.tier && subscription.tier !== "none";

  return (
    <AppLayout>
      <Switch>
        {hasActiveSub ? (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/get-started" component={GetStarted} />
            <Route path="/modules" component={Modules} />
            <Route path="/videos" component={VideoSubmissions} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/settings" component={Settings} />
          </>
        ) : (
          <>
            <Route path="/" component={Subscribe} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/settings" component={Settings} />
          </>
        )}
      </Switch>
    </AppLayout>
  );
}

function ProtectedRouter() {
  const { user } = useAuth();

  // New users get role="athlete" by default before completing onboarding.
  // Use dateOfBirth absence (for athletes) or role still being the default (not parent/admin)
  // as the signal that onboarding hasn't been completed yet.
  const needsOnboarding =
    user.role !== "admin" && user.role !== "parent" && !user.dateOfBirth;

  if (needsOnboarding) {
    return <Onboarding />;
  }

  if (user.role === "athlete" && user.approvalStatus === "pending") {
    return <PendingApproval />;
  }

  if (user.role === "athlete" && user.approvalStatus === "suspended") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Account Suspended</h1>
          <p className="text-muted-foreground">Your account has been suspended. Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  // Approved athletes go through the subscription gate before the full dashboard
  if (user.role === "athlete" && user.approvalStatus === "active") {
    return <AthleteSubscriptionGate />;
  }

  return (
    <AppLayout>
      <Switch>
        {/* Athlete fallback (shouldn't reach here normally) */}
        {user.role === "athlete" && (
          <>
            <Route path="/" component={Subscribe} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/settings" component={Settings} />
          </>
        )}

        {user.role === "parent" && (
          <>
            <Route path="/" component={ParentPortal} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/settings" component={Settings} />
          </>
        )}

        {user.role === "admin" && (
          <>
            <Route path="/" component={AdminPortal} />
            <Route path="/videos" component={AdminPortal} />
            <Route path="/modules" component={AdminPortal} />
            <Route path="/settings" component={Settings} />
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
