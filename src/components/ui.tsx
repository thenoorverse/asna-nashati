import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children, variant = "primary", size = "md", className, ...rest
}: {
  children: ReactNode; variant?: "primary" | "gold" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg"; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] px-5";
  const v = {
    primary: "bg-[#176B61] text-white hover:bg-[#0F4A44] shadow-card",
    gold: "bg-[#E8C58D] text-[#4a3410] hover:brightness-95 shadow-card",
    ghost: "bg-white text-[#176B61] border-2 border-[#176B61]/20 hover:border-[#176B61]",
    danger: "bg-red-600 text-white hover:bg-red-700",
    soft: "bg-[#E6F1EC] text-[#176B61] hover:bg-[#d4e7dc]"
  }[variant];
  const s = { sm: "text-sm min-h-[40px] px-4", md: "text-base", lg: "text-lg min-h-[56px] px-8" }[size];
  return <button className={cn(base, v, s, className)} {...rest}>{children}</button>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-3xl shadow-card border border-black/5 p-5", className)}>{children}</div>;
}

export function Badge({ children, tone = "mint" }: { children: ReactNode; tone?: "mint" | "gold" | "blush" | "gray" }) {
  const tones = {
    mint: "bg-[#E6F1EC] text-[#176B61]",
    gold: "bg-[#F6E8CF] text-[#6b4d14]",
    blush: "bg-[#F5DCE2] text-[#8a2b4a]",
    gray: "bg-gray-100 text-gray-700"
  };
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-bold", tones[tone])}>{children}</span>;
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-bold text-gray-800">
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-sm text-gray-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base min-h-[48px] focus:border-[#176B61] focus:outline-none placeholder:text-gray-400";

export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-[#176B61]/25 bg-[#E6F1EC]/50 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden="true">🌱</div>
      <h3 className="text-xl font-extrabold text-[#176B61]">{title}</h3>
      <p className="max-w-md text-gray-600">{desc}</p>
      {action}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[#176B61] transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
