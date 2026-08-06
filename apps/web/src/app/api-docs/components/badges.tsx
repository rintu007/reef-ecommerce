import type { AuthLevel } from "@/lib/api-catalog";
import { Globe, Lock, ShieldCheck, Cog } from "lucide-react";

export const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  POST: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  PATCH: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  DELETE: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export function MethodBadge({ method, size = "sm" }: { method: string; size?: "sm" | "lg" }) {
  const sizeCls = size === "lg" ? "text-xs px-2.5 py-1" : "text-[10px] px-1.5 py-0.5";
  return <span className={`font-bold rounded ${sizeCls} ${METHOD_STYLES[method] ?? "bg-slate-100 text-slate-600"}`}>{method}</span>;
}

const AUTH_META: Record<AuthLevel, { label: string; className: string; icon: typeof Globe }> = {
  public: { label: "Public", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", icon: Globe },
  user: { label: "Signed-in user", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", icon: Lock },
  admin: { label: "Admin only", className: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", icon: ShieldCheck },
  internal: { label: "Internal only", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200", icon: Cog },
};

export function AuthBadge({ auth }: { auth: AuthLevel }) {
  const meta = AUTH_META[auth];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${meta.className}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

export function StatusPill({ status }: { status: number }) {
  const tone = status < 300 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status < 500 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-rose-50 text-rose-700 ring-rose-200";
  return <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ring-1 ${tone}`}>{status}</span>;
}
