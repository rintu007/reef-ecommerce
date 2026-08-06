import { Info } from "lucide-react";
import type { ApiEndpoint } from "@/lib/api-catalog";
import { AuthBadge, MethodBadge } from "./badges";
import { JsonBlock } from "./JsonBlock";

function ParamTable({ title, rows }: { title: string; rows: { name: string; example?: string; description?: string; required?: boolean }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left font-medium text-slate-500 px-3 py-2 w-40">Name</th>
              <th className="text-left font-medium text-slate-500 px-3 py-2 w-24">Example</th>
              <th className="text-left font-medium text-slate-500 px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-3 py-2 font-mono text-xs text-slate-800 align-top">
                  {r.name}
                  {r.required && <span className="text-rose-500 ml-0.5">*</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500 align-top">{r.example ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 align-top">{r.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EndpointDocs({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <MethodBadge method={endpoint.method} size="lg" />
          <code className="text-sm font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">{endpoint.path}</code>
          <AuthBadge auth={endpoint.auth} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{endpoint.summary}</h1>
        {endpoint.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{endpoint.description}</p>}
      </div>

      {endpoint.notes && (
        <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-sm text-blue-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <p>{endpoint.notes}</p>
        </div>
      )}

      {endpoint.pathParams && endpoint.pathParams.length > 0 && <ParamTable title="Path parameters" rows={endpoint.pathParams} />}
      {endpoint.queryParams && endpoint.queryParams.length > 0 && <ParamTable title="Query parameters" rows={endpoint.queryParams} />}

      {endpoint.requestBodyExample !== undefined && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Example request body</p>
          <JsonBlock code={JSON.stringify(endpoint.requestBodyExample, null, 2)} />
        </div>
      )}

      {endpoint.responseExample !== undefined && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Example response</p>
          <JsonBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />
        </div>
      )}
    </div>
  );
}
