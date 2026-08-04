import React from "react";

export const LoadingSkeleton: React.FC<{ message?: string }> = ({
  message = "Loading Sprintly board...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  );
};

export const BoardSkeleton: React.FC = () => {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 p-4">
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          className="w-80 flex-shrink-0 bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse flex flex-col gap-3"
        >
          <div className="h-6 w-32 bg-slate-800 rounded-md"></div>
          <div className="h-24 bg-slate-800/60 rounded-lg"></div>
          <div className="h-20 bg-slate-800/60 rounded-lg"></div>
          <div className="h-28 bg-slate-800/60 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};
