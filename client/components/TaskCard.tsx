"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Trash2, GripVertical } from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  position: number;
  status: string;
  dueDate: string | null;
  assigneeId: string | null;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: TaskItem;
  onDeleteTask: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDeleteTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-slate-900 border ${
        isDragging ? "border-indigo-500 shadow-2xl shadow-indigo-500/20" : "border-slate-800/80 hover:border-slate-700"
      } rounded-xl p-3.5 transition-all flex flex-col gap-2 relative touch-action-none select-none`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-0.5"
            title="Drag task"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-2">
            {task.title}
          </h4>
        </div>
        <button
          onClick={() => onDeleteTask(task.id)}
          className="text-slate-600 hover:text-red-400 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 pl-6">{task.description}</p>
      )}

      {formattedDate && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-6 mt-1">
          <Calendar className="w-3 h-3 text-indigo-400" />
          <span>{formattedDate}</span>
        </div>
      )}
    </div>
  );
};
