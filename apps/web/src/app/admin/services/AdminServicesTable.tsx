"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteService, listServices, updateService, SERVICE_TYPE_LABELS, type Service, type ServiceStatus } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";

const STATUS_TABS: { value: ServiceStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "removed", label: "Removed" },
  { value: "all", label: "All" },
];

export function AdminServicesTable() {
  const [status, setStatus] = useState<ServiceStatus | "all">("active");
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { services, total } = await listServices(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setServices(services);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function setStatusFor(id: string, next: ServiceStatus) {
    setBusyId(id);
    try {
      await updateService(apiClient, id, { status: next });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function hardDelete(id: string) {
    if (!confirm("Permanently delete this service? This can't be undone.")) return;
    setBusyId(id);
    try {
      await deleteService(apiClient, id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              status === tab.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No services in this view.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{total} service(s)</p>
          {services.map((service) => (
            <div key={service.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 bg-white">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {service.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{service.title}</p>
                <p className="text-xs text-gray-500">
                  {SERVICE_TYPE_LABELS[service.service_type]} · {service.status}
                  {service.location && ` · ${service.location}`}
                  {service.price_range && ` · ${service.price_range}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 text-sm font-semibold">
                {service.status !== "active" && (
                  <button
                    onClick={() => setStatusFor(service.id, "active")}
                    disabled={busyId === service.id}
                    className="text-emerald-600 hover:underline disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
                {service.status !== "paused" && (
                  <button
                    onClick={() => setStatusFor(service.id, "paused")}
                    disabled={busyId === service.id}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Pause
                  </button>
                )}
                {service.status !== "removed" && (
                  <button
                    onClick={() => setStatusFor(service.id, "removed")}
                    disabled={busyId === service.id}
                    className="text-yellow-700 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={() => hardDelete(service.id)}
                  disabled={busyId === service.id}
                  className="text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
