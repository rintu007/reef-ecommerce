import Link from "next/link";

/** Wordmark: a wave-in-a-drop mark plus the serif name. `tone` picks ink-on-light or white-on-dark. */
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-white" : "text-ink";
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${color}`} aria-label="Reef Market home">
      <svg viewBox="0 0 32 32" className="w-8 h-8 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[-8deg]" aria-hidden>
        <circle cx="16" cy="16" r="15" className="fill-blue-600" />
        <path d="M5 18c2.5-2.4 5-2.4 7.5 0s5 2.4 7.5 0 5-2.4 7 0" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M8 23c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 5 0" fill="none" stroke="var(--color-lagoon)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="21" cy="10" r="2.2" className="fill-coral" />
      </svg>
      <span className="font-display text-[1.6rem] leading-none tracking-tight">
        Reef <em className="italic">Market</em>
      </span>
    </Link>
  );
}
