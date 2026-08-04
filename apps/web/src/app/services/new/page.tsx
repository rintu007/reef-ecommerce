import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { ServiceForm } from "@/components/ServiceForm";

export default async function NewServicePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in?next=/services/new");

  return <ServiceForm mode="create" />;
}
