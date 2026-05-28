interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/40 ring-1 ring-slate-700/30">
        <span className="text-3xl text-slate-600">◈</span>
      </div>
      <h3 className="mb-2 text-lg font-medium text-slate-300">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-slate-500 leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-xl bg-indigo-500/10 px-5 py-2.5 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20 hover:ring-indigo-500/30 transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
