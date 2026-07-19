'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Activity, Goal } from '@/lib/types';
import {
  computeBadges,
  computeStats,
  monthlyProgress,
  weeklyProgress,
} from '@/lib/dashboard';
import { categoryMeta, formatDate, isOverdue, priorityMeta } from '@/lib/goal-utils';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StatCard, SectionCard } from '@/components/stat-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const badgeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  ListChecks,
  CheckCircle2,
  Trophy,
  Flame,
  Zap,
  Rocket,
  Sparkles,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.listGoals(),
  });
  const activityQuery = useQuery<Activity[]>({
    queryKey: ['activity'],
    queryFn: () => api.listActivity(),
  });

  const goals = (goalsQuery.data ?? []) as Goal[];
  const activity = (activityQuery.data ?? []) as Activity[];
  const stats = computeStats(goals);
  const weekly = weeklyProgress(goals);
  const monthly = monthlyProgress(goals);
  const badges = computeBadges(goals, activity);
  const upcoming = goals
    .filter((g) => !g.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const motivate = useMutation({
    mutationFn: () => api.motivate(),
    onSuccess: (msg) => toast.success('AI Coach', { description: msg }),
  });

  const loading = goalsQuery.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Here is a snapshot of your goals and momentum.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => motivate.mutate()}
            disabled={motivate.isPending}
          >
            {motivate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Motivate me
          </Button>
          <Button asChild>
            <Link href="/goals">
              <Target className="mr-2 h-4 w-4" /> New goal
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total goals" value={stats.total} icon={Target} delay={0} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" delay={0.05} />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" delay={0.1} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} tone="destructive" delay={0.15} />
      </div>

      {/* Productivity + Badges */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Productivity score"
          description="Based on completion rate and average progress."
          className="lg:col-span-1"
        >
          <div className="flex items-center gap-6">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - stats.productivityScore / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="text-center">
                <div className="text-3xl font-semibold">{stats.productivityScore}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-medium text-destructive">{stats.overdue}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Achievement badges"
          description={`${badges.filter((b) => b.unlocked).length} of ${badges.length} unlocked`}
          className="lg:col-span-2"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">View goals <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {badges.map((b) => {
              const Icon = badgeIcons[b.icon] ?? Sparkles;
              return (
                <div
                  key={b.id}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
                    b.unlocked
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-muted/30 opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      b.unlocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-tight">{b.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Weekly progress" description="Goals created vs completed this week">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="created" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#gCreated)" />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#gDone)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </SectionCard>

        <SectionCard title="Monthly progress" description="Last 6 months at a glance">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="mCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="created" stroke="hsl(var(--chart-4))" strokeWidth={2} fill="url(#mCreated)" />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#mDone)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </SectionCard>
      </div>

      {/* Upcoming */}
      <SectionCard title="Upcoming goals" description="Sorted by nearest deadline">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active goals. Create one to get started.
            </p>
            <Button asChild>
              <Link href="/goals">Create a goal</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((g) => {
              const cat = categoryMeta(g.category);
              const pri = priorityMeta(g.priority);
              const overdue = isOverdue(g);
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-4 rounded-xl border border-border p-3"
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(g.deadline)} · {pri.label} priority
                    </p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <Progress value={g.progress} className="h-2" />
                  </div>
                  <Badge variant={overdue ? 'destructive' : 'secondary'} className="shrink-0">
                    {overdue ? 'Overdue' : `${g.progress}%`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ChartContainer({ children }: { children: React.ReactNode }) {
  return <div className="h-64 w-full">{children}</div>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}
