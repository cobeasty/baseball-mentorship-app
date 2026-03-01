import React from "react";
import { Card, Badge, Button } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { ShieldCheck, Activity, CreditCard } from "lucide-react";
import { Link } from "wouter";

import { BaseballAI } from "@/components/BaseballAI";

export default function ParentPortal() {
  const { user } = useAuth();
  
  return (
    &lt;div className="space-y-8"&gt;
      &lt;div&gt;
        &lt;h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white"&gt;Parent Portal&lt;/h1&gt;
        &lt;p className="text-muted-foreground mt-1"&gt;Monitor progress and manage account settings for your athlete.&lt;/p&gt;
      &lt;/div&gt;

      &lt;div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"&gt;
        &lt;div className="lg:col-span-2 space-y-8"&gt;
          &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-8"&gt;
            &lt;Card className="border-primary/20"&gt;
              &lt;div className="flex items-center gap-3 mb-6"&gt;
                &lt;Activity className="w-6 h-6 text-primary" /&gt;
                &lt;h2 className="text-xl font-display font-bold uppercase tracking-wider text-white"&gt;Athlete Status&lt;/h2&gt;
              &lt;/div&gt;
              
              &lt;div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4"&gt;
                &lt;div className="flex justify-between items-center"&gt;
                  &lt;div&gt;
                    &lt;p className="text-sm text-muted-foreground"&gt;Connected Athlete&lt;/p&gt;
                    &lt;p className="text-lg font-bold text-white mt-1"&gt;Pending Connection&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;Badge variant="warning"&gt;Awaiting Setup&lt;/Badge&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              
              &lt;p className="text-sm text-muted-foreground leading-relaxed"&gt;
                Your athlete needs to complete their onboarding using your email address ({user?.email}). Once they do, their training progress, video reviews, and metrics will appear here.
              &lt;/p&gt;
            &lt;/Card&gt;

            &lt;Card&gt;
              &lt;div className="flex items-center gap-3 mb-6"&gt;
                &lt;CreditCard className="w-6 h-6 text-blue-400" /&gt;
                &lt;h2 className="text-xl font-display font-bold uppercase tracking-wider text-white"&gt;Billing & Access&lt;/h2&gt;
              &lt;/div&gt;
              
              &lt;div className="space-y-4"&gt;
                &lt;div className="flex justify-between items-center p-4 border border-white/10 rounded-lg"&gt;
                  &lt;div&gt;
                    &lt;p className="font-bold text-white"&gt;Current Plan&lt;/p&gt;
                    &lt;p className="text-sm text-muted-foreground"&gt;Free Tier&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;Link href="/settings"&gt;
                    &lt;Button size="sm" variant="outline"&gt;Manage&lt;/Button&gt;
                  &lt;/Link&gt;
                &lt;/div&gt;

                &lt;div className="flex justify-between items-center p-4 border border-white/10 rounded-lg bg-primary/5"&gt;
                  &lt;div className="flex items-center gap-3"&gt;
                    &lt;ShieldCheck className="w-5 h-5 text-primary" /&gt;
                    &lt;div&gt;
                      &lt;p className="font-bold text-white"&gt;Legal Agreements&lt;/p&gt;
                      &lt;p className="text-sm text-muted-foreground"&gt;All signed&lt;/p&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                  &lt;Badge variant="success"&gt;Compliant&lt;/Badge&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            &lt;/Card&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;div className="lg:sticky lg:top-8"&gt;
          &lt;BaseballAI /&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
