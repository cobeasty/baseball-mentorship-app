import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { useCreateAgreement } from "@/hooks/use-agreements";
import { UserIcon, Users } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const createAgreement = useCreateAgreement();

  const [role, setRole] = useState<"athlete" | "parent" | null>(null);
  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [agreements, setAgreements] = useState({ tos: false, privacy: false, liability: false });
  const [error, setError] = useState("");

  const isMinor = () => {
    if (!dob) return false;
    const age = (new Date().getTime() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  };

  const handleComplete = async () => {
    try {
      setError("");
      if (!role) return setError("Please select a role.");
      if (!agreements.tos || !agreements.privacy || !agreements.liability) {
        return setError("You must accept all agreements to continue.");
      }
      
      if (role === "athlete") {
        if (!dob) return setError("Date of birth is required for athletes.");
        if (isMinor() && !parentEmail) return setError("Parent email is required for minors.");
      }

      // Record agreements
      await Promise.all([
        createAgreement.mutateAsync("tos"),
        createAgreement.mutateAsync("privacy"),
        createAgreement.mutateAsync("liability"),
      ]);

      // Update user profile
      await updateUser.mutateAsync({
        id: user!.id,
        role,
        dateOfBirth: dob ? new Date(dob).toISOString() : undefined,
        parentEmail: isMinor() ? parentEmail : undefined,
        approvalStatus: isMinor() ? "pending" : "active",
      });

    } catch (err) {
      setError("An error occurred during onboarding. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-white mb-2">Welcome to the Elite</h1>
          <p className="text-muted-foreground">Complete your profile to unlock access.</p>
        </div>

        <Card className="p-8">
          {!role ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Label className="text-center mb-6 text-lg">Who are you?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button 
                  onClick={() => setRole("athlete")}
                  className="flex flex-col items-center p-8 border-2 border-white/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">Athlete</h3>
                  <p className="text-sm text-muted-foreground mt-2 text-center">I am here to train and improve my game.</p>
                </button>
                <button 
                  onClick={() => setRole("parent")}
                  className="flex flex-col items-center p-8 border-2 border-white/10 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">Parent</h3>
                  <p className="text-sm text-muted-foreground mt-2 text-center">I am setting up an account for my athlete.</p>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setRole(null)} className="text-sm text-muted-foreground hover:text-white uppercase font-display tracking-widest">
                  ← Back
                </button>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-primary">
                  {role === "athlete" ? "Athlete Setup" : "Parent Setup"}
                </h2>
              </div>

              {role === "athlete" && (
                <>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                  </div>
                  {isMinor() && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <Label className="mt-4">Parent Email (Required for athletes under 18)</Label>
                      <Input type="email" placeholder="parent@example.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-2">Your parent will need to approve your account before full access is granted.</p>
                    </motion.div>
                  )}
                </>
              )}

              <div className="space-y-4 pt-4 border-t border-white/10">
                <Label>Legal Agreements</Label>
                {[
                  { key: 'tos', label: 'I agree to the Terms of Service' },
                  { key: 'privacy', label: 'I agree to the Privacy Policy' },
                  { key: 'liability', label: 'I accept the Liability Waiver' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreements[key as keyof typeof agreements] ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                      {agreements[key as keyof typeof agreements] && <div className="w-2.5 h-2.5 bg-black rounded-sm" />}
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">{label}</span>
                    <input type="checkbox" className="hidden" checked={agreements[key as keyof typeof agreements]} onChange={(e) => setAgreements(p => ({ ...p, [key]: e.target.checked }))} />
                  </label>
                ))}
              </div>

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <Button 
                className="w-full mt-8" 
                size="lg" 
                onClick={handleComplete}
                isLoading={updateUser.isPending || createAgreement.isPending}
              >
                Complete Setup
              </Button>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
