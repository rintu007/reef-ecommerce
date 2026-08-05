import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICE_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { getServiceById } from "@/lib/server/services";
import { DeleteServiceButton } from "./DeleteServiceButton";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getAuthenticatedUser();
  const service = await getServiceById(id, viewer);
  if (!service) notFound();

  const isOwner = viewer?.id === service.provider_id;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {service.photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto mb-4">
          {service.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="w-40 h-40 rounded-xl object-cover shrink-0 bg-gray-100" />
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold">{service.title}</h1>
      <p className="text-sm text-gray-500 mt-1">{SERVICE_TYPE_LABELS[service.service_type]}</p>

      {service.description && <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{service.description}</p>}

      <div className="space-y-1 mt-4 text-sm text-gray-600">
        {service.location && <p>📍 {service.location}</p>}
        {service.service_area && <p>🚚 Serves: {service.service_area}</p>}
        {service.ships_nationwide && <p>Also offers remote/shipped service nationwide</p>}
        {service.contact_info && <p>📞 {service.contact_info}</p>}
      </div>

      {service.price_range && <p className="text-lg font-bold mt-4">{service.price_range}</p>}

      {isOwner && (
        <div className="flex gap-3 mt-6">
          <Link
            href={`/services/${service.id}/edit`}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteServiceButton serviceId={service.id} />
        </div>
      )}
    </div>
  );
}
