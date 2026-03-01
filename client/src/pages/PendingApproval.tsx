import { motion } from "framer-motion";
import { Clock, Mail, RefreshCw, LogOut } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold uppercase tracking-widest text-white mb-3">
          Awaiting Approval
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your account is pending parental consent. A confirmation link has been sent to your parent or guardian.
          Once they approve, you will automatically gain full access.
        </p>

        <Card className="text-left space-y-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white">Parent Email</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user?.parentEmail || "Not provided"}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p className="text-sm text-muted-foreground">
              Your parent will receive an email with a link to approve your account. Once approved, refresh this page to access the platform.
            </p>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            data-testid="button-refresh-status"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check Status
          </Button>
          <Button
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Questions? Contact support. This platform is strictly for athletes ages 14–18.
        </p>
      </motion.div>
    </div>
  );
}
