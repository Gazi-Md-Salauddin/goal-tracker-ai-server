'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import type { Goal, GoalCategory, Priority } from '@/lib/types';
import {
  CATEGORIES,
  categoryMeta,
  formatDate,
  isOverdue,
  priorityMeta,
} from '@/lib/goal-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GoalFormDialog, GoalBreakdownButton } from '@/components/goal-form-dialog';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'completed' | 'overdue';

export default function GoalsPage() {
  const qc = useQueryClient();
  const goalsQuery = useQuery<Goal[]>({ queryKey: ['goals'], queryFn: () => api.listGoals() });
  const goals = (goalsQuery.data ?? []) as Goal[];
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('all');
  const [category, setCategory] = React.useState<GoalCategory | 'all'>('all');
  const [priority, setPriority] = React.useState<Priority | 'all'>('all');

  const filtered = goals.filter((g) => {
    if (query && !g.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (category !== 'all' && g.category !== category) return false;
    if (priority !== 'all' && g.priority !== priority) return false;
    if (filter === 'active' && g.completed) return false;
    if (filter === 'completed' && !g.completed) return false;
    if (filter === 'overdue' && !isOverdue(g)) return false;
    return true;
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      toast.success('Goal deleted');
    },
  });
  const complete = useMutation({
    mutationFn: (id: string) => api.updateGoal(id, { completed: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Goal completed');
    },
  });
  const toggleSub = useMutation({
    mutationFn: ({ id, subId }: { id: string; subId: string }) =>
      api.updateGoal(id, { toggleSubTask: subId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Goals</h1>
          <p className="text-muted-foreground">Create, track, and complete your goals.</p>
        </div>
        <GoalFormDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New goal
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All goals</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {goalsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Target className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No goals found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting filters or create a new goal.
            </p>
          </div>
          <GoalFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((g) => (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: categoryMeta(g.category).color }}
                      />
                      <h3
                        className={cn(
                          'font-medium',
                          g.completed && 'text-muted-foreground line-through'
                        )}
                      >
                        {g.title}
                      </h3>
                      {g.completed && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" /> Done
                        </Badge>
                      )}
                      {isOverdue(g) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </Badge>
                      )}
                    </div>
                    {g.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(g.deadline)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: priorityMeta(g.priority).color }}
                        />
                        {priorityMeta(g.priority).label} priority
                      </span>
                      <span>{categoryMeta(g.category).label}</span>
                    </div>

                    {g.subTasks.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {g.subTasks.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => toggleSub.mutate({ id: g.id, subId: s.id })}
                            className="flex w-full items-center gap-2 text-left text-sm"
                          >
                            <span
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded border',
                                s.done
                                  ? 'border-success bg-success text-success-foreground'
                                  : 'border-border'
                              )}
                            >
                              {s.done && <Check className="h-3 w-3" />}
                            </span>
                            <span
                              className={cn(
                                s.done && 'text-muted-foreground line-through'
                              )}
                            >
                              {s.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-3 lg:w-64">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium text-foreground">{g.progress}%</span>
                      </div>
                      <Progress value={g.progress} className="h-2" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!g.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => complete.mutate(g.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
                        </Button>
                      )}
                      <GoalBreakdownButton goalId={g.id} />
                      <GoalFormDialog
                        goal={g}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The goal "{g.title}" will be
                              permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => del.mutate(g.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
