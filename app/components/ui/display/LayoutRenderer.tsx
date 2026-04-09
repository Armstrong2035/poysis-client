"use client";

import React from "react";
import type { LayoutComponent } from "../../../types/canvas";

interface LayoutRendererProps {
  layout: LayoutComponent[];
  data: any; // Can be an object (Generate) or an array (Search)
  onAction?: (action: string, metadata: any) => void;
  limit?: number;
}

/**
 * Replaces {{variable}} tags in a template string with actual data.
 * Supports depth (e.g., {{item.product_name}})
 */
function substitute(template: string, data: any): string {
  if (!template) return "";
  return template.replace(/\{\{(.*?)\}\}/g, (_, path) => {
    const keys = path.trim().split(".");
    let value = data;
    for (const key of keys) {
      if (value === undefined || value === null) return "";
      value = value[key];
    }
    return value !== undefined ? String(value) : "";
  });
}

export function LayoutRenderer({ layout, data, onAction, limit }: LayoutRendererProps) {
  if (!layout || layout.length === 0) return null;

  // If data is an array (e.g., search results), we render the layout FOR EACH item
  let dataItems = Array.isArray(data) ? data : [data];

  // Apply limit if provided (e.g., for focused blueprint designing)
  if (limit && limit > 0) {
    dataItems = dataItems.slice(0, limit);
  }

  return (
    <div className="w-full space-y-6">
      {dataItems.map((item, itemIdx) => (
        <div key={itemIdx} className="w-full bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          {layout.map((component) => {
            const content = substitute(component.content, { item });

            switch (component.type) {
              case "image":
                return (
                  <div key={component.id} className="-mx-5 -mt-5 mb-4 aspect-video overflow-hidden border-b border-zinc-100 bg-zinc-50 flex items-center justify-center">
                    {content ? (
                      <img src={content} alt="Card media" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <span className="text-2xl opacity-20">🖼️</span>
                    )}
                  </div>
                );
              case "title":
                return (
                  <h3 key={component.id} className="text-base font-bold text-zinc-900 mb-1 leading-snug">
                    {content}
                  </h3>
                );
              case "paragraph":
                return (
                  <p key={component.id} className="text-xs text-zinc-500 leading-relaxed mb-3">
                    {content}
                  </p>
                );
              case "price":
                return (
                  <div key={component.id} className="text-lg font-black text-zinc-900 mb-2 font-mono tracking-tight">
                    {content}
                  </div>
                );
              case "chip":
              case "kv-pair":
                  return (
                    <div key={component.id} className="inline-flex items-center gap-2 bg-zinc-100 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-500 mr-2 mb-2 uppercase tracking-wide">
                       {content}
                    </div>
                  );
              case "button":
                return (
                  <button
                    key={component.id}
                    onClick={() => onAction?.(component.action || 'route', item)}
                    className="w-full mt-3 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                  >
                    {content}
                    {component.action === 'route' && <span>→</span>}
                  </button>
                );
              case "link":
                  return (
                    <button
                      key={component.id}
                      onClick={() => onAction?.('link', content)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all mt-1 flex items-center gap-1"
                    >
                      {content} <span>↗</span>
                    </button>
                  );
              case "divider":
                return <hr key={component.id} className="my-5 border-zinc-100" />;
              default:
                return null;
            }
          })}
        </div>
      ))}
    </div>
  );
}
