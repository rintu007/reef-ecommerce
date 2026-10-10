import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/browse?market=saltwater", label: "Saltwater" },
      { href: "/browse?market=freshwater", label: "Freshwater" },
      { href: "/services", label: "Services" },
      { href: "/sell", label: "Start selling" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/learn", label: "Learn" },
      { href: "/sell/fee-calculator", label: "Fee calculator" },
      { href: "/download", label: "Get the app" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-abyss text-white/60 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed">
              The marketplace for aquarium hobbyists — corals, fish, inverts and gear, traded with care.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/75 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-white/40">
          <p>© {new Date().getFullYear()} Reef Market</p>
          <p>Made for reefers &amp; fishkeepers.</p>
        </div>
      </div>
    </footer>
  );
}
