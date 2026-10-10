import { getAuthenticatedUser } from "@/lib/server/auth";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const user = await getAuthenticatedUser();

  return <HeaderNav user={user ? { isAdmin: user.role === "admin" } : null} />;
}
