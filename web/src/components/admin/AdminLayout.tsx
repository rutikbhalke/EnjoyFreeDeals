import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Tag, Store, FolderOpen, Users, ArrowLeft, Menu, Webhook, Send, BookOpen, MessageCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/deals", icon: Tag, label: "Deals" },
  { to: "/admin/stores", icon: Store, label: "Stores" },
  { to: "/admin/categories", icon: FolderOpen, label: "Categories" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/database", icon: Database, label: "Database" },
  { to: "/admin/telegram-deals", icon: MessageCircle, label: "Telegram Deals" },
  { to: "/admin/webhook-deals", icon: Webhook, label: "Webhook Deals" },
  { to: "/admin/submissions", icon: Send, label: "User Submissions" },
  { to: "/admin/blog", icon: BookOpen, label: "Blog" },
];

function SidebarNav() {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )
          }
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Button variant="ghost" size="icon" asChild>
            <NavLink to="/"><ArrowLeft className="h-4 w-4" /></NavLink>
          </Button>
          <span className="font-display text-lg font-bold">Admin</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile header + sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-4 pt-4 font-display">Admin</SheetTitle>
              <div onClick={() => setOpen(false)}>
                <SidebarNav />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-display font-bold">Admin</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
