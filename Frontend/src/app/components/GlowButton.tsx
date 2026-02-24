import { ReactNode, ButtonHTMLAttributes } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function GlowButton({ children, variant = "primary", className = "", ...props }: GlowButtonProps) {
  const baseStyles = "relative px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = variant === "primary"
    ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30"
    : "bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/30";

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {/* Glow effect - always visible but intensifies on hover */}
      {variant === "primary" && (
        <div className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 blur-xl" />
        </div>
      )}
      
      {/* Content - properly centered */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}