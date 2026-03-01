import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription, useCreatePortalSession, useCancelSubscription } from "@/hooks/use-subscription";
import { Zap, Video, Star, CheckCircle, CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TIER_LABELS: Record<string, { name: string; price: string; color: string }> = {
  none: { name: "No Subscription", price: "Free", color: "text-muted-foreground" },
  tier1: { name: "Mentorship", price: "$29/mo", color: "text-blue-400" },
  tier2: { name: "Mentorship + Video", price: "$59/mo", color: "text-primary" },
  tier3: { name: "Premium Elite", price: "$99/mo", color: "text-yellow-400" },
};

export default function Settings() {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const createPortal = useCreatePortalSession();
  const cancelSub = useCancelSubscription();
  const { toast } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const tier = user?.tier || "none";
  const tierInfo = TIER_LABELS[tier];

  const handleManageBilling = async () => {
    try {
      const res = await createPortal.mutateAsync({});
      if (res.url) window.location.href = res.url;
    } catch (err: any) {
      toast({
        title: "Billing Portal",
        description: err.message || "Stripe billing portal is not configured yet.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSub.mutateAsync();
      toast({ title: "Subscription scheduled for cancellation", description: "Your access continues until the end of the billing period." });
      setShowCancelConfirm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Subscription & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your membership tier and account settings.</p>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">Current Plan</h2>
            <p className={`text-2xl font-bold mt-1 ${tierInfo.color}`}>{tierInfo.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{tierInfo.price}</p>
          </div>
          <Badge variant={subscription?.status === "active" ? "success" : tier === "none" ? "default" : "warning"}>
            {subscription?.status || (tier === "none" ? "No plan" : "inactive")}
          </Badge>
        </div>

        {subscription && (subscription.videoCreditsLimit || 0) > 0 && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground mb-2">Video Credits This Month</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, ((subscription.videoCreditsUsed || 0) / (subscription.videoCreditsLimit || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white">
                {subscription.videoCreditsUsed}/{subscription.videoCreditsLimit}
              </span>
            </div>
          </div>
        )}

        {subscription?.currentPeriodEnd && (
          <p className="text-xs text-muted-foreground mb-4">
            {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {tier === "none" ? (
            <Link href="/subscribe">
              <Button data-testid="button-upgrade-plan">
                <Zap className="w-4 h-4 mr-2" /> Choose a Plan
              </Button>
            </Link>
          ) : (
            <>
              <Button variant="outline" onClick={handleManageBilling} disabled={createPortal.isPending} data-testid="button-manage-billing">
                {createPortal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Manage Billing
              </Button>
              <Link href="/subscribe">
                <Button variant="outline" data-testid="button-change-plan">Change Plan</Button>
              </Link>
              {subscription?.stripeSubscriptionId && !subscription?.cancelAtPeriodEnd && (
                <Button variant="ghost" onClick={() => setShowCancelConfirm(true)} data-testid="button-cancel-subscription">
                  Cancel Subscription
                </Button>
              )}
            </>
          )}
        </div>

        {showCancelConfirm && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-white">Cancel Subscription?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your access will continue until the end of the current billing period, then it will be cancelled.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button size="sm" onClick={handleCancel} disabled={cancelSub.isPending} className="bg-red-500 hover:bg-red-600 text-white" data-testid="button-confirm-cancel">
                    {cancelSub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Cancel"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCancelConfirm(false)}>Keep Subscription</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: "tier1", label: "Mentorship", price: "$29/mo", icon: Zap, color: "text-blue-400", features: ["Full curriculum", "AI Mentor", "Progress tracking"] },
          { id: "tier2", label: "Mentorship + Video", price: "$59/mo", icon: Video, color: "text-primary", features: ["Tier 1 features", "4 video credits/mo", "Coach feedback"] },
          { id: "tier3", label: "Premium Elite", price: "$99/mo", icon: Star, color: "text-yellow-400", features: ["Tier 2 features", "8 video credits/mo", "Live sessions"] },
        ].map(t => {
          const Icon = t.icon;
          const isCurrent = tier === t.id;
          return (
            <Card key={t.id} className={isCurrent ? "border-primary/50" : ""}>
              <Icon className={`w-6 h-6 ${t.color} mb-3`} />
              <h3 className="font-display font-bold uppercase tracking-wider text-white">{t.label}</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">{t.price}</p>
              <ul className="space-y-2 mb-4">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Badge variant="success" className="w-full justify-center py-1.5">Current Plan</Badge>
              ) : (
                <Link href="/subscribe">
                  <Button size="sm" variant="outline" className="w-full" data-testid={`button-select-${t.id}`}>
                    {tier !== "none" ? "Switch to this" : "Get Started"}
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-4">Account Info</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground text-sm">Name</span>
            <span className="text-white text-sm">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground text-sm">Email</span>
            <span className="text-white text-sm">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-muted-foreground text-sm">Role</span>
            <span className="text-white text-sm capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-sm">Account Status</span>
            <Badge variant={user?.approvalStatus === "active" ? "success" : "warning"}>
              {user?.approvalStatus}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
