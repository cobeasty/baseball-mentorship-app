import { useState } from "react";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { useVideos, useCreateVideo, useVideoFeedback } from "@/hooks/use-videos";
import { useSubscription } from "@/hooks/use-subscription";
import { Video, Upload, MessageSquare, AlertCircle, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function VideoSubmissions() {
  const { data: videos, isLoading } = useVideos();
  const { data: subscription } = useSubscription();
  const createVideo = useCreateVideo();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const { data: feedbackData } = useVideoFeedback(selectedVideoId);

  // Compute credit stats
  const tier = subscription?.tier || "none";
  const creditsUsed = subscription?.videoCreditsUsed ?? 0;
  const creditsLimit = subscription?.videoCreditsLimit ?? 0;
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);
  const hasVideoAccess = tier === "tier2" || tier === "tier3";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    try {
      await createVideo.mutateAsync({ title, videoUrl: url });
      setTitle("");
      setUrl("");
      toast({
        title: "Video Submitted",
        description: "Your video has been submitted for professional review.",
      });
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit video. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Video Analysis</h1>
        <p className="text-muted-foreground mt-1">Submit footage of your mechanics for professional feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="font-display font-bold uppercase text-lg text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> New Submission
            </h2>

            {/* Subscription gate */}
            {!hasVideoAccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Upgrade Required</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      Video submissions are included in Tier 2 ($59/mo) and Tier 3 ($99/mo) plans.
                    </p>
                  </div>
                </div>
                <Link href="/subscribe">
                  <Button className="w-full" data-testid="button-upgrade-for-video">
                    <CreditCard className="w-4 h-4 mr-2" /> Upgrade to Submit Videos
                  </Button>
                </Link>
              </div>
            ) : creditsRemaining === 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">No Credits Remaining</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      You've used all {creditsLimit} video credits this billing period. Credits reset at the start of your next billing cycle.
                    </p>
                  </div>
                </div>
                {tier === "tier2" && (
                  <Link href="/subscribe">
                    <Button variant="outline" className="w-full" size="sm" data-testid="button-upgrade-tier3">
                      Upgrade to Tier 3 for more credits
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Credit counter */}
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <span className="text-sm text-muted-foreground">Credits remaining</span>
                  <span
                    className="font-bold text-primary text-lg"
                    data-testid="text-credits-remaining"
                  >
                    {creditsRemaining} / {creditsLimit}
                  </span>
                </div>
                <div>
                  <Label>Title / Focus Area</Label>
                  <Input
                    placeholder="e.g. Swing mechanics from side"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    data-testid="input-video-title"
                  />
                </div>
                <div>
                  <Label>Video Link (YouTube / Vimeo / Drive)</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    data-testid="input-video-url"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={createVideo.isPending}
                  data-testid="button-submit-video"
                >
                  Submit for Review
                </Button>
              </form>
            )}
          </Card>

          {/* Tier info */}
          {hasVideoAccess && (
            <Card className="bg-white/[0.02] border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-display">
                Your Plan
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold capitalize">
                    {tier === "tier2" ? "Mentorship + Video" : "Premium Elite"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {creditsLimit} video credits / month
                  </p>
                </div>
                <Badge variant="success" data-testid="badge-tier">
                  {tier === "tier2" ? "Tier 2" : "Tier 3"}
                </Badge>
              </div>
            </Card>
          )}
        </div>

        {/* Past Submissions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-bold uppercase text-lg text-white">Past Submissions</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="h-20 animate-pulse bg-white/5" />
              ))}
            </div>
          ) : !videos || videos.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-white/20">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No videos submitted yet.</p>
              {!hasVideoAccess && (
                <p className="text-xs text-muted-foreground mt-2">
                  Upgrade to Tier 2 or higher to submit your first video.
                </p>
              )}
            </Card>
          ) : (
            videos.map((vid) => (
              <Card key={vid.id} className="p-0 overflow-hidden" data-testid={`card-video-${vid.id}`}>
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 bg-white/[0.02]">
                  <div>
                    <h3 className="font-bold text-white">{vid.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(vid.submittedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        vid.status === "completed"
                          ? "success"
                          : vid.status === "review"
                            ? "warning"
                            : "default"
                      }
                      data-testid={`badge-status-${vid.id}`}
                    >
                      {vid.status === "submitted"
                        ? "Pending Review"
                        : vid.status === "review"
                          ? "In Review"
                          : "Completed"}
                    </Badge>
                    {vid.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedVideoId(
                            selectedVideoId === vid.id ? null : vid.id
                          )
                        }
                        data-testid={`button-feedback-${vid.id}`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" /> Feedback
                      </Button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedVideoId === vid.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/20"
                    >
                      <div className="p-6">
                        {feedbackData && feedbackData.length > 0 ? (
                          feedbackData.map((fb) => (
                            <div key={fb.id} className="space-y-4">
                              <div>
                                <Label className="text-primary">Pro Feedback</Label>
                                <p className="text-sm text-white bg-white/5 p-4 rounded-lg mt-2 border border-white/10">
                                  {fb.feedbackText || "No text feedback provided."}
                                </p>
                              </div>
                              {fb.feedbackVideoUrl && (
                                <div>
                                  <Label className="text-primary">Video Breakdown</Label>
                                  <a
                                    href={fb.feedbackVideoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-blue-400 hover:underline mt-1 block"
                                  >
                                    Watch Analysis Video →
                                  </a>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No feedback available yet.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
