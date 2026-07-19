'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'success' | 'warning' | 'destructive';
  delay?: number;
}

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </motion.div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
