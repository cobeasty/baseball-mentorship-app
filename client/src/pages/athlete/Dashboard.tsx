import { useUserProgress, useModules } from "@/hooks/use-modules";
import { useVideos } from "@/hooks/use-videos";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useAuth } from "@/hooks/use-auth";
import { Badge, Button, Card } from "@/components/ui";
import { Trophy, Video, ArrowRight, Megaphone, Pin, BookOpen, TrendingUp, Star, Lock } from "lucide-react";
import { Link } from "wouter";
import { BaseballAI } from "@/components/BaseballAI";
import { motion } from "framer-motion";

const LEVELS = [
  { num: 1, name: "Foundations", desc: "Mechanics, fundamentals, and building your base.", minModules: 0 },
  { num: 2, name: "Competitive Mindset", desc: "Mental game, resilience, and competing at the next level.", minModules: 3 },
  { num: 3, name: "Recruiting Blueprint", desc: "Getting noticed, highlight reels, and college paths.", minModules: 6 },
];

function CircleProgress({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (percent / 100);

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: progress } = useUserProgress();
  const { data: modules } = useModules();
  const { data: videos } = useVideos();
  const { data: announcements } = useAnnouncements();

  const totalModules = modules?.length || 0;
  const completedIds = new Set(progress?.map((p) => p.moduleId) || []);
  const completedCount = completedIds.size;
  const percentComplete = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const currentLevel = completedCount < 3 ? 1 : completedCount < 6 ? 2 : 3;
  const currentLevelData = LEVELS[currentLevel - 1];

  const nextModule = modules?.find((m) => !completedIds.has(m.id));

  const firstName = user?.firstName || "Athlete";
  const tier = user?.tier || "none";
  const hasSubscription = tier !== "none";

  return (
    <div className="space-y-8">
      {/* ── Hero greeting ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-display mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-4xl font-display font-bold uppercase tracking-wide text-white">
            Welcome back, <span className="text-primary">{firstName}</span>
          </h1>
        </div>
        <Badge variant="success" className="px-4 py-2 text-sm self-start sm:self-auto">
          <Trophy className="w-4 h-4 mr-2 inline" />
          Level {currentLevel}: {currentLevelData.name}
        </Badge>
      </motion.div>

      {/* ── No-subscription CTA ───────────────────────────────── */}
      {!hasSubscription && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          data-testid="banner-no-subscription"
        >
          <div>
            <p className="font-display font-bold text-white uppercase tracking-wider">
              You're in — now unlock the curriculum
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a plan to access training modules, video feedback, and more.
            </p>
          </div>
          <Link href="/get-started">
            <Button data-testid="button-get-started">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ── Left / main column ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress + stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Circular progress */}
            <Card className="col-span-1 flex flex-col items-center justify-center py-6 gap-3">
              <div className="relative w-32 h-32">
                <CircleProgress percent={percentComplete} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display font-bold text-white">{percentComplete}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Complete</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-white text-sm">Overall Progress</p>
                <p className="text-xs text-muted-foreground">{completedCount} of {totalModules} modules</p>
              </div>
            </Card>

            {/* Stat: Videos submitted */}
            <Card className="flex flex-col justify-between" data-testid="stat-videos">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-bold text-white">Videos</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Submitted</p>
                </div>
              </div>
              <p className="text-4xl font-display font-bold text-white mb-1">
                {videos?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {videos?.filter((v) => v.status === "completed").length || 0} with feedback
              </p>
              <Link href="/videos">
                <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-view-videos">
                  View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </Card>

            {/* Stat: Current level */}
            <Card className="flex flex-col justify-between" data-testid="stat-level">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/20 text-primary rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-bold text-white">Level</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Current</p>
                </div>
              </div>
              <p className="text-4xl font-display font-bold text-white mb-1">{currentLevel}</p>
              <p className="text-xs text-muted-foreground">{currentLevelData.name}</p>
              <Link href="/modules">
                <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-go-modules">
                  Train <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>

          {/* Your Journey roadmap */}
          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-4" data-testid="section-journey">
              Your Journey
            </h2>
            <div className="space-y-3">
              {LEVELS.map((lvl) => {
                const isActive = lvl.num === currentLevel;
                const isDone = lvl.num < currentLevel;
                const isLocked = lvl.num > currentLevel && !hasSubscription;
                return (
                  <motion.div
                    key={lvl.num}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: lvl.num * 0.08 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/5"
                        : isDone
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/5 bg-card/30"
                    }`}
                    data-testid={`level-card-${lvl.num}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-display font-bold ${
                        isDone
                          ? "bg-green-500/20 text-green-400"
                          : isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-white/5 text-muted-foreground"
                      }`}
                    >
                      {isDone ? "✓" : lvl.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-bold text-white text-sm uppercase tracking-wider">
                          Level {lvl.num}: {lvl.name}
                        </p>
                        {isActive && (
                          <Badge className="text-[10px] px-2 py-0 bg-primary/20 text-primary border-primary/30">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{lvl.desc}</p>
                    </div>
                    {isLocked && <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
                    {isActive && (
                      <Link href="/modules">
                        <Button size="sm" variant="ghost" data-testid={`button-continue-level-${lvl.num}`}>
                          Continue <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Next up */}
          {nextModule && hasSubscription && (
            <div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-4">
                Next Up
              </h2>
              <Card className="flex items-center justify-between gap-4 border-primary/20" data-testid="card-next-module">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{nextModule.title}</p>
                    <p className="text-xs text-muted-foreground">Level {nextModule.level} · Module {nextModule.orderIndex}</p>
                  </div>
                </div>
                <Link href="/modules">
                  <Button size="sm" data-testid="button-start-module">
                    Start <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            </div>
          )}

          {/* Announcements */}
          {!!announcements?.length && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Megaphone className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">
                  Announcements
                </h2>
              </div>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((ann) => (
                  <Card
                    key={ann.id}
                    className={ann.pinned ? "border-primary/30" : ""}
                    data-testid={`card-announcement-${ann.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {ann.pinned && <Pin className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                      <div>
                        <h4 className="font-semibold text-white">{ann.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{ann.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(ann.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent video activity */}
          {!!videos?.length && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">
                  Recent Videos
                </h2>
                <Link href="/videos">
                  <Button variant="ghost" size="sm">See all <ArrowRight className="w-3 h-3 ml-1" /></Button>
                </Link>
              </div>
              <Card className="p-0 overflow-hidden border-white/5">
                {videos.slice(0, 4).map((video, i) => (
                  <div
                    key={video.id}
                    className={`p-4 flex items-center justify-between ${i !== 0 ? "border-t border-white/5" : ""}`}
                    data-testid={`row-video-${video.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Video className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-white">{video.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.submittedAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={video.status === "completed" ? "success" : "warning"}>
                      {video.status}
                    </Badge>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>

        {/* ── Right column: AI mentor ─────────────────────────── */}
        <div className="lg:sticky lg:top-8">
          <BaseballAI />
        </div>
      </div>
    </div>
  );
}
