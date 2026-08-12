"use client";

import { useState } from "react";
import { HELP_CATEGORIES, type HelpContent } from "@reef-market/shared";

const CATEGORY_DESC: Record<string, string> = {
  beginner_setup: "Start your reef journey right",
  coral_care: "Lighting, flow, placement & fragging tips",
  fish_care: "Species profiles, compatibility & tank sizing",
  fragging_tips: "Propagate & trade corals like a pro",
  lighting_flow: "PAR, spectrum, flow rates & placement",
  water_chemistry: "Alk, calcium, magnesium & more",
  pest_prevention: "Ich, velvet, water quality issues & fixes",
  shipping_acclimation: "Safe transport & drip acclimation",
  maintenance: "Filters, lights, skimmers, dosing & more",
};

function itemCategories(item: HelpContent): string[] {
  return [item.category, ...item.categories];
}

export function LearnBrowser({ items }: { items: HelpContent[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    const catInfo = HELP_CATEGORIES.find((c) => c.value === selected);
    const categoryItems = items.filter((item) => itemCategories(item).includes(selected));

    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button onClick={() => setSelected(null)} className="text-sm font-semibold text-blue-600 hover:underline mb-4">
          ← Back to categories
        </button>
        <h2 className="text-xl font-bold mb-1">
          {catInfo?.icon} {catInfo?.label}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {categoryItems.length} guide{categoryItems.length !== 1 ? "s" : ""}
        </p>

        {categoryItems.length === 0 ? (
          <p className="text-sm text-gray-500 py-12 text-center">No content yet. Check back soon!</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {categoryItems.map((item) => (
              <a
                key={item.id}
                href={item.youtube_url ?? undefined}
                target={item.youtube_url ? "_blank" : undefined}
                rel={item.youtube_url ? "noreferrer" : undefined}
                className="block rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                {item.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{item.content_type}</p>
                  <p className="font-bold">{item.title}</p>
                  {item.body && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{item.body}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 grid sm:grid-cols-2 gap-3">
      {HELP_CATEGORIES.map((cat) => {
        const count = items.filter((item) => itemCategories(item).includes(cat.value)).length;
        return (
          <button
            key={cat.value}
            onClick={() => setSelected(cat.value)}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-shadow px-4 py-4 text-left"
          >
            <span className="text-2xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{cat.label}</p>
              <p className="text-xs text-gray-500 truncate">{CATEGORY_DESC[cat.value] ?? ""}</p>
            </div>
            {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
