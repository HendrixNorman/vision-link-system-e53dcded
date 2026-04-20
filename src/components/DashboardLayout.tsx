import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, AppRole, primaryRole } from "@/contexts/AuthContext";
import { SchoolLogo } from "./SchoolLogo";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, LayoutDashboard, Users, GraduationCap, Megaphone, FileText, BookOpen, Baby, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const navByRole: Record<AppRole, NavItem[]> = {
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/results", label: "Results", icon: FileText },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  ],
  teacher: [
    { to: "/teacher", label: "Overview", icon: LayoutDashboard },
    { to: "/teacher/students", label: "Students", icon: GraduationCap },
    { to: "/teacher/results", label: "Enter Results", icon: FileText },
    { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
  ],
  student: [
    { to: "/student", label: "My Dashboard", icon: LayoutDashboard },
    { to: "/student/results", label: "My Results", icon: BookOpen },
    { to: "/student/announcements", label: "Announcements", icon: Megaphone },
  ],
  parent: [
    { to: "/parent", label: "Overview", icon: LayoutDashboard },
    { to: "/parent/children", label: "My Children", icon: Baby },
    { to: "/parent/announcements", label: "Announcements", icon: Megaphone },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { roles, user, signOut } = useAuth();
  const role = primaryRole(roles);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const items = role ? navByRole[role] : [];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-card flex items-center justify-between px-4">
        <SchoolLogo />
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-30 h-screen w-64 shrink-0 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden lg:flex h-16 items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-sm text-sidebar-foreground">Double Vision</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">High School</div>
            </div>
          </div>
        </div>

        <div className="lg:hidden h-14" />

        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${role}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-sidebar-foreground/60">Signed in as</div>
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</div>
            <div className="text-[10px] uppercase tracking-wide text-sidebar-primary mt-1">{role}</div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => setPwdOpen(true)}>
            <KeyRound className="h-4 w-4 mr-2" /> Change password
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />

      {/* Backdrop */}
      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 z-20 bg-foreground/40 backdrop-blur-sm" />}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
