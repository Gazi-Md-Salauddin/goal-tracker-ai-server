'use client';

import * as React from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CATEGORIES, PRIORITIES } from '@/lib/goal-utils';
import type { Goal, GoalCategory, Priority } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GoalFormDialogProps {
  trigger: React.ReactNode;
  goal?: Goal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function GoalFormDialog({
  trigger,
  goal,
  open,
  onOpenChange,
}: GoalFormDialogProps) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<GoalCategory>('career');
  const [priority, setPriority] = React.useState<Priority>('medium');
  const [deadline, setDeadline] = React.useState(todayPlus(7));
  const [subTasks, setSubTasks] = React.useState<string[]>(['']);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description);
      setCategory(goal.category);
      setPriority(goal.priority);
      setDeadline(goal.deadline.slice(0, 10));
      setSubTasks(goal.subTasks.length ? goal.subTasks.map((s) => s.title) : ['']);
    } else {
      setTitle('');
      setDescription('');
      setCategory('career');
      setPriority('medium');
      setDeadline(todayPlus(7));
      setSubTasks(['']);
    }
  }, [isOpen, goal]);

  const create = useMutation({
    mutationFn: () =>
      api.createGoal({
        title,
        description,
        category,
        priority,
        deadline: new Date(deadline).toISOString(),
        subTasks: subTasks.filter((s) => s.trim()).map((title) => ({ title })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Goal created');
      setOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: () =>
      api.updateGoal(goal!.id, {
        title,
        description,
        category,
        priority,
        deadline: new Date(deadline).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
      toast.success('Goal updated');
      setOpen(false);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (goal) await update.mutateAsync();
      else await create.mutateAsync();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit goal' : 'Create a new goal'}</DialogTitle>
          <DialogDescription>
            {goal
              ? 'Update the details of your goal.'
              : 'Define what you want to achieve, set a deadline, and break it into sub-tasks.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Ship my portfolio website"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does success look like?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          {!goal && (
            <div className="space-y-2">
              <Label>Sub-tasks (optional)</Label>
              <div className="space-y-2">
                {subTasks.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Sub-task ${i + 1}`}
                      value={s}
                      onChange={(e) => {
                        const next = [...subTasks];
                        next[i] = e.target.value;
                        setSubTasks(next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSubTasks(subTasks.filter((_, idx) => idx !== i))}
                      disabled={subTasks.length === 1}
                      aria-label="Remove sub-task"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubTasks([...subTasks, ''])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add sub-task
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? 'Save changes' : 'Create goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalBreakdownButton({ goalId }: { goalId: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => api.breakdown(goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('AI added sub-tasks to break down this goal');
    },
    onError: () => toast.error('Could not generate a breakdown'),
  });
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
    >
      {mut.isPending ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="mr-1 h-3.5 w-3.5" />
      )}
      AI break down
    </Button>
  );
}
