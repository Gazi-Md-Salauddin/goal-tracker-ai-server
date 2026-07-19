'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ListChecks,
  Loader2,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { Goal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';

export default function AssistantPage() {
  const qc = useQueryClient();
  const goalsQuery = useQuery<Goal[]>({ queryKey: ['goals'], queryFn: () => api.listGoals() });
  const goals = (goalsQuery.data ?? []) as Goal[];
  const activeGoals = goals.filter((g) => !g.completed);

  const [motivation, setMotivation] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<string[] | null>(null);
  const [advice, setAdvice] = React.useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = React.useState<string>('');

  const motivateMut = useMutation({
    mutationFn: () => api.motivate(),
    onSuccess: (m) => setMotivation(m),
  });
  const tasksMut = useMutation({
    mutationFn: () => api.suggestTasks(selectedGoalId || undefined),
    onSuccess: (t) => setTasks(t),
  });
  const adviceMut = useMutation({
    mutationFn: () => api.advice(),
    onSuccess: (a) => setAdvice(a),
  });
  const breakdownMut = useMutation({
    mutationFn: () => api.breakdown(selectedGoalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Sub-tasks added to your goal');
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AI Assistant</h1>
        <p className="text-muted-foreground">
          Your AI coach for motivation, planning, and productivity advice.
        </p>
      </div>

      {/* Hero coach */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-medium">Goal Buddy Coach</h2>
              <p className="text-sm text-muted-foreground">
                Ask for a motivational nudge whenever you need one.
              </p>
            </div>
          </div>
          <Button onClick={() => motivateMut.mutate()} disabled={motivateMut.isPending}>
            {motivateMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Motivate me
          </Button>
        </div>
        {motivation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
          >
            {motivation}
          </motion.div>
        )}
      </div>

      {/* Goal selector */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-primary" /> Focus goal
        </div>
        <Select
          value={selectedGoalId}
          onValueChange={setSelectedGoalId}
        >
          <SelectTrigger className="sm:w-80">
            <SelectValue placeholder={activeGoals.length ? 'Select a goal' : 'No active goals'} />
          </SelectTrigger>
          <SelectContent>
            {activeGoals.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tools */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily tasks */}
        <SectionCard
          title="Suggest daily tasks"
          description="AI proposes concrete next actions."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => tasksMut.mutate()}
              disabled={tasksMut.isPending || activeGoals.length === 0}
            >
              {tasksMut.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ListChecks className="mr-1 h-3.5 w-3.5" />
              )}
              Generate
            </Button>
          }
        >
          {!tasks ? (
            <Empty text="Click Generate to get tailored daily tasks." />
          ) : (
            <ul className="space-y-2">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Breakdown */}
        <SectionCard
          title="Break down a goal"
          description="AI adds sub-tasks to your selected goal."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => breakdownMut.mutate()}
              disabled={breakdownMut.isPending || !selectedGoalId}
            >
              {breakdownMut.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Target className="mr-1 h-3.5 w-3.5" />
              )}
              Break down
            </Button>
          }
        >
          {!selectedGoalId ? (
            <Empty text="Select a focus goal above to break it down." />
          ) : (
            <div className="text-sm text-muted-foreground">
              AI will append sub-tasks to{' '}
              <span className="font-medium text-foreground">
                {goals.find((g) => g.id === selectedGoalId)?.title}
              </span>{' '}
              and update its progress automatically.
            </div>
          )}
        </SectionCard>

        {/* Advice */}
        <SectionCard
          title="Productivity advice"
          description="A focused tip based on your current workload."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => adviceMut.mutate()}
              disabled={adviceMut.isPending}
            >
              {adviceMut.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
              )}
              Advise
            </Button>
          }
          className="lg:col-span-2"
        >
          {!advice ? (
            <Empty text="Click Advise to get a productivity tip." />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
            >
              {advice}
            </motion.div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground')}>
      {text}
    </div>
  );
}
