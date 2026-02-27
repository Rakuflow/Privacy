import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div 
      className={`relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}
      style={{
        boxShadow: "0 8px 32px 0 rgba(139, 92, 246, 0.1)"
      }}
    >
      {children}
    </div>
  );
}
