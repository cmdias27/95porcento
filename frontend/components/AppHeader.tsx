// frontend/components/AppHeader.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogoMark } from "@/components/Logo";
import { useUserContext } from "@/hooks/useUserContext";
import {
  ArrowLeft, LayoutDashboard, Dumbbell, User,
  LogOut, ChevronDown, Menu, X, Zap,
} from "lucide-react";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard",       label: "Início",   icon: LayoutDashboard },
  { href: "/dashboard/modos", label: "Praticar", icon: Dumbbell },
  { href: "/perfil",          label: "Perfil",   icon: User },
];

// ─── Variant types ────────────────────────────────────────────────────────────

type DefaultVariantProps = {
  variant: "default";
  contextPill?: string;
};

type SessionVariantProps = {
  variant: "session";
  tema: string;
  subtitulo?: string;
  onAbandonar: () => void;
  timer?: React.ReactNode;
};

type ReportVariantProps = {
  variant: "report";
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

type AppHeaderProps = DefaultVariantProps | SessionVariantProps | ReportVariantProps;

// ─── Avatar dropdown ──────────────────────────────────────────────────────────

function AvatarMenu({ nome, premium }: { nome: string; premium: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = nome ? nome[0].toUpperCase() : "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shadow-sm">
          {initial}
        </div>
        {premium && (
          <span className="hidden md:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
            <Zap size={9} className="fill-amber-500" /> PRO
          </span>
        )}
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-black text-slate-800 truncate">{nome}</p>
                {premium && <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">Acesso Pro</p>}
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setOpen(false); router.push("/perfil"); }}
                  className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-black flex items-center gap-2 transition-colors"
                >
                  <User size={13} /> Perfil
                </button>
                <button
                  onClick={() => { signOut(auth).then(() => router.push("/")); }}
                  className="w-full px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={13} /> Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function MobileDrawer({ open, onClose, nome, premium, pathname }: {
  open: boolean; onClose: () => void; nome: string; premium: boolean; pathname: string;
}) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black">
                  {nome ? nome[0].toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800">{nome}</p>
                  {premium && <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Pro</p>}
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      active ? "bg-black text-white" : "text-slate-500 hover:bg-slate-50 hover:text-black"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => signOut(auth).then(() => router.push("/"))}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppHeader(props: AppHeaderProps) {
  const { user, nome, premium } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── SESSION variant ──────────────────────────────────────────────────────
  if (props.variant === "session") {
    const { tema, subtitulo, onAbandonar, timer } = props;
    return (
      <header className="w-full px-3 md:px-8 py-3 md:py-3.5 border-b-2 border-black bg-white flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30">
        <button onClick={onAbandonar}
          className="bg-white border-2 border-black rounded-xl px-3 md:px-4 py-2.5 min-h-[44px] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all whitespace-nowrap shrink-0">
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Abandonar</span><span className="sm:hidden">Sair</span>
        </button>
        <div className="text-center flex-1 min-w-0">
          <p className="text-xs md:text-sm font-black text-black truncate">{tema}</p>
          {subtitulo && <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{subtitulo}</p>}
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {timer}
        </div>
      </header>
    );
  }

  // ── REPORT variant ───────────────────────────────────────────────────────
  if (props.variant === "report") {
    const { title, subtitle, actions } = props;
    return (
      <header className="w-full px-4 md:px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors">
            <ArrowLeft size={15} /> Voltar
          </Link>
          {title && (
            <div className="hidden sm:block pl-4 border-l border-slate-200">
              <p className="text-sm font-black text-slate-800 truncate max-w-xs">{title}</p>
              {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    );
  }

  // ── DEFAULT variant ──────────────────────────────────────────────────────
  const { contextPill } = props;

  return (
    <>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nome={nome} premium={premium} pathname={pathname} />

      <header className="w-full h-14 px-4 md:px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-sm">

        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <LogoMark size={96} />
        </div>

        {/* Center: Nav (desktop) */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors ${
                  active ? "text-black" : "text-slate-400 hover:text-black hover:bg-slate-50"
                }`}
              >
                {active && (
                  <motion.div layoutId="nav-active-pill"
                    className="absolute inset-0 bg-slate-100 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: contextPill + CTA + Avatar + Hamburger */}
        <div className="flex items-center gap-2 md:gap-3">
          {contextPill && (
            <span className="hidden lg:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              {contextPill}
            </span>
          )}

          <button
            onClick={() => router.push("/dashboard/modos")}
            className="hidden md:flex items-center gap-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl hover:bg-blue-600 transition-all"
          >
            <Zap size={11} className="fill-white" /> Nova sessão
          </button>

          {user && <AvatarMenu nome={nome} premium={premium} />}

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-black transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

      </header>
    </>
  );
}
