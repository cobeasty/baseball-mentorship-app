import React from "react";
import { Card, Badge, Button } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { ShieldCheck, Activity, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function ParentPortal() {
  const { user } = useAuth();
  
  // In a full implementation, we'd fetch the specific connected athlete's data.
  // For MVP, we show a clean placeholder/summary demonstrating the capability.

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Parent Portal</h1>
        <p className="text-muted-foreground mt-1">Monitor progress and manage account settings for your athlete.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">Athlete Status</h2>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Connected Athlete</p>
                <p className="text-lg font-bold text-white mt-1">Pending Connection</p>
              </div>
              <Badge variant="warning">Awaiting Setup</Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your athlete needs to complete their onboarding using your email address ({user?.email}). Once they do, their training progress, video reviews, and metrics will appear here.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">Billing & Access</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-white/10 rounded-lg">
              <div>
                <p className="font-bold text-white">Current Plan</p>
                <p className="text-sm text-muted-foreground">Free Tier</p>
              </div>
              <Link href="/settings">
                <Button size="sm" variant="outline">Manage</Button>
              </Link>
            </div>

            <div className="flex justify-between items-center p-4 border border-white/10 rounded-lg bg-primary/5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-white">Legal Agreements</p>
                  <p className="text-sm text-muted-foreground">All signed</p>
                </div>
              </div>
              <Badge variant="success">Compliant</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
