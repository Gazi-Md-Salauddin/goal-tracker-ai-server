import type {
  Activity,
  AppNotification,
  Goal,
  GoalCategory,
  NotificationType,
  Priority,
  SubTask,
  User,
} from './types';

const USERS_KEY = 'gb_users';
const SESSION_KEY = 'gb_session';
const GOALS_KEY = 'gb_goals';
const NOTIFS_KEY = 'gb_notifs';
const ACTIVITY_KEY = 'gb_activity';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Simple hash (NOT for production) to avoid storing plaintext in demo
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(h);
}

interface StoredUser extends User {
  passwordHash: string;
}

function getUsers() {
  return read<StoredUser[]>(USERS_KEY, []);
}
function getSession() {
  return read<string | null>(SESSION_KEY, null);
}
function setSession(id: string | null) {
  if (id) write(SESSION_KEY, id);
  else if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}

function logActivity(userId: string, type: Activity['type'], description: string) {
  const acts = read<Activity[]>(ACTIVITY_KEY, []);
  acts.unshift({
    id: uid('act'),
    userId,
    type,
    description,
    createdAt: new Date().toISOString(),
  });
  write(ACTIVITY_KEY, acts.slice(0, 100));
}

export const api = {
  // ---------- AUTH ----------
  async register(name: string, email: string, password: string) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const user: StoredUser = {
      id: uid('usr'),
      name,
      email,
      createdAt: new Date().toISOString(),
      passwordHash: hash(password),
    };
    users.push(user);
    write(USERS_KEY, users);
    setSession(user.id);
    logActivity(user.id, 'login', 'Account created');
    const { passwordHash, ...safe } = user;
    return delay(safe);
  },

  async login(email: string, password: string) {
    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user || user.passwordHash !== hash(password)) {
      throw new Error('Invalid email or password.');
    }
    setSession(user.id);
    logActivity(user.id, 'login', 'Signed in');
    const { passwordHash, ...safe } = user;
    return delay(safe);
  },

  async logout() {
    setSession(null);
    return delay(true);
  },

  async me(): Promise<User | null> {
    const id = getSession();
    if (!id) return delay(null);
    const user = getUsers().find((u) => u.id === id);
    if (!user) return delay(null);
    const { passwordHash, ...safe } = user;
    return delay(safe);
  },

  // ---------- GOALS ----------
  async listGoals(): Promise<Goal[]> {
    const id = getSession();
    if (!id) return delay([]);
    const goals = read<Goal[]>(GOALS_KEY, []).filter((g) => g.userId === id);
    return delay(goals);
  },

  async createGoal(input: {
    title: string;
    description: string;
    category: GoalCategory;
    priority: Priority;
    deadline: string;
    subTasks?: { title: string }[];
  }): Promise<Goal> {
    const id = getSession();
    if (!id) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const subTasks: SubTask[] = (input.subTasks ?? []).map((s) => ({
      id: uid('sub'),
      title: s.title,
      done: false,
    }));
    const goal: Goal = {
      id: uid('goal'),
      userId: id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      deadline: input.deadline,
      progress: 0,
      completed: false,
      subTasks,
      createdAt: now,
      updatedAt: now,
    };
    const goals = read<Goal[]>(GOALS_KEY, []);
    goals.push(goal);
    write(GOALS_KEY, goals);
    logActivity(id, 'created', `Created goal "${goal.title}"`);
    return delay(goal);
  },

  async updateGoal(
    goalId: string,
    patch: Partial<
      Omit<Goal, 'id' | 'userId' | 'createdAt'> & { toggleSubTask?: string }
    >
  ): Promise<Goal> {
    const id = getSession();
    if (!id) throw new Error('Not authenticated');
    const goals = read<Goal[]>(GOALS_KEY, []);
    const idx = goals.findIndex((g) => g.id === goalId && g.userId === id);
    if (idx === -1) throw new Error('Goal not found');
    const { toggleSubTask, ...rest } = patch;
    const goal = goals[idx];
    if (toggleSubTask) {
      goal.subTasks = goal.subTasks.map((s) =>
        s.id === toggleSubTask ? { ...s, done: !s.done } : s
      );
      const done = goal.subTasks.filter((s) => s.done).length;
      goal.progress = goal.subTasks.length
        ? Math.round((done / goal.subTasks.length) * 100)
        : goal.progress;
      goal.completed = goal.progress === 100;
    }
    Object.assign(goal, rest);
    if (rest.progress !== undefined) {
      goal.completed = rest.progress === 100;
    }
    if (rest.completed !== undefined && rest.completed) {
      goal.progress = 100;
    }
    goal.updatedAt = new Date().toISOString();
    goals[idx] = goal;
    write(GOALS_KEY, goals);
    if (goal.completed) {
      logActivity(id, 'completed', `Completed goal "${goal.title}"`);
    } else {
      logActivity(id, 'updated', `Updated goal "${goal.title}"`);
    }
    return delay(goal);
  },

  async deleteGoal(goalId: string): Promise<boolean> {
    const id = getSession();
    if (!id) throw new Error('Not authenticated');
    const goals = read<Goal[]>(GOALS_KEY, []);
    const goal = goals.find((g) => g.id === goalId && g.userId === id);
    const next = goals.filter((g) => g.id !== goalId);
    write(GOALS_KEY, next);
    if (goal) logActivity(id, 'deleted', `Deleted goal "${goal.title}"`);
    return delay(true);
  },

  // ---------- NOTIFICATIONS ----------
  async listNotifications(): Promise<AppNotification[]> {
    const id = getSession();
    if (!id) return delay([]);
    await this.refreshNotifications();
    const notifs = read<AppNotification[]>(NOTIFS_KEY, []).filter(
      (n) => n.userId === id
    );
    return delay(notifs);
  },

  async markNotificationRead(notifId: string) {
    const notifs = read<AppNotification[]>(NOTIFS_KEY, []);
    const next = notifs.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    write(NOTIFS_KEY, next);
    return delay(true);
  },

  async markAllNotificationsRead() {
    const id = getSession();
    const notifs = read<AppNotification[]>(NOTIFS_KEY, []);
    const next = notifs.map((n) =>
      n.userId === id ? { ...n, read: true } : n
    );
    write(NOTIFS_KEY, next);
    return delay(true);
  },

  async refreshNotifications() {
    const id = getSession();
    if (!id) return;
    const goals = read<Goal[]>(GOALS_KEY, []).filter((g) => g.userId === id);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const existing = read<AppNotification[]>(NOTIFS_KEY, []).filter(
      (n) => n.userId === id
    );
    const add = (
      type: NotificationType,
      title: string,
      message: string,
      dedupeKey: string
    ) => {
      if (existing.some((n) => (n as any).dedupeKey === dedupeKey)) return;
      existing.push({
        id: uid('ntf'),
        userId: id!,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
        dedupeKey,
      } as AppNotification);
    };

    for (const g of goals) {
      if (g.completed) continue;
      const dl = new Date(g.deadline);
      const days = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
      if (days < 0) {
        add(
          'overdue',
          'Goal overdue',
          `"${g.title}" passed its deadline ${Math.abs(days)}d ago. Recommit or adjust it.`,
          `overdue_${g.id}_${todayStr}`
        );
      } else if (days <= 2) {
        add(
          'deadline_near',
          'Deadline approaching',
          `"${g.title}" is due in ${days} day(s). Keep the momentum going.`,
          `near_${g.id}_${todayStr}`
        );
      }
      if (g.deadline.slice(0, 10) === todayStr && g.progress < 100) {
        add(
          'incomplete_today',
          "Today's goal incomplete",
          `Finish "${g.title}" today — small steps compound.`,
          `today_${g.id}_${todayStr}`
        );
      }
    }

    const lastActivity = read<Activity[]>(ACTIVITY_KEY, []).find(
      (a) => a.userId === id
    );
    if (lastActivity) {
      const since = Math.ceil(
        (now.getTime() - new Date(lastActivity.createdAt).getTime()) / 86400000
      );
      if (since >= 3) {
        add(
          'inactive',
          'You have been away',
          `It has been ${since} days since your last activity. Reconnect with your goals.`,
          `inactive_${todayStr}`
        );
      }
    }

    const cleaned = existing.map(({ ...n }) => {
      delete (n as any).dedupeKey;
      return n;
    });
    write(NOTIFS_KEY, cleaned);
  },

  // ---------- ACTIVITY ----------
  async listActivity(): Promise<Activity[]> {
    const id = getSession();
    if (!id) return delay([]);
    return delay(
      read<Activity[]>(ACTIVITY_KEY, []).filter((a) => a.userId === id)
    );
  },

  // ---------- AI (rule-based, offline) ----------
  async motivate(): Promise<string> {
    const id = getSession();
    const goals = read<Goal[]>(GOALS_KEY, []).filter((g) => g.userId === id);
    const overdue = goals.filter(
      (g) => !g.completed && new Date(g.deadline) < new Date()
    );
    const completed = goals.filter((g) => g.completed).length;
    const messages = [
      `You have completed ${completed} goal${completed === 1 ? '' : 's'} so far. Consistency is your superpower — show up again today.`,
      `Progress over perfection. Pick one goal and move it 5% forward right now.`,
      `Your future self is built by today's reps. Let's make this one count.`,
      `Discipline equals freedom. One small win unlocks the next.`,
    ];
    let msg = messages[Math.floor(Math.random() * messages.length)];
    if (overdue.length) {
      msg = `You have ${overdue.length} overdue goal${overdue.length === 1 ? '' : 's'}. Forgive the slip, pick the most important one, and take a single concrete step today. ${msg}`;
    }
    return delay(msg, 400);
  },

  async suggestTasks(goalId?: string): Promise<string[]> {
    const id = getSession();
    const goals = read<Goal[]>(GOALS_KEY, []).filter((g) => g.userId === id);
    const target = goalId
      ? goals.find((g) => g.id === goalId)
      : goals.find((g) => !g.completed);
    if (!target) return delay(['Create your first goal to get tailored daily tasks.']);
    const base = [
      `Spend 25 focused minutes on "${target.title}"`,
      `Define the single next action for "${target.title}"`,
      `Review progress on "${target.title}" and adjust the deadline if needed`,
    ];
    return delay(base);
  },

  async breakdown(goalId: string): Promise<SubTask[]> {
    const id = getSession();
    const goals = read<Goal[]>(GOALS_KEY, []);
    const goal = goals.find((g) => g.id === goalId && g.userId === id);
    if (!goal) throw new Error('Goal not found');
    const generic = [
      `Clarify the outcome of "${goal.title}"`,
      `Research what is needed`,
      `Break it into 3 milestones`,
      `Schedule the first milestone`,
      `Track weekly progress`,
      `Review and adjust`,
    ];
    const newSubs: SubTask[] = generic.map((title) => ({
      id: uid('sub'),
      title,
      done: false,
    }));
    goal.subTasks = [...goal.subTasks, ...newSubs];
    write(GOALS_KEY, goals);
    return delay(newSubs, 400);
  },

  async advice(): Promise<string> {
    const id = getSession();
    const goals = read<Goal[]>(GOALS_KEY, []).filter((g) => g.userId === id);
    const active = goals.filter((g) => !g.completed).length;
    const high = goals.filter((g) => g.priority === 'high' && !g.completed).length;
    let tip = 'Time-block your calendar: one 90-min deep work session before noon.';
    if (active > 5) tip = 'You are juggling many goals. Pick a single "daily domino" — the one task that, if done, makes the rest easier.';
    if (high > 2) tip = 'More than two high-priority goals means none are truly high. Demote all but the top two today.';
    return delay(tip, 400);
  },
};
