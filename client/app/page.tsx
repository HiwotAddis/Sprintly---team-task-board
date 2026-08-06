"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  Kanban,
  Zap,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Lock,
  LayoutGrid,
  MousePointerClick,
  Activity,
  Cpu,
  RefreshCw,
  ChevronRight,
  GripVertical,
  Clock,
  ShieldAlert,
  ShieldAlert as ShieldIcon,
} from "lucide-react";

interface MockTask {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  assignee: string;
  column: "todo" | "in_progress" | "done";
}

const INITIAL_MOCK_TASKS: MockTask[] = [
  {
    id: "task-1",
    title: "Implement Socket.io Room Broadcasts",
    tag: "Real-time",
    tagColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    assignee: "Alex M.",
    column: "in_progress",
  },
  {
    id: "task-2",
    title: "Secure httpOnly Refresh Token Cookies",
    tag: "Security",
    tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    assignee: "Hiwot A.",
    column: "done",
  },
  {
    id: "task-3",
    title: "Touch Drag & Drop with dnd-kit",
    tag: "Mobile UI",
    tagColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    assignee: "Sarah K.",
    column: "todo",
  },
  {
    id: "task-4",
    title: "Redis Board Cache Invalidation Layer",
    tag: "Backend",
    tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    assignee: "Alex M.",
    column: "done",
  },
];

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<MockTask[]>(INITIAL_MOCK_TASKS);
  const [activeTab, setActiveTab] = useState<"sync" | "security" | "speed">("sync");
  const [copiedNotification, setCopiedNotification] = useState(false);

  const moveTask = (taskId: string, targetCol: "todo" | "in_progress" | "done") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetCol } : t))
    );
  };

  const getColTasks = (col: "todo" | "in_progress" | "done") =>
    tasks.filter((t) => t.column === col);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative">
      {/* Background Decorative Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 left-[-200px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="fixed bottom-10 right-[-100px] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Kanban className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Sprintly
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest -mt-1">
                Task Engine
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Live Preview
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <a href="#tech" className="hover:text-white transition-colors">
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/workspaces"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                <span>Go to Workspaces</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95 border border-indigo-400/30"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 shadow-xl backdrop-blur-md animate-float">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span>Real-time Team Task Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">Socket.io + Redis</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.15] text-balance">
          Collaborate at the{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            speed of thought.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl font-normal leading-relaxed text-balance">
          Sprintly delivers instantaneous multi-client task synchronization, fluid touch drag-and-drop boards, and bank-grade token security built for modern engineering teams.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-base transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 border border-indigo-400/30"
          >
            <span>Start Building for Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-2xl text-base border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md"
          >
            <MousePointerClick className="w-5 h-5 text-indigo-400" />
            <span>Try Interactive Demo</span>
          </a>
        </div>

        {/* Metrics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-2xl">
              <Zap className="w-5 h-5" />
              <span>&lt; 10ms</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 font-medium">Socket Latency</span>
          </div>
          <div className="flex flex-col items-center border-l border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-2xl">
              <ShieldCheck className="w-5 h-5" />
              <span>httpOnly</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 font-medium">Cookie Security</span>
          </div>
          <div className="flex flex-col items-center border-l border-slate-800">
            <div className="flex items-center gap-1.5 text-violet-400 font-bold text-2xl">
              <Cpu className="w-5 h-5" />
              <span>Redis</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 font-medium">Cached Board State</span>
          </div>
          <div className="flex flex-col items-center border-l border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-2xl">
              <Activity className="w-5 h-5" />
              <span>100%</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 font-medium">Real-Time Sync</span>
          </div>
        </div>
      </section>

      {/* Interactive Board Preview Section */}
      <section id="demo" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <MousePointerClick className="w-4 h-4" />
            Interactive Playground
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Experience real-time task movement
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
            Click the quick action buttons on any card to move tasks across columns in this live playground.
          </p>
        </div>

        {/* Mock Board Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden animate-float-slow">
          {/* Mock Board Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-500 ml-2">sprintly-live-demo.app</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Socket Room: board-demo-99</span>
            </div>
          </div>

          {/* 3 Mock Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: TODO */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  📋 To Do ({getColTasks("todo").length})
                </span>
              </div>
              {getColTasks("todo").map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-all shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${task.tagColor}`}>
                      {task.tag}
                    </span>
                    <div className="text-xs text-slate-500 font-medium">{task.assignee}</div>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{task.title}</h4>
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => moveTask(task.id, "in_progress")}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-semibold rounded-lg border border-indigo-500/30 flex items-center gap-1 transition-colors"
                    >
                      Start <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2: IN PROGRESS */}
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-3 relative shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  ⚡ In Progress ({getColTasks("in_progress").length})
                </span>
              </div>
              {getColTasks("in_progress").map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${task.tagColor}`}>
                      {task.tag}
                    </span>
                    <div className="text-xs text-slate-500 font-medium">{task.assignee}</div>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => moveTask(task.id, "todo")}
                      className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => moveTask(task.id, "done")}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition-colors"
                    >
                      Complete ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3: DONE */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ✅ Completed ({getColTasks("done").length})
                </span>
              </div>
              {getColTasks("done").map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 opacity-90 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${task.tagColor}`}>
                      {task.tag}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300 line-through decoration-slate-600">
                    {task.title}
                  </h4>
                  <div className="flex items-center justify-start pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => moveTask(task.id, "in_progress")}
                      className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      Reopen Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Engineered for Performance
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2">
            Everything your team needs to move fast
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mt-4">
            Built from the ground up using industry-standard tech stack for instantaneous feedback and security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Socket.io Room Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every board room is connected via Socket.io websockets. Any task creation, movement, or edit is broadcasted to all connected team members instantly.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">In-Memory + httpOnly Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Access tokens remain strictly in React memory to prevent XSS exfiltration. Refresh tokens are secured in `httpOnly` cookies with automatic silent renewal.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">dnd-kit Touch Gestures</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fully responsive drag-and-drop using `@dnd-kit`. Smooth mouse interactions on desktop and touch hold sensors for mobile smartphones.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Redis Board Caching</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Board layouts and task structures are cached in Redis to deliver ultra-fast responses and lighten database load during high concurrency.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Workspace Access Control</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Invite members by email to your workspace. Roles (Owner / Member) are verified on every API request and socket room join.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Axios Silent Refresh Queue</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              On 401 response, Axios interceptors silently issue `/auth/refresh`, renew access token, and retry the original request without disrupting the user.
            </p>
          </div>
        </div>
      </section>

      {/* Security Architecture Comparison */}
      <section id="security" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              Security Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why we never store access tokens in localStorage
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Standard web apps store tokens in `localStorage`, making them vulnerable to XSS exfiltration. Sprintly uses a multi-layered security model.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Insecure Way */}
            <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-4">
                <ShieldAlert className="w-5 h-5" />
                <span>Standard App (localStorage) — Vulnerable</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>`localStorage.getItem("token")` is accessible by any JS on the page.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>XSS scripts can steal tokens and exfiltrate them to malicious servers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Attacker gets long-term persistent access until token expiry.</span>
                </li>
              </ul>
            </div>

            {/* Sprintly's Secure Way */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                <ShieldCheck className="w-5 h-5" />
                <span>Sprintly Model — Bank-Grade Security</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>**Access Token**: Kept in React state memory (inaccessible via DOM).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>**Refresh Token**: Secured in `httpOnly` cookie (JS cannot read it).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Axios interceptor silently renews expired tokens on 401 response.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-r from-indigo-900/80 via-violet-900/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight relative z-10">
            Ready to supercharge your team's workflow?
          </h2>
          <p className="mt-4 text-slate-300 text-base max-w-xl mx-auto relative z-10">
            Sign up in 10 seconds and start collaborating on real-time task boards today.
          </p>
          <div className="mt-8 flex justify-center relative z-10">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl text-base hover:bg-slate-100 transition-all shadow-2xl shadow-white/10 hover:scale-105 active:scale-95"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-10 relative z-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Kanban className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">Sprintly</span>
            <span>— Real-time Team Task Board</span>
          </div>
          <p>© {new Date().getFullYear()} Sprintly Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
