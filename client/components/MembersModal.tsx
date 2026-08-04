"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { Users, UserPlus, X, Shield, User as UserIcon, AlertCircle } from "lucide-react";

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "owner" | "member";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface MembersModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "owner">("member");
  const [error, setError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data.members || []);
    } catch {
      setError("Failed to load workspace members.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchMembers();
    }
  }, [isOpen, workspaceId, fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSuccessMsg(null);
    setIsInviting(true);

    try {
      await api.post(`/workspaces/${workspaceId}/members`, {
        email: email.trim(),
        role,
      });
      setSuccessMsg(`Successfully added ${email} to workspace!`);
      setEmail("");
      fetchMembers();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        setError(res?.data?.message || "Failed to add member. Make sure the user exists.");
      } else {
        setError("Failed to add member.");
      }
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Workspace Members</h3>
              <p className="text-xs text-slate-400">Manage access for multi-client testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form: Add Member */}
        <form onSubmit={handleAddMember} className="py-4 border-b border-slate-800 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Invite Member by Email
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "owner")}
              className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="submit"
              disabled={isInviting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
              {successMsg}
            </div>
          )}
        </form>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Current Members ({members.length})
          </h4>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm animate-pulse">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">No members found.</div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-semibold">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {m.user.name || m.user.email}
                    </div>
                    <div className="text-xs text-slate-400">{m.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  {m.role === "owner" ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : null}
                  <span className="capitalize">{m.role}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
