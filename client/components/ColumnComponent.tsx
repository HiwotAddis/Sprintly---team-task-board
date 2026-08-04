"use client";

import React, { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard, type TaskItem } from "./TaskCard";
import { Plus, Trash2, GripHorizontal, Check, X } from "lucide-react";

export interface ColumnItem {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskItem[];
}

interface ColumnComponentProps {
  column: ColumnItem;
  onAddTask: (columnId: string, title: string, description?: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  onAddTask,
  onDeleteColumn,
  onDeleteTask,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "Column", column } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask(column.id, taskTitle.trim(), taskDesc.trim() || undefined);
    setTaskTitle("");
    setTaskDesc("");
    setIsAddingTask(false);
  };

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-80 flex-shrink-0 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-12rem)] backdrop-blur-md"
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-1"
            title="Drag column"
          >
            <GripHorizontal className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wide">
            {column.name}
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {column.tasks.length}
          </span>
        </div>

        <button
          onClick={() => onDeleteColumn(column.id)}
          className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Delete column"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[100px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDeleteTask={onDeleteTask} />
          ))}
        </SortableContext>
      </div>

      {/* Add Task Footer */}
      <div className="p-3 border-t border-slate-800/80">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="flex flex-col gap-2">
            <input
              type="text"
              autoFocus
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
};
