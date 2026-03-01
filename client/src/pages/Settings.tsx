import React from "react";
import { Card, Button, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { Zap, Shield, CheckCircle } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();

  const handleUpgrade = async (tier: string) => {
    if (!user) return;
    await updateUser.mutateAsync({ id: user.id, tier });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Subscription & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your membership tier and access level.</p>
      </div>

      <Card className="border-white/10 bg-black/40">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Current Membership</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You are currently on the <strong className="text-white uppercase">{user?.tier || 'Free'}</strong> tier.
            </p>
          </div>
          <Badge variant={user?.tier === 'tier3' ? 'success' : 'default'} className="px-3 py-1">
            {user?.tier === 'tier3' ? 'Pro Member' : 'Standard'}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className={`relative overflow-hidden transition-all duration-300 ${user?.tier === 'tier2' ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : ''}`}>
          <div className="mb-6">
            <h3 className="text-2xl font-display font-bold uppercase text-white mb-2">Video Access</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-white">$49</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-3">
              {['Full Module Library', '1 Video Review / Month', 'Community Access'].map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button 
            className="w-full" 
            variant={user?.tier === 'tier2' ? 'outline' : 'default'}
            disabled={user?.tier === 'tier2'}
            onClick={() => handleUpgrade('tier2')}
            isLoading={updateUser.isPending}
          >
            {user?.tier === 'tier2' ? 'Current Plan' : 'Select Tier 2'}
          </Button>
        </Card>

        <Card className={`relative overflow-hidden transition-all duration-300 ${user?.tier === 'tier3' ? 'border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)]' : 'border-white/10'}`}>
          <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
            Recommended
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-display font-bold uppercase text-primary mb-2">Elite Mentorship</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-white">$149</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-3">
              {['Everything in Tier 2', 'Unlimited Video Reviews', 'Direct Messaging with Pros', 'Live Q&A Sessions'].map(feature => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" /> {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button 
            className="w-full bg-primary text-black hover:bg-primary/90" 
            disabled={user?.tier === 'tier3'}
            onClick={() => handleUpgrade('tier3')}
            isLoading={updateUser.isPending}
          >
            {user?.tier === 'tier3' ? 'Current Plan' : 'Select Elite Tier'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
