import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Video, Star, Loader2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    features: [
      "Full curriculum access (Levels 1–3)",
      "Weekly mentorship content",
      "AI Baseball Mentor (unlimited)",
      "Progress tracking & analytics",
      "Announcement board",
    ],
    credits: null,
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
    credits: 4,
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
    features: [
      "Everything in Tier 2",
      "8 video feedback submissions/month",
      "Live session access",
      "Recruiting blueprint resources",
      "Direct coach messaging",
    ],
    credits: 8,
  },
];

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    try {
      setLoadingTier(tier);
      const res = await apiRequest("POST", "/api/subscriptions/checkout", { tier });
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-white mb-3">
            Choose Your Level
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select the tier that matches your commitment. All plans include the full curriculum and AI mentorship.
          </p>
        </div>

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
                  className={`relative flex flex-col h-full ${tier.popular ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
                    </div>
                  )}

                  <div className={`inline-flex p-3 rounded-xl ${tier.bgColor} w-fit mb-4`}>
                    <Icon className={`w-6 h-6 ${tier.color}`} />
                  </div>

                  <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-1">
                    {tier.name}
                  </h2>

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
                    disabled={loadingTier === tier.id}
                    data-testid={`button-subscribe-${tier.id}`}
                  >
                    {loadingTier === tier.id ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      `Get ${tier.name}`
                    )}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Recurring billing. Cancel anytime. Parental consent may be required for minors.
        </p>
      </motion.div>
    </div>
  );
}
