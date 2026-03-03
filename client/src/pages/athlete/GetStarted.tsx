import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Video, Star, Loader2, ArrowRight, BookOpen, TrendingUp, MessageCircle, Trophy } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const STEPS = [
  {
    num: "01",
    icon: Zap,
    title: "Choose Your Plan",
    desc: "Pick the tier that matches your goals. All plans include the full curriculum and AI mentorship.",
  },
  {
    num: "02",
    icon: BookOpen,
    title: "Complete Your Modules",
    desc: "Work through Level 1 → 2 → 3. Each module unlocks new drills, mindset tools, and recruiting resources.",
  },
  {
    num: "03",
    icon: Video,
    title: "Submit Your Videos",
    desc: "Record your at-bats, fielding, or pitching. Upload for personalized coach feedback.",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Advance Your Career",
    desc: "Use your recruiting blueprint, highlight reel tips, and direct coach access to get noticed.",
  },
];

const TIERS = [
  {
    id: "tier1",
    name: "Mentorship",
    price: "$29",
    period: "/mo",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    popular: false,
    features: [
      "Full curriculum access (Levels 1–3)",
      "Weekly mentorship content",
      "AI Baseball Mentor (unlimited)",
      "Progress tracking & analytics",
      "Announcement board",
    ],
  },
  {
    id: "tier2",
    name: "Mentorship + Video",
    price: "$59",
    period: "/mo",
    icon: Video,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    popular: true,
    features: [
      "Everything in Tier 1",
      "4 video feedback submissions/month",
      "Written + video feedback from coaches",
      "Priority review queue",
    ],
  },
  {
    id: "tier3",
    name: "Premium Elite",
    price: "$99",
    period: "/mo",
    icon: Star,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    popular: false,
    features: [
      "Everything in Tier 2",
      "8 video feedback submissions/month",
      "Live session access",
      "Recruiting blueprint resources",
      "Direct coach messaging",
    ],
  },
];

export default function GetStarted() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    try {
      setLoadingTier(tierId);
      const res = await apiRequest("POST", "/api/subscriptions/checkout", { tier: tierId });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.message || "Failed to start checkout", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoadingTier(null);
    }
  };

  const firstName = user?.firstName || "Athlete";
  const hasSubscription = user?.tier && user.tier !== "none";

  return (
    <div className="space-y-16 pb-16">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-sm font-display uppercase tracking-widest mb-6">
          <Trophy className="w-4 h-4" />
          You're In — Let's Get to Work
        </div>
        <h1 className="text-5xl font-display font-bold uppercase tracking-tight text-white leading-tight mb-4">
          Welcome, <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          You've been approved. Now pick a plan, start your training, and let's build the athlete you're meant to be.
        </p>
        {hasSubscription && (
          <div className="mt-6">
            <Link href="/">
              <Button variant="outline">
                Go to My Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── How it works ───────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-white text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                data-testid={`step-card-${step.num}`}
              >
                <Card className="h-full flex flex-col gap-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-display font-bold text-white/10">{step.num}</span>
                  </div>
                  <h3 className="font-display font-bold text-white uppercase tracking-wider text-sm">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Pricing tiers ──────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-white text-center mb-3">
          Choose Your Plan
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          All plans include the full curriculum and unlimited AI mentorship.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`relative flex flex-col h-full ${
                    tier.popular ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                  }`}
                  data-testid={`tier-card-${tier.id}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                    </div>
                  )}

                  <div className={`inline-flex p-3 rounded-xl ${tier.bgColor} w-fit mb-4`}>
                    <Icon className={`w-6 h-6 ${tier.color}`} />
                  </div>

                  <h3 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-1">
                    {tier.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={!!loadingTier}
                    data-testid={`button-subscribe-${tier.id}`}
                  >
                    {loadingTier === tier.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      `Get ${tier.name}`
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Recurring billing. Cancel anytime. Parental consent may be required for minors.
        </p>
      </div>

      {/* ── FAQ teaser ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { q: "Can I change my plan later?", a: "Yes — upgrade or downgrade from your settings at any time." },
          { q: "What if I'm under 18?", a: "Parental consent is required and your parent will receive a verification email." },
          { q: "Is there a refund policy?", a: "Plans are billed monthly. Contact support within 48 hours of billing for assistance." },
        ].map((item) => (
          <Card key={item.q} className="flex gap-3" data-testid={`faq-card-${item.q.slice(0, 10)}`}>
            <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-white text-sm mb-1">{item.q}</p>
              <p className="text-xs text-muted-foreground">{item.a}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
