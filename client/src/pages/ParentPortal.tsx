import { useState } from "react";
import { Card, Badge, Button } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useSubscription, useCreatePortalSession } from "@/hooks/use-subscription";
import {
  ShieldCheck, Activity, CreditCard, Video, FileText,
  Download, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { User, Video as VideoType, VideoFeedback, Agreement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function AthleteProgressCard({ athlete }: { athlete: User }) {
  const { data: progress } = useQuery<any[]>({ queryKey: ["/api/progress", athlete.id] });
  const { data: modules } = useQuery<any[]>({ queryKey: ["/api/modules"] });

  const total = modules?.length || 0;
  const completed = progress?.length || 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold uppercase tracking-wider text-white">Training Progress</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>{completed} of {total} modules completed</span>
          <span className="text-primary font-bold">{percent}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[1, 2, 3].map(level => {
            const levelModules = modules?.filter((m: any) => m.level === level) || [];
            const levelCompleted = progress?.filter((p: any) =>
              levelModules.some((m: any) => m.id === p.moduleId)
            )?.length || 0;
            return (
              <div key={level} className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm font-bold text-white">{levelCompleted}/{levelModules.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {["Foundations", "Mindset", "Recruiting"][level - 1]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function AthleteVideosCard({ athlete }: { athlete: User }) {
  const { data: videos } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const athleteVideos = videos?.filter(v => v.athleteId === athlete.id) || [];
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? athleteVideos : athleteVideos.slice(0, 3);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Video className="w-5 h-5 text-purple-400" />
        <h3 className="font-display font-bold uppercase tracking-wider text-white">Video Submissions</h3>
        <Badge variant="default" className="ml-auto">{athleteVideos.length}</Badge>
      </div>
      <div className="space-y-3">
        {shown.map(v => (
          <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10" data-testid={`card-video-${v.id}`}>
            <div>
              <p className="font-medium text-white text-sm">{v.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(v.submittedAt!).toLocaleDateString()}</p>
            </div>
            <Badge variant={v.status === "completed" ? "success" : "warning"}>{v.status}</Badge>
          </div>
        ))}
        {!athleteVideos.length && <p className="text-sm text-muted-foreground">No videos submitted yet.</p>}
        {athleteVideos.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-1">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show {athleteVideos.length - 3} more</>}
          </button>
        )}
      </div>
    </Card>
  );
}

function AgreementsCard({ userId }: { userId: string }) {
  const { data: agreements } = useQuery<Agreement[]>({ queryKey: [`/api/users/${userId}/agreements`] });

  const agreementLabels: Record<string, string> = {
    tos: "Terms of Service",
    privacy: "Privacy Policy",
    liability: "Liability Waiver",
    consent: "Parental Consent",
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-green-400" />
        <h3 className="font-display font-bold uppercase tracking-wider text-white">Legal Agreements</h3>
      </div>
      <div className="space-y-3">
        {agreements?.map(a => (
          <div key={a.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="font-medium text-white text-sm">{agreementLabels[a.agreementType] || a.agreementType}</p>
              <p className="text-xs text-muted-foreground">Signed {new Date(a.acceptedAt!).toLocaleDateString()}</p>
            </div>
            <Badge variant="success">Signed</Badge>
          </div>
        ))}
        {!agreements?.length && <p className="text-sm text-muted-foreground">No agreements on file.</p>}
      </div>
    </Card>
  );
}

function BillingCard() {
  const { data: subscription } = useSubscription();
  const createPortal = useCreatePortalSession();
  const { toast } = useToast();

  const handleManageBilling = async () => {
    try {
      const res = await createPortal.mutateAsync({});
      if (res.url) window.location.href = res.url;
    } catch (err: any) {
      toast({ title: "Billing portal unavailable", description: "Stripe is not yet configured.", variant: "destructive" });
    }
  };

  const tierLabels: Record<string, string> = {
    none: "No Subscription",
    tier1: "Mentorship ($29/mo)",
    tier2: "Mentorship + Video ($59/mo)",
    tier3: "Premium Elite ($99/mo)",
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-5 h-5 text-blue-400" />
        <h3 className="font-display font-bold uppercase tracking-wider text-white">Billing & Plan</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Current Plan</p>
              <p className="font-bold text-white mt-1">{tierLabels[subscription?.tier || "none"]}</p>
              {subscription?.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-xs text-yellow-400 mt-1">Cancels at period end</p>
              )}
            </div>
            <Badge variant={subscription?.status === "active" ? "success" : "warning"}>
              {subscription?.status || "inactive"}
            </Badge>
          </div>
        </div>
        {(subscription?.videoCreditsLimit || 0) > 0 && (
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-muted-foreground">Video Credits</p>
            <p className="font-bold text-white mt-1">
              {subscription!.videoCreditsUsed}/{subscription!.videoCreditsLimit} used
            </p>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleManageBilling}
          disabled={createPortal.isPending}
          data-testid="button-manage-billing"
        >
          {createPortal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
          Manage Billing
        </Button>
      </div>
    </Card>
  );
}

export default function ParentPortal() {
  const { user } = useAuth();
  const { data: allUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const linkedAthletes = allUsers?.filter(u => u.role === "athlete" && u.parentEmail === user?.email) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Parent Portal</h1>
        <p className="text-muted-foreground mt-1">Monitor your athlete's progress and manage account settings.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {linkedAthletes.length === 0 ? (
            <Card className="border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                <h3 className="font-display font-bold uppercase tracking-wider text-white">No Linked Athletes</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                No athletes have registered with your email address ({user?.email}) as their parent email. When your athlete completes onboarding using this email, their progress will appear here.
              </p>
            </Card>
          ) : (
            linkedAthletes.map(athlete => (
              <div key={athlete.id} className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Linked Athlete</p>
                    <p className="text-xl font-display font-bold text-white mt-1">
                      {athlete.firstName} {athlete.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <Badge variant={athlete.approvalStatus === "active" ? "success" : "warning"}>
                    {athlete.approvalStatus}
                  </Badge>
                </div>

                <AthleteProgressCard athlete={athlete} />
                <AthleteVideosCard athlete={athlete} />
                <AgreementsCard userId={athlete.id} />
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <BillingCard />
          <Card className="border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <h3 className="font-display font-bold uppercase tracking-wider text-white">Your Agreements</h3>
            </div>
            <AgreementsCard userId={user?.id || ""} />
          </Card>
        </div>
      </div>
    </div>
  );
}
