import Link from "next/link";
import { SERVICE_TYPE_LABELS } from "@reef-market/shared";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { queryServices } from "@/lib/server/services";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const sp = await searchParams;
  const market = sp.market === "saltwater" || sp.market === "freshwater" ? sp.market : undefined;

  const user = await getAuthenticatedUser();
  const { services, total } = await queryServices({ market, limit: 48 }, user);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Services</h1>
        {user && (
          <Link
            href="/services/new"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + Post Service
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Local aquarium services from hobbyists in your area</p>

      <div className="flex gap-2 mb-6">
        <Link
          href="/services"
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${!market ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          All
        </Link>
        <Link
          href="/services?market=saltwater"
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${market === "saltwater" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Saltwater
        </Link>
        <Link
          href="/services?market=freshwater"
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${market === "freshwater" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}
        >
          Freshwater
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-1">No services posted yet</p>
          <p className="text-sm">Be the first to offer a local aquarium service!</p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-2">{total} service(s)</p>
      )}

      <div className="space-y-3">
        {services.map((service) => (
          <Link
            key={service.id}
            href={`/services/${service.id}`}
            className="flex gap-3 rounded-xl border border-gray-200 p-3 bg-white hover:shadow-md transition-shadow"
          >
            {service.photos[0] && (
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.photos[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm">{service.title}</p>
              <p className="text-xs text-gray-500">{SERVICE_TYPE_LABELS[service.service_type]}</p>
              <p className="text-xs text-gray-500 mt-1">
                {[service.location, service.service_area && `Serves: ${service.service_area}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {service.price_range && <p className="text-xs text-gray-700 mt-1">{service.price_range}</p>}
              {user?.id === service.provider_id && (
                <p className="text-[10px] font-semibold text-blue-600 mt-1">Your service</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
