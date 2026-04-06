import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import { useModules, useUserProgress, useCompleteModule } from "@/hooks/use-modules";
import { VideoEmbed } from "@/components/VideoEmbed";
import { CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, FileText, Play } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const LEVEL_NAMES = ["Foundations", "Competitive Mindset", "Recruiting Blueprint"];

export default function Modules() {
  const { user } = useAuth();
  const { data: modules, isLoading } = useModules();
  const { data: progress } = useUserProgress();
  const completeModule = useCompleteModule();
  const [openId, setOpenId] = useState<number | null>(null);

  const hasSubscription = user?.tier && user.tier !== "none";

  if (isLoading)
    return <div className="text-center text-muted-foreground py-20">Loading modules...</div>;

  const completedIds = new Set(progress?.map((p) => p.moduleId));

  if (!hasSubscription) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-white mb-2">
            Subscribe to Unlock Training
          </h2>
          <p className="text-muted-foreground max-w-md">
            Choose a plan to access the full curriculum, training modules, and video content.
          </p>
        </div>
        <Link href="/get-started">
          <Button data-testid="button-modules-get-started">View Plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">
          Training Modules
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete your training sequentially to unlock advanced material.
        </p>
      </div>

      <div className="space-y-10">
        {[1, 2, 3].map((level) => {
          const levelModules = (modules || [])
            .filter((m) => m.level === level)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          if (levelModules.length === 0) return null;

          const previousLevelModules = (modules || []).filter((m) => m.level === level - 1);
          const previousLevelDone =
            level === 1 || previousLevelModules.every((m) => completedIds.has(m.id));

          const levelComplete = levelModules.every((m) => completedIds.has(m.id));
          const levelInProgress = !levelComplete && levelModules.some((m) => completedIds.has(m.id));

          return (
            <div key={level} className={clsx(!previousLevelDone && "opacity-50 pointer-events-none")}>
              {/* Level header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-xl border",
                    levelComplete
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : levelInProgress
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-secondary border-white/10 text-muted-foreground"
                  )}
                >
                  {levelComplete ? "✓" : level}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-white">
                    {LEVEL_NAMES[level - 1]}
                  </h2>
                  {!previousLevelDone && (
                    <p className="text-xs text-destructive uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <Lock className="w-3 h-3" /> Complete Level {level - 1} first
                    </p>
                  )}
                  {levelComplete && (
                    <p className="text-xs text-green-400 uppercase tracking-widest mt-0.5">
                      All modules complete
                    </p>
                  )}
                </div>
              </div>

              {/* Module cards */}
              <div className="space-y-3">
                {levelModules.map((mod) => {
                  const isCompleted = completedIds.has(mod.id);
                  const isOpen = openId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      data-testid={`module-card-${mod.id}`}
                      className={clsx(
                        "rounded-xl border transition-colors",
                        isOpen
                          ? "border-primary/40"
                          : isCompleted
                          ? "border-green-500/20"
                          : "border-white/10",
                        "bg-card"
                      )}
                    >
                      {/* Clickable header row */}
                      <button
                        type="button"
                        className="w-full text-left p-4 flex items-center gap-4 cursor-pointer select-none"
                        onClick={() => setOpenId(isOpen ? null : mod.id)}
                        data-testid={`button-expand-${mod.id}`}
                      >
                        <div className="shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base">{mod.title}</h3>
                          {mod.description && (
                            <p className="text-sm text-muted-foreground truncate">{mod.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {mod.videoUrl && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-blue-400">
                              <Play className="w-3 h-3" /> Video
                            </span>
                          )}
                          {mod.pdfUrl && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-green-400">
                              <FileText className="w-3 h-3" /> PDF
                            </span>
                          )}
                          {isCompleted && <Badge variant="success">Done</Badge>}
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isOpen && (
                        <div className="border-t border-primary/20 p-6 space-y-6">
                          {/* Video player */}
                          {mod.videoUrl && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Play className="w-3 h-3" /> Training Video
                              </p>
                              <VideoEmbed url={mod.videoUrl} title={mod.title} />
                            </div>
                          )}

                          {/* Lesson notes */}
                          {mod.content && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Lesson Notes
                              </p>
                              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {mod.content}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* PDF link */}
                          {mod.pdfUrl && (
                            <div>
                              <a
                                href={mod.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                                data-testid={`link-pdf-${mod.id}`}
                              >
                                <FileText className="w-4 h-4" />
                                Download Study Sheet (PDF)
                              </a>
                            </div>
                          )}

                          {/* No content placeholder */}
                          {!mod.videoUrl && !mod.content && !mod.pdfUrl && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p className="text-sm">Content coming soon. Check back shortly.</p>
                            </div>
                          )}

                          {/* Mark complete button */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">
                              {isCompleted
                                ? "You have completed this module."
                                : "Watch the video and review the notes, then mark this module complete."}
                            </p>
                            {isCompleted ? (
                              <Badge variant="success" className="shrink-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                className="shrink-0"
                                onClick={() => completeModule.mutate(mod.id)}
                                disabled={completeModule.isPending}
                                data-testid={`button-complete-${mod.id}`}
                              >
                                {completeModule.isPending ? "Saving…" : "Mark Complete"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
