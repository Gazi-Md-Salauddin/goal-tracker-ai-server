'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Goal } from '@/lib/types';
import {
  categoryBreakdown,
  computeStats,
  monthlyProgress,
  weeklyProgress,
} from '@/lib/dashboard';
import { CATEGORIES, categoryMeta } from '@/lib/goal-utils';
import { SectionCard } from '@/components/stat-card';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsPage() {
  const goalsQuery = useQuery<Goal[]>({ queryKey: ['goals'], queryFn: () => api.listGoals() });
  const goals = (goalsQuery.data ?? []) as Goal[];
  const stats = computeStats(goals);
  const weekly = weeklyProgress(goals);
  const monthly = monthlyProgress(goals);
  const categories = categoryBreakdown(goals);

  const completionData = [
    { name: 'Completed', value: stats.completed, color: 'hsl(var(--chart-2))' },
    { name: 'Pending', value: stats.pending, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-muted-foreground">
          Visualize your progress across time and categories.
        </p>
      </div>

      {goalsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <BarChart3 className="h-10 w-10" />
          <p>Create some goals to see your analytics.</p>
        </div>
      ) : (
        <>
          {/* Completion rate */}
          <SectionCard
            title="Goal completion rate"
            description={`${stats.completionRate}% of all goals completed`}
          >
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {completionData.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(v) => <span className="text-xs">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-sm">
                <Row label="Total goals" value={stats.total} />
                <Row label="Completed" value={stats.completed} tone="text-success" />
                <Row label="Pending" value={stats.pending} tone="text-warning" />
                <Row label="Overdue" value={stats.overdue} tone="text-destructive" />
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Completion rate</span>
                    <span>{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Weekly */}
            <SectionCard title="Weekly chart" description="Created vs completed this week">
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                    <Bar dataKey="created" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </SectionCard>

            {/* Monthly */}
            <SectionCard title="Monthly chart" description="Last 6 months trend">
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" formatter={(v) => <span className="text-xs">{v}</span>} />
                    <Line type="monotone" dataKey="created" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
            </SectionCard>
          </div>

          {/* Category */}
          <SectionCard title="Category chart" description="Goals by category">
            <ChartBox>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categories}
                  layout="vertical"
                  margin={{ left: 20, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tickFormatter={(v) => categoryMeta(v as any).label}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    formatter={(v: any, n: any) => [v, 'Count']}
                    labelFormatter={(v) => categoryMeta(v as any).label}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categories.map((c) => (
                      <Cell key={c.category} fill={categoryMeta(c.category as Goal['category']).color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </SectionCard>

          {/* Category legend */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <span key={c.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChartBox({ children }: { children: React.ReactNode }) {
  return <div className="h-72 w-full">{children}</div>;
}

function Row({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${tone ?? ''}`}>{value}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="text-muted-foreground">
          {p.name ?? p.dataKey}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}
