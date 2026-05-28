interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
}

const badgeVariants = {
  default: 'bg-slate-700 text-slate-300',
  primary: 'bg-indigo-500/20 text-indigo-300',
  accent: 'bg-cyan-500/20 text-cyan-300',
  success: 'bg-green-500/20 text-green-300',
  warning: 'bg-amber-500/20 text-amber-300',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]}`}
    >
      {label}
    </span>
  );
}
