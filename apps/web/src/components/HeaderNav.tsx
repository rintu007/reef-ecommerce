"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, MessageCircle, Plus, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

const PRIMARY_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/services", label: "Services" },
  { href: "/learn", label: "Learn" },
];

const ACCOUNT_LINKS = [
  { href: "/my-listings", label: "My Listings" },
  { href: "/orders", label: "Orders" },
  { href: "/messages", label: "Messages" },
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const iconButton =
  "relative w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-900/[0.06] hover:text-ink transition-colors";

export function HeaderNav({ user }: { user: { isAdmin: boolean } | null }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation (state adjusted during render, not in an effect).
  const [menusPathname, setMenusPathname] = useState(pathname);
  if (menusPathname !== pathname) {
    setMenusPathname(pathname);
    setMobileOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const accountLinks = user?.isAdmin ? [...ACCOUNT_LINKS, { href: "/admin", label: "Admin" }] : ACCOUNT_LINKS;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 border-b ${
        scrolled || mobileOpen
          ? "bg-paper/85 backdrop-blur-xl border-gray-900/10 shadow-[0_1px_24px_-12px_rgba(12,26,33,0.25)]"
          : "bg-paper border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Primary">
          {PRIMARY_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-gray-500 hover:text-ink"
                }`}
              >
                {link.label}
                <span
                  className={`absolute left-3 right-3 -bottom-0.5 h-px bg-ink origin-left transition-transform duration-500 ease-[var(--ease-out-expo)] ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {user && (
            <>
              <Link href="/messages" className={`${iconButton} hidden sm:flex`} aria-label="Messages">
                <MessageCircle size={19} strokeWidth={1.75} />
              </Link>
              <Link href="/saved" className={`${iconButton} hidden sm:flex`} aria-label="Saved">
                <Heart size={19} strokeWidth={1.75} />
              </Link>
            </>
          )}
          <Link href="/cart" className={iconButton} aria-label={`Cart${count ? `, ${count} items` : ""}`}>
            <ShoppingBag size={19} strokeWidth={1.75} />
            {count > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div ref={accountRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className={`${iconButton} ${accountOpen ? "bg-gray-900/[0.06] text-ink" : ""}`}
              >
                <User size={19} strokeWidth={1.75} />
              </button>
              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-200 shadow-[0_24px_48px_-16px_rgba(12,26,33,0.25)] p-1.5 animate-[rise_0.35s_var(--ease-out-expo)_both]"
                >
                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                        isActive(pathname, link.href) ? "bg-gray-100 text-ink font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-ink"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="h-px bg-gray-100 my-1.5" />
                  <SignOutButton className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-ink transition-colors" />
                </div>
              )}
            </div>
          ) : (
            <Link href="/sign-in" className="hidden md:inline-flex px-3 py-2 text-sm font-medium text-gray-600 hover:text-ink transition-colors">
              Sign in
            </Link>
          )}

          <Link
            href="/sell"
            className="hidden sm:inline-flex ml-2 items-center gap-1.5 h-10 pl-3.5 pr-4 rounded-full bg-ink text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} strokeWidth={2.25} /> Sell
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className={`${iconButton} md:hidden`}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-900/10 px-4 pb-6 pt-2 animate-[fade_0.3s_ease_both]" aria-label="Mobile">
          {[...PRIMARY_LINKS, ...(user ? accountLinks : [{ href: "/sign-in", label: "Sign in" }])].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between py-3 border-b border-gray-900/5 font-display text-2xl ${
                isActive(pathname, link.href) ? "text-ink" : "text-gray-600"
              }`}
            >
              {link.label}
              <span className="text-base text-gray-400">→</span>
            </Link>
          ))}
          <Link
            href="/sell"
            className="mt-5 flex items-center justify-center gap-1.5 h-12 rounded-full bg-ink text-white font-medium"
          >
            <Plus size={16} /> Start selling
          </Link>
          {user && <SignOutButton className="mt-3 w-full h-11 rounded-full border border-gray-300 text-sm text-gray-600" />}
        </nav>
      )}
    </header>
  );
}
