'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  LineChart,
  Sparkles,
  Target,
  Bell,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

const features = [
  {
    icon: Target,
    title: 'Goal Management',
    desc: 'Create goals with categories, priorities, deadlines, and sub-tasks. Track progress at a glance.',
  },
  {
    icon: LineChart,
    title: 'Deep Analytics',
    desc: 'Weekly and monthly progress charts, category breakdowns, and completion rates powered by Recharts.',
  },
  {
    icon: Sparkles,
    title: 'AI Coaching',
    desc: 'Motivational messages, daily task suggestions, goal breakdowns, and productivity advice — on demand.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Timely nudges when goals are overdue, deadlines approach, or you have been away for a few days.',
  },
  {
    icon: Trophy,
    title: 'Achievement Badges',
    desc: 'Earn badges as you complete goals and build streaks. Celebrate every milestone.',
  },
  {
    icon: Zap,
    title: 'Productivity Score',
    desc: 'A live score that reflects your completion rate, consistency, and momentum across all goals.',
  },
];

const stats = [
  { value: '12k+', label: 'Goals achieved' },
  { value: '94%', label: 'Stay on track' },
  { value: '4.9/5', label: 'User rating' },
  { value: '38%', label: 'More productive' },
];

export default function Home() {
  const { user } = useAuth();
  const dashboard = user ? '/dashboard' : '/login';

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Target className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Goal Buddy AI</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href={dashboard}>Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered accountability for ambitious people
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Achieve every goal with an{' '}
            <span className="gradient-text">AI accountability partner</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Goal Buddy AI helps you set goals, track progress with rich analytics,
            and stay motivated with AI coaching and timely nudges — all in one
            beautifully simple workspace.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="group">
              <Link href={dashboard}>
                {user ? 'Open dashboard' : 'Start for free'}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur"
            >
              <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to follow through
          </h2>
          <p className="mt-3 text-muted-foreground">
            A focused toolkit that turns intentions into measurable progress.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start turning goals into done.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of people who trust Goal Buddy AI to keep them
            accountable every single day.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Get started — it is free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span>Goal Buddy AI</span>
          </div>
          <p>© {new Date().getFullYear()} Goal Buddy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
