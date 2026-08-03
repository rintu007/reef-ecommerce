import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { SignOutButton } from "./SignOutButton";

export async function Header() {
  const user = await getAuthenticatedUser();

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/browse" className="text-lg font-bold">
          Reef Market
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/sell"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + Sell
          </Link>
          {user ? (
            <>
              <Link
                href="/my-listings"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                My Listings
              </Link>
              <Link
                href="/messages"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Messages
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Profile
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
