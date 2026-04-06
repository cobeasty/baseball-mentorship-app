import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Target, Trophy, ArrowRight, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, setToken, queryClient } from "@/lib/queryClient";

type AuthMode = "signup" | "login";

function AuthModal({ mode, onClose }: { mode: AuthMode; onClose: () => void }) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = currentMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        currentMode === "signup"
          ? { email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName }
          : { email: form.email, password: form.password };

      const res = await apiRequest("POST", endpoint, body);
      const { token, user } = await res.json();
      setToken(token);
      queryClient.setQueryData(["/api/auth/user"], user);
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      toast({ title: currentMode === "signup" ? "Sign up failed" : "Login failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors text-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-display font-bold uppercase tracking-widest text-white mb-1">
            <span className="w-7 h-7 bg-primary text-black flex items-center justify-center rounded text-sm">M</span>
            Mentorship
          </div>
          <h2 className="text-2xl font-display font-bold text-white">
            {currentMode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {currentMode === "signup"
              ? "Join the platform and start training."
              : "Sign in to continue to your dashboard."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMode === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                data-testid="input-first-name"
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={set("firstName")}
                required
                className={inputCls}
              />
              <input
                data-testid="input-last-name"
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={set("lastName")}
                required
                className={inputCls}
              />
            </div>
          )}

          <input
            data-testid="input-email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={set("email")}
            required
            className={inputCls}
          />

          <div className="relative">
            <input
              data-testid="input-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={currentMode === "signup" ? 8 : 1}
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {currentMode === "signup" && (
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
            data-testid="button-auth-submit"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentMode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          {currentMode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setCurrentMode("login")}
                className="text-primary hover:underline font-medium"
                data-testid="link-switch-to-login"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setCurrentMode("signup")}
                className="text-primary hover:underline font-medium"
                data-testid="link-switch-to-signup"
              >
                Create one
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-black">
      <AnimatePresence>
        {authModal && (
          <AuthModal mode={authModal} onClose={() => setAuthModal(null)} />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-display font-bold uppercase tracking-widest text-white">
            <span className="w-8 h-8 bg-primary text-black flex items-center justify-center rounded">M</span>
            Mentorship
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setAuthModal("login")}
              data-testid="button-nav-signin"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setAuthModal("signup")}
              data-testid="button-nav-signup"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-display font-bold uppercase tracking-tight text-white leading-[1.1] mb-6">
              Train your mind. <br />
              <span className="text-primary text-glow">Elevate your game.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Exclusive mentorship from professional baseball players. Master the foundations, develop a competitive mindset, and get the blueprint to get recruited.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => setAuthModal("signup")}
                className="group"
                data-testid="button-hero-cta"
              >
                Start Training <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setAuthModal("login")}
                data-testid="button-hero-signin"
              >
                Sign In
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm font-display tracking-widest text-muted-foreground uppercase">
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Pro Insights</div>
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Elite Mindset</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=1000&fit=crop"
                alt="Baseball player"
                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Floating badge */}
            <div
              className="absolute bottom-10 -left-10 bg-card/90 backdrop-blur p-4 rounded-xl border border-white/10 shadow-2xl z-20 animate-bounce"
              style={{ animationDuration: "3s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-white uppercase tracking-wider">Level 3 Unlocked</p>
                  <p className="text-xs text-muted-foreground">Recruiting Blueprint</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
