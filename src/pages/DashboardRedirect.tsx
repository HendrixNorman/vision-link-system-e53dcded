import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, primaryRole, dashboardPathFor } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else navigate(dashboardPathFor(primaryRole(roles)), { replace: true });
  }, [user, roles, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
