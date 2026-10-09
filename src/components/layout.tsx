"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PenSquare, Library, BarChart3, Settings, Sparkles, Home, Menu, X, Play, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/store";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="أصنع نشاطي — الرئيسية">
      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#176B61] shadow-card">
        <svg viewBox="0 0 32 32" className="h-7 w-7">
          <rect x="6" y="6" width="9" height="9" rx="3" fill="#E8C58D" />
          <circle cx="21" cy="10" r="4.5" fill="#F5DCE2" />
          <path d="M6 22 L13 15 L18 20 L26 11" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="11" r="2.4" fill="#fff" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold text-[#176B61]">أصنع نشاطي</span>
          <span className="block text-xs font-bold text-[#8a6d2b]">أبدع • صمّم • علّم • قيّم</span>
        </span>
      )}
    </Link>
  );
}

const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/studio", label: "استوديو التصميم", icon: PenSquare },
  { href: "/templates", label: "مكتبة القوالب", icon: Library },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/suggest", label: "اقترحي لي نشاطًا", icon: Sparkles },
  { href: "/login", label: "الدخول", icon: LogIn },
  { href: "/settings", label: "الإعدادات", icon: Settings }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { profile } = useDemo();
  const nav = profile.role === "admin"
    ? [...NAV.slice(0, 5), { href: "/admin", label: "الإدارة", icon: ShieldCheck }, ...NAV.slice(5)]
    : NAV;
  const isHome = path === "/";
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b border-black/5 bg-[#F7F5EF]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-bold",
                  path === n.href ? "bg-[#176B61] text-white" : "text-gray-700 hover:bg-[#E6F1EC]"
                )}
                aria-current={path === n.href ? "page" : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!isHome && (
              <Link href="/studio" className="hidden rounded-2xl bg-[#E8C58D] px-4 py-2.5 text-sm font-extrabold text-[#4a3410] sm:inline-flex">
                + نشاط جديد
              </Link>
            )}
            <button
              className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-black/5 bg-white px-4 py-3 lg:hidden" aria-label="قائمة الجوال">
            <ul className="grid gap-1">
              {nav.map((n) => {
                const Icon = n.icon;
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 font-bold",
                        path === n.href ? "bg-[#176B61] text-white" : "bg-[#F7F5EF] text-gray-800"
                      )}
                    >
                      <Icon size={20} aria-hidden="true" /> {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="no-print mt-10 border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:text-right">
          <p className="font-bold text-[#176B61]">أصنع نشاطي — كل مهارة تستحق نشاطًا يناسبها</p>
          <p className="text-sm text-gray-600">تصميم وإشراف: أ/ عائشة البحيري</p>
        </div>
      </footer>
    </div>
  );
}

export function PlayBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[#F6E8CF] px-4 py-3 text-sm font-bold text-[#6b4d14]">
      <Play size={18} aria-hidden="true" /> وضع الطالبة: سؤال واحد في كل خطوة، بدون حد زمني.
    </div>
  );
}
