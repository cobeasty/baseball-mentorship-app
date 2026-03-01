import React from "react";
import { Card, Button, Badge } from "@/components/ui";
import { useModules, useUserProgress, useCompleteModule } from "@/hooks/use-modules";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react";
import { clsx } from "clsx";

export default function Modules() {
  const { data: modules, isLoading } = useModules();
  const { data: progress } = useUserProgress();
  const completeModule = useCompleteModule();

  if (isLoading) return <div className="text-center text-muted-foreground py-20">Loading modules...</div>;

  const completedIds = new Set(progress?.map(p => p.moduleId));

  // Group modules by level
  const levels = [1, 2, 3];
  const levelNames = ["Foundations", "Competitive Mindset", "Recruiting Blueprint"];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Training Modules</h1>
        <p className="text-muted-foreground mt-1">Complete your training sequentially to unlock advanced material.</p>
      </div>

      <div className="space-y-10">
        {levels.map((level) => {
          const levelModules = modules?.filter(m => m.level === level).sort((a, b) => a.orderIndex - b.orderIndex) || [];
          if (levelModules.length === 0) return null;

          // Simple lock logic: Level 2 needs all Level 1 done. (Simplification for MVP)
          const previousLevelModules = modules?.filter(m => m.level === level - 1) || [];
          const previousLevelDone = level === 1 || previousLevelModules.every(m => completedIds.has(m.id));

          return (
            <div key={level} className={clsx("transition-opacity", !previousLevelDone && "opacity-50")}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-xl text-primary border border-white/10">
                  {level}
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-white">{levelNames[level - 1]}</h2>
                  {!previousLevelDone && <p className="text-xs text-destructive uppercase tracking-widest flex items-center"><Lock className="w-3 h-3 mr-1"/> Locked</p>}
                </div>
              </div>

              <div className="grid gap-4">
                {levelModules.map((mod) => {
                  const isCompleted = completedIds.has(mod.id);
                  return (
                    <Card key={mod.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                          <h3 className="font-bold text-lg text-white">{mod.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">{mod.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {mod.videoUrl && (
                          <Button variant="outline" size="sm" disabled={!previousLevelDone} onClick={() => window.open(mod.videoUrl, '_blank')}>
                            <Play className="w-4 h-4 mr-2" /> Watch
                          </Button>
                        )}
                        {!isCompleted && previousLevelDone && (
                          <Button 
                            size="sm" 
                            onClick={() => completeModule.mutate(mod.id)}
                            isLoading={completeModule.isPending}
                          >
                            Mark Complete
                          </Button>
                        )}
                        {isCompleted && (
                          <Badge variant="success">Completed</Badge>
                        )}
                      </div>
                    </Card>
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
