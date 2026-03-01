import React, { useState } from "react";
import { Card, Button, Badge, Label, Input } from "@/components/ui";
import { useVideos, useUpdateVideoStatus, useCreateFeedback } from "@/hooks/use-videos";
import { useUsersList } from "@/hooks/use-users";
import { Video, Check, Users } from "lucide-react";

export default function AdminPortal() {
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: users, isLoading: usersLoading } = useUsersList();
  
  const updateStatus = useUpdateVideoStatus();
  const createFeedback = useCreateFeedback();

  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackVideoUrl, setFeedbackVideoUrl] = useState("");

  const pendingVideos = videos?.filter(v => v.status !== 'completed') || [];

  const handleReviewSubmit = async (videoId: number) => {
    if (!feedbackText && !feedbackVideoUrl) return;
    
    await createFeedback.mutateAsync({
      videoId,
      adminId: "system", // Will be overridden by backend with req.user ID if structured that way, or we pass user ID
      feedbackText,
      feedbackVideoUrl
    });
    
    await updateStatus.mutateAsync({ id: videoId, status: 'completed' });
    setActiveReviewId(null);
    setFeedbackText("");
    setFeedbackVideoUrl("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Admin Headquarters</h1>
        <p className="text-muted-foreground mt-1">Manage athletes, review submissions, and control content.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Videos Needing Review */}
        <Card className="border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">Pending Reviews</h2>
            <Badge variant="success" className="ml-auto">{pendingVideos.length}</Badge>
          </div>

          <div className="space-y-4">
            {pendingVideos.length === 0 && <p className="text-muted-foreground text-sm">All caught up! No pending reviews.</p>}
            
            {pendingVideos.map(vid => (
              <div key={vid.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white">{vid.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Athlete ID: {vid.athleteId}</p>
                  </div>
                  <a href={vid.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    View Original →
                  </a>
                </div>

                {activeReviewId === vid.id ? (
                  <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
                    <div>
                      <Label>Analysis / Notes</Label>
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white mt-1"
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Response Video URL (Optional)</Label>
                      <Input 
                        value={feedbackVideoUrl}
                        onChange={(e) => setFeedbackVideoUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleReviewSubmit(vid.id)} isLoading={createFeedback.isPending} className="flex-1">
                        <Check className="w-4 h-4 mr-2" /> Complete Review
                      </Button>
                      <Button variant="ghost" onClick={() => setActiveReviewId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveReviewId(vid.id)}>
                    Start Review
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* User Roster */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-white">Athlete Roster</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase font-display bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Athlete</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {users?.filter(u => u.role === 'athlete').map((u, i) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground uppercase tracking-wider">{u.tier}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.approvalStatus === 'active' ? 'success' : 'warning'}>{u.approvalStatus}</Badge>
                    </td>
                  </tr>
                ))}
                {!users?.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No athletes found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
