import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, Target, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-black">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-display font-bold uppercase tracking-widest text-white">
            <span className="w-8 h-8 bg-primary text-black flex items-center justify-center rounded">M</span>
            Mentorship
          </div>
          <Button onClick={handleLogin} variant="outline" className="border-primary/50">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-display font-bold uppercase tracking-tight text-white leading-[1.1] mb-6">
              Train your mind. <br/>
              <span className="text-primary text-glow">Elevate your game.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Exclusive mentorship from professional baseball players. Master the foundations, develop a competitive mindset, and get the blueprint to get recruited.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleLogin} className="group">
                Start Training <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="ghost">View the Curriculum</Button>
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
            {/* landing page hero elite baseball player swinging bat dark moody */}
            <div className="aspect-[4/5] rounded-2xl overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=1000&fit=crop" 
                alt="Baseball player" 
                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute bottom-10 -left-10 bg-card/90 backdrop-blur p-4 rounded-xl border border-white/10 shadow-2xl z-20 animate-bounce" style={{animationDuration: '3s'}}>
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
