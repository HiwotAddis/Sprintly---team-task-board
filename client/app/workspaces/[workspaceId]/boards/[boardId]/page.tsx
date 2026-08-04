"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { LoadingSkeleton, BoardSkeleton } from "@/components/LoadingSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyBoardState } from "@/components/EmptyBoardState";
import { ColumnComponent, type ColumnItem } from "@/components/ColumnComponent";
import { TaskCard, type TaskItem } from "@/components/TaskCard";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { Plus, ArrowLeft, RefreshCw, Layout, Users } from "lucide-react";
import Link from "next/link";
import { MembersModal } from "@/components/MembersModal";

interface BoardDetail {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  columns: ColumnItem[];
}

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; boardId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId, boardId } = resolvedParams;

  const { user, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag Overlay State
  const [activeColumn, setActiveColumn] = useState<ColumnItem | null>(null);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  // New Column & Members Modal / Input
  const [newColName, setNewColName] = useState("");
  const [showColModal, setShowColModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Configure Sensors for both Desktop (Mouse) and Mobile (Touch)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBoardDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/boards/${boardId}`);
      setBoard(res.data.board);
    } catch {
      setError("Failed to load board details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, boardId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchBoardDetail();
      }
    }
  }, [user, authLoading, router, fetchBoardDetail]);

  // Real-time Socket.io Sync
  useEffect(() => {
    if (!accessToken || !boardId) return;

    const socket = getSocket(accessToken);

    const joinRoom = () => {
      socket.emit("board:join", { boardId }, (ack: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          console.error("Failed to join real-time board room:", ack?.error);
        }
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    // Socket Event Listeners
    socket.on("task:created", ({ task }: { boardId: string; task: TaskItem }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === task.columnId) {
              const exists = col.tasks.some((t) => t.id === task.id);
              if (exists) return col;
              return { ...col, tasks: [...col.tasks, task] };
            }
            return col;
          }),
        };
      });
    });

    socket.on("task:updated", ({ task }: { boardId: string; task: TaskItem }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            // Remove task if it moved away from this column
            const updatedTasks = col.tasks
              .filter((t) => t.id !== task.id)
              .concat(col.id === task.columnId ? [task] : [])
              .sort((a, b) => a.position - b.position);

            return { ...col, tasks: updatedTasks };
          }),
        };
      });
    });

    socket.on("task:deleted", ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === columnId) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
            }
            return col;
          }),
        };
      });
    });

    return () => {
      socket.emit("board:leave", { boardId });
      socket.off("connect", joinRoom);
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
    };
  }, [accessToken, boardId]);

  // Column Actions
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !board) return;

    try {
      const res = await api.post(`/workspaces/${workspaceId}/boards/${boardId}/columns`, {
        name: newColName.trim(),
        position: board.columns.length,
      });
      const newCol: ColumnItem = { ...res.data.column, tasks: [] };
      setBoard((prev) => (prev ? { ...prev, columns: [...prev.columns, newCol] } : null));
      setNewColName("");
      setShowColModal(false);
    } catch {
      alert("Failed to create column.");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Are you sure you want to delete this column and all its tasks?")) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`);
      setBoard((prev) =>
        prev
          ? { ...prev, columns: prev.columns.filter((col) => col.id !== columnId) }
          : null
      );
    } catch {
      alert("Failed to delete column.");
    }
  };

  // Task Actions
  const handleAddTask = async (columnId: string, title: string, description?: string) => {
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks`,
        { title, description }
      );
      const createdTask: TaskItem = res.data.task;

      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === columnId ? { ...col, tasks: [...col.tasks, createdTask] } : col
          ),
        };
      });
    } catch {
      alert("Failed to create task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setBoard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          })),
        };
      });
    } catch {
      alert("Failed to delete task.");
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "Column") {
      setActiveColumn(active.data.current?.column || null);
    } else if (type === "Task") {
      setActiveTask(active.data.current?.task || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (!isActiveTask) return;

    // Moving task over another task in a different column
    if (isActiveTask && isOverTask) {
      setBoard((prev) => {
        if (!prev) return null;

        let activeCol: ColumnItem | undefined;
        let overCol: ColumnItem | undefined;

        prev.columns.forEach((col) => {
          if (col.tasks.some((t) => t.id === activeId)) activeCol = col;
          if (col.tasks.some((t) => t.id === overId)) overCol = col;
        });

        if (!activeCol || !overCol || activeCol.id === overCol.id) return prev;

        const activeTaskIndex = activeCol.tasks.findIndex((t) => t.id === activeId);
        const overTaskIndex = overCol.tasks.findIndex((t) => t.id === overId);

        const movedTask = { ...activeCol.tasks[activeTaskIndex], columnId: overCol.id };

        const newActiveTasks = activeCol.tasks.filter((t) => t.id !== activeId);
        const newOverTasks = [...overCol.tasks];
        newOverTasks.splice(overTaskIndex, 0, movedTask);

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === activeCol!.id) return { ...col, tasks: newActiveTasks };
            if (col.id === overCol!.id) return { ...col, tasks: newOverTasks };
            return col;
          }),
        };
      });
    }

    // Moving task over an empty column container
    const isOverColumn = over.data.current?.type === "Column";
    if (isActiveTask && isOverColumn) {
      setBoard((prev) => {
        if (!prev) return null;

        const activeCol = prev.columns.find((col) =>
          col.tasks.some((t) => t.id === activeId)
        );
        const overCol = prev.columns.find((col) => col.id === overId);

        if (!activeCol || !overCol || activeCol.id === overCol.id) return prev;

        const activeTaskObj = activeCol.tasks.find((t) => t.id === activeId)!;
        const movedTask = { ...activeTaskObj, columnId: overCol.id };

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === activeCol.id) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
            }
            if (col.id === overCol.id) {
              return { ...col, tasks: [...col.tasks, movedTask] };
            }
            return col;
          }),
        };
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id;
    const overId = over.id;

    // Column Drag Reordering
    if (active.data.current?.type === "Column") {
      if (activeId !== overId) {
        const oldIndex = board.columns.findIndex((c) => c.id === activeId);
        const newIndex = board.columns.findIndex((c) => c.id === overId);

        const newColumns = arrayMove(board.columns, oldIndex, newIndex).map((col, idx) => ({
          ...col,
          position: idx,
        }));

        setBoard({ ...board, columns: newColumns });

        // Update backend column position
        try {
          await api.patch(
            `/workspaces/${workspaceId}/boards/${boardId}/columns/${activeId}`,
            { position: newIndex }
          );
        } catch {
          fetchBoardDetail();
        }
      }
      return;
    }

    // Task Drag Reordering / Moving
    if (active.data.current?.type === "Task") {
      let targetColumn: ColumnItem | undefined;
      let targetTaskIndex = 0;

      board.columns.forEach((col) => {
        const idx = col.tasks.findIndex((t) => t.id === activeId);
        if (idx !== -1) {
          targetColumn = col;
          targetTaskIndex = idx;
        }
      });

      if (targetColumn) {
        const taskToUpdate = targetColumn.tasks[targetTaskIndex];
        try {
          await api.patch(`/tasks/${taskToUpdate.id}`, {
            columnId: targetColumn.id,
            position: targetTaskIndex,
          });
        } catch {
          fetchBoardDetail();
        }
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <BoardSkeleton />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <ErrorState message={error || "Board not found"} onRetry={fetchBoardDetail} />
      </div>
    );
  }

  const columnIds = board.columns.map((c) => c.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* Board Header Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/workspaces"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Back to workspaces"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <Layout className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">{board.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBoardDetail}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors shadow-sm"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            Members
          </button>
          <button
            onClick={() => setShowColModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
        </div>
      </div>

      {/* Drag & Drop Board Workspace */}
      <div className="flex-1 overflow-x-auto p-6">
        {board.columns.length === 0 ? (
          <EmptyBoardState onAddColumn={() => setShowColModal(true)} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 items-start">
              <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                {board.columns.map((column) => (
                  <ColumnComponent
                    key={column.id}
                    column={column}
                    onAddTask={handleAddTask}
                    onDeleteColumn={handleDeleteColumn}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </SortableContext>
            </div>

            {/* Drag Overlay Preview */}
            <DragOverlay>
              {activeColumn && (
                <ColumnComponent
                  column={activeColumn}
                  onAddTask={handleAddTask}
                  onDeleteColumn={handleDeleteColumn}
                  onDeleteTask={handleDeleteTask}
                />
              )}
              {activeTask && (
                <TaskCard task={activeTask} onDeleteTask={handleDeleteTask} />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* New Column Modal */}
      {showColModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Create New Column</h3>
            <p className="text-slate-400 text-sm mb-6">
              Add a column (e.g. Backlog, In Review, Testing) to organize tasks.
            </p>
            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Column Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. In Progress"
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Create Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      <MembersModal
        workspaceId={workspaceId}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
    </div>
  );
}
