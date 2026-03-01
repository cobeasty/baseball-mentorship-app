import React, { useState } from "react";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { useVideos, useCreateVideo, useVideoFeedback } from "@/hooks/use-videos";
import { Video, Upload, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VideoSubmissions() {
  const { data: videos, isLoading } = useVideos();
  const createVideo = useCreateVideo();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const { data: feedbackData } = useVideoFeedback(selectedVideoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    await createVideo.mutateAsync({ title, videoUrl: url });
    setTitle("");
    setUrl("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Video Analysis</h1>
        <p className="text-muted-foreground mt-1">Submit footage of your mechanics for professional feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="font-display font-bold uppercase text-lg text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> New Submission
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title / Focus Area</Label>
                <Input 
                  placeholder="e.g. Swing mechanics from side" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                />
              </div>
              <div>
                <Label>Video Link (YouTube/Vimeo/Drive)</Label>
                <Input 
                  type="url"
                  placeholder="https://..." 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  required
                />
              </div>
              <Button type="submit" className="w-full" isLoading={createVideo.isPending}>
                Submit for Review
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-bold uppercase text-lg text-white mb-4">Past Submissions</h2>
          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : videos?.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-white/20">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No videos submitted yet.</p>
            </Card>
          ) : (
            videos?.map((vid) => (
              <Card key={vid.id} className="p-0 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 bg-white/[0.02]">
                  <div>
                    <h3 className="font-bold text-white">{vid.title}</h3>
                    <p className="text-xs text-muted-foreground">Submitted {new Date(vid.submittedAt!).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={vid.status === 'completed' ? 'success' : vid.status === 'review' ? 'warning' : 'default'}>
                      {vid.status}
                    </Badge>
                    {vid.status === 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedVideoId(selectedVideoId === vid.id ? null : vid.id)}
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
                          feedbackData.map(fb => (
                            <div key={fb.id} className="space-y-4">
                              <div>
                                <Label className="text-primary">Pro Feedback</Label>
                                <p className="text-sm text-white bg-white/5 p-4 rounded-lg mt-2 border border-white/10">{fb.feedbackText || "No text feedback provided."}</p>
                              </div>
                              {fb.feedbackVideoUrl && (
                                <div>
                                  <Label className="text-primary">Video Breakdown</Label>
                                  <a href={fb.feedbackVideoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline mt-1 block">
                                    Watch Analysis Video →
                                  </a>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center">Loading feedback...</p>
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
