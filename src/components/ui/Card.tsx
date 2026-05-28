import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-sm ${onClick ? 'cursor-pointer hover:bg-slate-700/40 transition-colors' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
