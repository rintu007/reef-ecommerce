"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
    >
      Cart
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
