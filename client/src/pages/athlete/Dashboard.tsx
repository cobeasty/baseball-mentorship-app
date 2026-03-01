import React from "react";
import { Card, Badge, Button } from "@/components/ui";
import { useUserProgress, useModules } from "@/hooks/use-modules";
import { useVideos } from "@/hooks/use-videos";
import { Trophy, PlayCircle, Video, ArrowRight, Activity } from "lucide-react";
import { Link } from "wouter";

import { BaseballAI } from "@/components/BaseballAI";

export default function Dashboard() {
  const { data: progress } = useUserProgress();
  const { data: modules } = useModules();
  const { data: videos } = useVideos();

  const totalModules = modules?.length || 0;
  const completedCount = progress?.length || 0;
  const percentComplete = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const currentLevel = Math.min(Math.floor(completedCount / 3) + 1, 3);
  const levelNames = ["Foundations", "Competitive Mindset", "Recruiting Blueprint"];

  const pendingVideos = videos?.filter(v =&gt; v.status === 'submitted' || v.status === 'review').length || 0;

  return (
    &lt;div className="space-y-8"&gt;
      &lt;div className="flex justify-between items-end"&gt;
        &lt;div&gt;
          &lt;h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white"&gt;Athlete Overview&lt;/h1&gt;
          &lt;p className="text-muted-foreground mt-1"&gt;Track your progress and elevate your game.&lt;/p&gt;
        &lt;/div&gt;
        &lt;Badge variant="success" className="px-4 py-1.5 text-sm"&gt;
          &lt;Trophy className="w-4 h-4 mr-2 inline" /&gt;
          Level {currentLevel}: {levelNames[currentLevel - 1]}
        &lt;/Badge&gt;
      &lt;/div&gt;

      &lt;div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"&gt;
        &lt;div className="lg:col-span-2 space-y-8"&gt;
          &lt;div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"&gt;
            &lt;Card className="bg-gradient-to-br from-card to-card/50"&gt;
              &lt;div className="flex items-center gap-4 mb-4"&gt;
                &lt;div className="p-3 bg-primary/20 text-primary rounded-lg"&gt;&lt;Activity className="w-6 h-6" /&gt;&lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="font-display font-bold text-lg text-white"&gt;Training Progress&lt;/h3&gt;
                  &lt;p className="text-xs text-muted-foreground uppercase tracking-widest"&gt;{completedCount} of {totalModules} Modules&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2"&gt;
                &lt;div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentComplete}%` }}&gt;&lt;/div&gt;
              &lt;/div&gt;
              &lt;p className="text-right text-xs text-primary font-bold"&gt;{percentComplete}% Complete&lt;/p&gt;
            &lt;/Card&gt;

            &lt;Card&gt;
              &lt;div className="flex items-center gap-4 mb-4"&gt;
                &lt;div className="p-3 bg-blue-500/20 text-blue-500 rounded-lg"&gt;&lt;PlayCircle className="w-6 h-6" /&gt;&lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="font-display font-bold text-lg text-white"&gt;Next Module&lt;/h3&gt;
                  &lt;p className="text-xs text-muted-foreground uppercase tracking-widest"&gt;Resume Training&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;Link href="/modules"&gt;
                &lt;Button variant="outline" className="w-full mt-2"&gt;
                  Continue &lt;ArrowRight className="w-4 h-4 ml-2" /&gt;
                &lt;/Button&gt;
              &lt;/Link&gt;
            &lt;/Card&gt;

            &lt;Card&gt;
              &lt;div className="flex items-center gap-4 mb-4"&gt;
                &lt;div className="p-3 bg-purple-500/20 text-purple-500 rounded-lg"&gt;&lt;Video className="w-6 h-6" /&gt;&lt;/div&gt;
                &lt;div&gt;
                  &lt;h3 className="font-display font-bold text-lg text-white"&gt;Video Analysis&lt;/h3&gt;
                  &lt;p className="text-xs text-muted-foreground uppercase tracking-widest"&gt;{pendingVideos} Pending Reviews&lt;/p&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              &lt;Link href="/videos"&gt;
                &lt;Button variant="outline" className="w-full mt-2"&gt;
                  Submit Video &lt;ArrowRight className="w-4 h-4 ml-2" /&gt;
                &lt;/Button&gt;
              &lt;/Link&gt;
            &lt;/Card&gt;
          &lt;/div&gt;

          &lt;div&gt;
            &lt;h2 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-6"&gt;Recent Activity&lt;/h2&gt;
            &lt;Card className="p-0 overflow-hidden border-white/5"&gt;
              {videos?.slice(0, 3).map((video, i) =&gt; (
                &lt;div key={video.id} className={`p-4 flex items-center justify-between ${i !== 0 ? 'border-t border-white/5' : ''}`}&gt;
                  &lt;div className="flex items-center gap-4"&gt;
                    &lt;Video className="w-5 h-5 text-muted-foreground" /&gt;
                    &lt;div&gt;
                      &lt;p className="font-medium text-white"&gt;{video.title}&lt;/p&gt;
                      &lt;p className="text-xs text-muted-foreground"&gt;Submitted {new Date(video.submittedAt!).toLocaleDateString()}&lt;/p&gt;
                    &lt;/div&gt;
                  &lt;/div&gt;
                  &lt;Badge variant={video.status === 'completed' ? 'success' : 'warning'}&gt;
                    {video.status}
                  &lt;/Badge&gt;
                &lt;/div&gt;
              ))}
              {!videos?.length && (
                &lt;div className="p-8 text-center text-muted-foreground"&gt;
                  &lt;p&gt;No recent activity. Start by completing a module or submitting a video.&lt;/p&gt;
                &lt;/div&gt;
              )}
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
