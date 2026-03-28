import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Layers,
  FileText,
  BarChart3,
  CreditCard,
  Mic,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Generate", href: "/generate", icon: Sparkles },
  { label: "Bulk Generate", href: "/generate/bulk", icon: Layers },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const settingsItems = [
  { label: "Billing", href: "/settings/billing", icon: CreditCard },
  { label: "Brand Voice", href: "/settings/brand-voice", icon: Mic },
];

export function Sidebar() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
    }
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/dashboard" className="text-lg font-bold">
          ShopDesc.ai
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pb-1 pt-3">
          <p className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/50">
            Settings
          </p>
        </div>
        {settingsItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sm text-sidebar-foreground/70"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
