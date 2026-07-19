'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import type { AppNotification } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: Settings },
  { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
];

const typeColor: Record<AppNotification['type'], string> = {
  incomplete_today: 'text-warning',
  deadline_near: 'text-warning',
  overdue: 'text-destructive',
  inactive: 'text-muted-foreground',
  achievement: 'text-success',
  ai: 'text-primary',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Goal Buddy AI</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-semibold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => logout().then(() => router.replace('/login'))}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/70 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Goal Buddy</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.listNotifications(),
    refetchInterval: 60_000,
  });
  const data = (queryData ?? []) as AppNotification[];
  const unread = data.filter((n) => !n.read).length;

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !data?.length ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <Check className="h-6 w-6 text-success" />
              You are all caught up.
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {data.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <Clock className={cn('mt-0.5 h-4 w-4 shrink-0', typeColor[n.type])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        aria-label="Mark read"
                        onClick={() => markOne.mutate(n.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
