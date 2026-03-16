import { useState, type ChangeEvent } from "react";
import { Card, Button, Badge, Label, Input } from "@/components/ui";
import { useVideos, useUpdateVideoStatus, useCreateFeedback } from "@/hooks/use-videos";
import { useUsersList, useUpdateUser } from "@/hooks/use-users";
import { useModules, useCreateModule, useUpdateModule, useDeleteModule } from "@/hooks/use-modules";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/use-announcements";
import { useAdminMetrics } from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import {
  Video, Check, Users, BarChart3, Megaphone, BookOpen,
  Trash2, UserCheck, UserX, Plus, TrendingUp, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "metrics" | "users" | "videos" | "modules" | "announcements";

function MetricsTab() {
  const { data: metrics, isLoading } = useAdminMetrics();

  if (isLoading) return <div className="text-muted-foreground p-8 text-center">Loading metrics...</div>;
  if (!metrics) return null;

  const stats = [
    { label: "Total Users", value: metrics.totalUsers, color: "text-white" },
    { label: "Active Athletes", value: metrics.activeAthletes, color: "text-green-400" },
    { label: "Pending Approvals", value: metrics.pendingApprovals, color: "text-yellow-400" },
    { label: "Suspended", value: metrics.suspendedUsers, color: "text-red-400" },
    { label: "Videos Submitted", value: metrics.totalVideos, color: "text-blue-400" },
    { label: "Pending Reviews", value: metrics.pendingVideos, color: "text-orange-400" },
    { label: "Total Modules", value: metrics.totalModules, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="text-center">
            <p className={`text-4xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider text-white">Subscription Breakdown</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "No Subscription", value: metrics.tierBreakdown.none, color: "text-muted-foreground" },
            { label: "Tier 1 — Mentorship", value: metrics.tierBreakdown.tier1, color: "text-blue-400" },
            { label: "Tier 2 — Video", value: metrics.tierBreakdown.tier2, color: "text-primary" },
            { label: "Tier 3 — Elite", value: metrics.tierBreakdown.tier3, color: "text-yellow-400" },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useUsersList();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/users/${id}/approve`, { method: "POST" });
      toast({ title: "User approved" });
      window.location.reload();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleSuspend = async (id: string) => {
    try {
      await fetch(`/api/users/${id}/suspend`, { method: "POST" });
      toast({ title: "User suspended" });
      window.location.reload();
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  if (isLoading) return <div className="text-muted-foreground p-8 text-center">Loading users...</div>;

  const athletes = users?.filter(u => u.role === "athlete") || [];
  const parents = users?.filter(u => u.role === "parent") || [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-yellow-400" />
          <h3 className="font-display font-bold uppercase tracking-wider text-white">
            Pending Approvals
            <Badge variant="warning" className="ml-3">{athletes.filter(u => u.approvalStatus === "pending").length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {athletes.filter(u => u.approvalStatus === "pending").map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
              <div>
                <p className="font-semibold text-white">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                {u.parentEmail && <p className="text-xs text-muted-foreground">Parent: {u.parentEmail}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(u.id)} data-testid={`button-approve-${u.id}`}>
                  <UserCheck className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSuspend(u.id)} data-testid={`button-suspend-${u.id}`}>
                  <UserX className="w-4 h-4 mr-1" /> Deny
                </Button>
              </div>
            </div>
          ))}
          {athletes.filter(u => u.approvalStatus === "pending").length === 0 && (
            <p className="text-muted-foreground text-sm">No pending approvals.</p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-display font-bold uppercase tracking-wider text-white">All Athletes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase font-display bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left rounded-tl-lg">Athlete</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-white" data-testid={`text-user-name-${u.id}`}>{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground uppercase tracking-wider">{u.tier || "none"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.approvalStatus === "active" ? "success" : u.approvalStatus === "suspended" ? "destructive" : "warning"}>
                      {u.approvalStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.approvalStatus !== "active" && (
                        <Button size="sm" variant="ghost" onClick={() => handleApprove(u.id)}>
                          <UserCheck className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      {u.approvalStatus !== "suspended" && (
                        <Button size="sm" variant="ghost" onClick={() => handleSuspend(u.id)}>
                          <UserX className="w-3 h-3 mr-1" /> Suspend
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {athletes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No athletes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function VideosTab() {
  const { data: videos, isLoading: videosLoading } = useVideos();
  const updateStatus = useUpdateVideoStatus();
  const createFeedback = useCreateFeedback();
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackVideoUrl, setFeedbackVideoUrl] = useState("");
  const { toast } = useToast();

  const pendingVideos = videos?.filter(v => v.status !== "completed") || [];
  const completedVideos = videos?.filter(v => v.status === "completed") || [];

  const handleReviewSubmit = async (videoId: number) => {
    if (!feedbackText && !feedbackVideoUrl) return;
    await createFeedback.mutateAsync({ videoId, adminId: "", feedbackText, feedbackVideoUrl });
    await updateStatus.mutateAsync({ id: videoId, status: "completed" });
    setActiveReviewId(null);
    setFeedbackText("");
    setFeedbackVideoUrl("");
    toast({ title: "Review submitted" });
  };

  if (videosLoading) return <div className="text-muted-foreground p-8 text-center">Loading videos...</div>;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider text-white">Pending Reviews</h3>
          <Badge variant="warning" className="ml-auto">{pendingVideos.length}</Badge>
        </div>
        <div className="space-y-4">
          {pendingVideos.length === 0 && <p className="text-muted-foreground text-sm">All caught up! No pending reviews.</p>}
          {pendingVideos.map(vid => (
            <div key={vid.id} className="p-4 bg-white/5 rounded-lg border border-white/10" data-testid={`card-video-${vid.id}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white">{vid.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Athlete ID: {vid.athleteId}</p>
                  {vid.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {vid.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{vid.status}</Badge>
                  <a href={vid.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    View →
                  </a>
                </div>
              </div>
              {activeReviewId === vid.id ? (
                <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
                  <div>
                    <Label>Analysis / Notes</Label>
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white mt-1 resize-none"
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Enter your coaching feedback..."
                      data-testid="input-feedback-text"
                    />
                  </div>
                  <div>
                    <Label>Response Video URL (Optional)</Label>
                    <Input value={feedbackVideoUrl} onChange={(e) => setFeedbackVideoUrl(e.target.value)} placeholder="https://..." data-testid="input-feedback-video" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleReviewSubmit(vid.id)} isLoading={createFeedback.isPending} className="flex-1" data-testid={`button-submit-review-${vid.id}`}>
                      <Check className="w-4 h-4 mr-2" /> Complete Review
                    </Button>
                    <Button variant="ghost" onClick={() => setActiveReviewId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveReviewId(vid.id)} data-testid={`button-start-review-${vid.id}`}>
                  Start Review
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Check className="w-5 h-5 text-green-400" />
          <h3 className="font-display font-bold uppercase tracking-wider text-white">Completed Reviews</h3>
          <Badge variant="success" className="ml-auto">{completedVideos.length}</Badge>
        </div>
        <div className="space-y-3">
          {completedVideos.map(vid => (
            <div key={vid.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="font-medium text-white">{vid.title}</p>
                <p className="text-xs text-muted-foreground">Athlete ID: {vid.athleteId}</p>
              </div>
              <Badge variant="success">Completed</Badge>
            </div>
          ))}
          {completedVideos.length === 0 && <p className="text-muted-foreground text-sm">No completed reviews yet.</p>}
        </div>
      </Card>
    </div>
  );
}

const EMPTY_FORM = { title: "", description: "", content: "", level: 1, orderIndex: 1, videoUrl: "", pdfUrl: "" };

function ModuleEditForm({
  initial,
  onSave,
  onCancel,
  isPending,
  isCreate,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (v: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  isPending: boolean;
  isCreate?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={set("title")} placeholder="Module title" data-testid="input-module-title" />
        </div>
        <div>
          <Label>Level (1–3)</Label>
          <Input type="number" min={1} max={3} value={form.level} onChange={e => setForm(p => ({ ...p, level: parseInt(e.target.value) }))} data-testid="input-module-level" />
        </div>
        <div>
          <Label>Order Index</Label>
          <Input type="number" value={form.orderIndex} onChange={e => setForm(p => ({ ...p, orderIndex: parseInt(e.target.value) }))} data-testid="input-module-order" />
        </div>
        <div>
          <Label>Description (short)</Label>
          <Input value={form.description} onChange={set("description")} placeholder="One-line description" data-testid="input-module-description" />
        </div>
        <div>
          <Label>Video URL <span className="text-muted-foreground">(YouTube, Vimeo, or .mp4)</span></Label>
          <Input value={form.videoUrl} onChange={set("videoUrl")} placeholder="https://youtube.com/watch?v=..." data-testid="input-module-video" />
        </div>
        <div>
          <Label>PDF URL <span className="text-muted-foreground">(optional)</span></Label>
          <Input value={form.pdfUrl} onChange={set("pdfUrl")} placeholder="https://..." data-testid="input-module-pdf" />
        </div>
      </div>
      <div>
        <Label>Lesson Notes <span className="text-muted-foreground">(shown below the video to athletes)</span></Label>
        <textarea
          className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white mt-1 resize-none focus:outline-none focus:border-primary/50"
          rows={5}
          value={form.content}
          onChange={set("content")}
          placeholder="Add coaching notes, key points, drill instructions…"
          data-testid="input-module-content"
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={() => onSave(form)} isLoading={isPending} data-testid={isCreate ? "button-create-module" : "button-save-module"}>
          {isCreate ? "Create Module" : "Save Changes"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ModulesTab() {
  const { data: modules, isLoading } = useModules();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    try {
      await createModule.mutateAsync(form);
      setShowForm(false);
      toast({ title: "Module created" });
    } catch { toast({ title: "Error creating module", variant: "destructive" }); }
  };

  const handleUpdate = async (id: number, form: typeof EMPTY_FORM) => {
    try {
      await updateModule.mutateAsync({ id, data: form });
      setEditingId(null);
      toast({ title: "Module saved" });
    } catch { toast({ title: "Error saving module", variant: "destructive" }); }
  };

  if (isLoading) return <div className="text-muted-foreground p-8 text-center">Loading modules...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold uppercase tracking-wider text-white">
          Curriculum ({modules?.length || 0} modules)
        </h3>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-add-module">
          <Plus className="w-4 h-4 mr-2" /> Add Module
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <h4 className="font-display font-bold uppercase tracking-wider text-white mb-4">New Module</h4>
          <ModuleEditForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            isPending={createModule.isPending}
            isCreate
          />
        </Card>
      )}

      <div className="space-y-4">
        {[1, 2, 3].map(level => (
          <Card key={level}>
            <h4 className="font-display font-bold uppercase tracking-wider text-muted-foreground mb-4 text-xs">
              Level {level} — {["Foundations", "Competitive Mindset", "Recruiting Blueprint"][level - 1]}
            </h4>
            <div className="space-y-2">
              {modules?.filter(m => m.level === level).map(m => (
                <div key={m.id} data-testid={`card-module-${m.id}`}>
                  {editingId === m.id ? (
                    <div className="p-4 bg-white/5 rounded-lg border border-primary/30">
                      <p className="text-xs text-primary uppercase tracking-widest font-display mb-4">
                        Editing: {m.title}
                      </p>
                      <ModuleEditForm
                        initial={{
                          title: m.title,
                          description: m.description || "",
                          content: m.content || "",
                          level: m.level,
                          orderIndex: m.orderIndex,
                          videoUrl: m.videoUrl || "",
                          pdfUrl: m.pdfUrl || "",
                        }}
                        onSave={(form) => handleUpdate(m.id, form)}
                        onCancel={() => setEditingId(null)}
                        isPending={updateModule.isPending}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{m.title}</p>
                        {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                        <div className="flex gap-3 mt-1.5">
                          {m.videoUrl && <span className="text-xs text-blue-400 flex items-center gap-1">▶ Video</span>}
                          {m.pdfUrl && <span className="text-xs text-green-400 flex items-center gap-1">PDF</span>}
                          {m.content && <span className="text-xs text-yellow-400">Notes</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingId(m.id); setShowForm(false); }}
                          data-testid={`button-edit-module-${m.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteModule.mutate(m.id)}
                          data-testid={`button-delete-module-${m.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!modules?.filter(m => m.level === level).length && (
                <p className="text-xs text-muted-foreground">No modules for this level yet.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const { data: announcements } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false, targetTier: "" });
  const { toast } = useToast();

  const handleCreate = async () => {
    try {
      await createAnnouncement.mutateAsync({ title: form.title, body: form.body, pinned: form.pinned, targetTier: form.targetTier || null });
      setShowForm(false);
      setForm({ title: "", body: "", pinned: false, targetTier: "" });
      toast({ title: "Announcement posted" });
    } catch { toast({ title: "Error posting announcement", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold uppercase tracking-wider text-white">Announcements</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="button-add-announcement">
          <Plus className="w-4 h-4 mr-2" /> Post Announcement
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <h4 className="font-display font-bold uppercase tracking-wider text-white mb-4">New Announcement</h4>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" data-testid="input-announcement-title" />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-sm text-white mt-1 resize-none"
                rows={4}
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Announcement content..."
                data-testid="input-announcement-body"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="rounded" data-testid="checkbox-pin" />
                <span className="text-sm text-muted-foreground">Pin to top</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCreate} isLoading={createAnnouncement.isPending} data-testid="button-post-announcement">Post</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {announcements?.map(ann => (
          <Card key={ann.id} className={ann.pinned ? "border-primary/30" : ""} data-testid={`card-announcement-${ann.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-white">{ann.title}</h4>
                  {ann.pinned && <Badge variant="success">Pinned</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{ann.body}</p>
                <p className="text-xs text-muted-foreground mt-3">{new Date(ann.createdAt!).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteAnnouncement.mutate(ann.id)} data-testid={`button-delete-announcement-${ann.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </Card>
        ))}
        {!announcements?.length && <p className="text-muted-foreground text-sm">No announcements yet.</p>}
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<Tab>("metrics");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "metrics", label: "Metrics", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "videos", label: "Video Queue", icon: Video },
    { id: "modules", label: "Content", icon: BookOpen },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-white">Admin Headquarters</h1>
        <p className="text-muted-foreground mt-1">Manage athletes, content, and platform operations.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "metrics" && <MetricsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "videos" && <VideosTab />}
      {activeTab === "modules" && <ModulesTab />}
      {activeTab === "announcements" && <AnnouncementsTab />}
    </div>
  );
}
