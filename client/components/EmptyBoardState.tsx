import React from "react";
import { LayoutList, Plus } from "lucide-react";

interface EmptyBoardStateProps {
  onAddColumn: () => void;
}

export const EmptyBoardState: React.FC<EmptyBoardStateProps> = ({ onAddColumn }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30 max-w-xl mx-auto my-8">
      <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
        <LayoutList className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">This board is empty</h3>
      <p className="text-slate-400 text-sm max-w-sm mb-6">
        Get started by creating your first column (e.g., Todo, In Progress, Done) to manage team tasks.
      </p>
      <button
        onClick={onAddColumn}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
      >
        <Plus className="w-4 h-4" />
        Create First Column
      </button>
    </div>
  );
};
