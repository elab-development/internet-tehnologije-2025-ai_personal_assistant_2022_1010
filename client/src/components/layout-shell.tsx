import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Brain, LayoutDashboard, MessageSquare, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/chat", label: "AI Chat", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-secondary/30 flex font-sans text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border/50 hidden md:flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Second<span className="text-primary">Brain</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
            <p className="font-semibold truncate">{user?.username}</p>
          </div>
          <Button variant="outline" className="w-full justify-start gap-3" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 animate-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
