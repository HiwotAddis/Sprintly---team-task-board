"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../../components/Navbar";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ErrorState } from "../../components/ErrorState";
import { api } from "../../lib/api";
import { Plus, Layout, FolderPlus, ArrowRight, ChevronRight, Layers, Users } from "lucide-react";
import { MembersModal } from "../../components/MembersModal";

interface Board {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  boards?: Board[];
}

export default function WorkspacesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals / Inputs
  const [newWsName, setNewWsName] = useState("");
  const [showWsModal, setShowWsModal] = useState(false);
  const [activeWsForBoard, setActiveWsForBoard] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [membersModalWsId, setMembersModalWsId] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/workspaces");
      const wsList: Workspace[] = res.data.workspaces || [];

      // Fetch boards for each workspace
      const withBoards = await Promise.all(
        wsList.map(async (ws) => {
          try {
            const boardRes = await api.get(`/workspaces/${ws.id}/boards`);
            return { ...ws, boards: boardRes.data.boards || [] };
          } catch {
            return { ...ws, boards: [] };
          }
        })
      );

      setWorkspaces(withBoards);
    } catch {
      setError("Failed to load workspaces. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchWorkspaces();
      }
    }
  }, [user, authLoading, router, fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const res = await api.post("/workspaces", { name: newWsName.trim() });
      const created = res.data.workspace;
      setWorkspaces((prev) => [...prev, { ...created, boards: [] }]);
      setNewWsName("");
      setShowWsModal(false);
    } catch (err: unknown) {
      alert("Failed to create workspace.");
    }
  };

  const handleCreateBoard = async (workspaceId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards`, {
        name: newBoardName.trim(),
      });
      const createdBoard = res.data.board;

      setWorkspaces((prev) =>
        prev.map((ws) => {
          if (ws.id === workspaceId) {
            return { ...ws, boards: [...(ws.boards || []), createdBoard] };
          }
          return ws;
        })
      );

      setNewBoardName("");
      setActiveWsForBoard(null);
    } catch {
      alert("Failed to create board.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <LoadingSkeleton message="Loading your workspaces..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <ErrorState message={error} onRetry={fetchWorkspaces} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Workspaces</h1>
            <p className="text-slate-400 text-sm mt-1">
              Select a task board or create a new workspace to organize your team.
            </p>
          </div>
          <button
            onClick={() => setShowWsModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            New Workspace
          </button>
        </div>

        {/* Workspace List */}
        {workspaces.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 my-8">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Workspaces Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Create your first workspace to start collaborating on real-time task boards.
            </p>
            <button
              onClick={() => setShowWsModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{ws.name}</h2>
                      <span className="text-xs text-slate-400">
                        {ws.boards?.length || 0} Board(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMembersModalWsId(ws.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Members
                    </button>
                    <button
                      onClick={() => setActiveWsForBoard(ws.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Board
                    </button>
                  </div>
                </div>

                {/* Boards Grid */}
                {ws.boards && ws.boards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ws.boards.map((board) => (
                      <Link
                        key={board.id}
                        href={`/workspaces/${ws.id}/boards/${board.id}`}
                        className="group bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <Layout className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                              {board.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                          <span>View Board</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic py-2">
                    No boards in this workspace yet. Click &quot;New Board&quot; to create one.
                  </p>
                )}

                {/* Inline New Board Form Modal */}
                {activeWsForBoard === ws.id && (
                  <form
                    onSubmit={(e) => handleCreateBoard(ws.id, e)}
                    className="mt-4 p-4 bg-slate-950 border border-indigo-500/40 rounded-xl flex items-center gap-3"
                  >
                    <input
                      type="text"
                      autoFocus
                      required
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="Board name (e.g. Sprint 24)"
                      className="flex-1 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWsForBoard(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Workspace Modal */}
      {showWsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Create Workspace</h3>
            <p className="text-slate-400 text-sm mb-6">
              Group your boards and team members under a new workspace.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Engineering Team"
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWsModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {membersModalWsId && (
        <MembersModal
          workspaceId={membersModalWsId}
          isOpen={!!membersModalWsId}
          onClose={() => setMembersModalWsId(null)}
        />
      )}
    </div>
  );
}
