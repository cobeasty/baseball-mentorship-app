import React from "react";
import { Card, Badge, Button } from "@/components/ui";
import { useUserProgress, useModules } from "@/hooks/use-modules";
import { useVideos } from "@/hooks/use-videos";
import { Trophy, PlayCircle, Video, ArrowRight, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: progress } = useUserProgress();
  const { data: modules } = useModules();
  const { data: videos } = useVideos();

  const totalModules = modules?.length || 0;
  const completedCount = progress?.length || 0;
  const percentComplete = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const currentLevel = Math.min(Math.floor(completedCount / 3) + 1, 3);
  const levelNames = ["Foundations", "Competitive Mindset", "Recruiting Blueprint"];

  const pendingVideos = videos?.filter(v => v.status === 'submitted' || v.status === 'review').length || 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Athlete Overview</h1>
          <p className="text-muted-foreground mt-1">Track your progress and elevate your game.</p>
        </div>
        <Badge variant="success" className="px-4 py-1.5 text-sm">
          <Trophy className="w-4 h-4 mr-2 inline" />
          Level {currentLevel}: {levelNames[currentLevel - 1]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 text-primary rounded-lg"><Activity className="w-6 h-6" /></div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Training Progress</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{completedCount} of {totalModules} Modules</p>
            </div>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentComplete}%` }}></div>
          </div>
          <p className="text-right text-xs text-primary font-bold">{percentComplete}% Complete</p>
        </Card>

        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-lg"><PlayCircle className="w-6 h-6" /></div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Next Module</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Resume Training</p>
            </div>
          </div>
          <Link href="/modules">
            <Button variant="outline" className="w-full mt-2">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-500 rounded-lg"><Video className="w-6 h-6" /></div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Video Analysis</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{pendingVideos} Pending Reviews</p>
            </div>
          </div>
          <Link href="/videos">
            <Button variant="outline" className="w-full mt-2">
              Submit Video <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white mb-6">Recent Activity</h2>
        <Card className="p-0 overflow-hidden border-white/5">
          {videos?.slice(0, 3).map((video, i) => (
            <div key={video.id} className={`p-4 flex items-center justify-between ${i !== 0 ? 'border-t border-white/5' : ''}`}>
              <div className="flex items-center gap-4">
                <Video className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-white">{video.title}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(video.submittedAt!).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant={video.status === 'completed' ? 'success' : 'warning'}>
                {video.status}
              </Badge>
            </div>
          ))}
          {!videos?.length && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No recent activity. Start by completing a module or submitting a video.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
