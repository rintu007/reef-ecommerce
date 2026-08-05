import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getServiceById } from "@/lib/server/services";
import { ServiceForm } from "@/components/ServiceForm";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/sign-in?next=/services/${id}/edit`);

  const service = await getServiceById(id, user);
  if (!service) notFound();
  if (service.provider_id !== user.id) redirect(`/services/${id}`);

  return <ServiceForm mode="edit" serviceId={service.id} initial={service} />;
}
