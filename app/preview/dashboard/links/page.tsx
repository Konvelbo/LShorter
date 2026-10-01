"use client";

import React, { useState } from "react";
import { Plus, Download, RefreshCw } from "lucide-react";
import { PREVIEW_LINKS } from "@/lib/preview-data";
import { LinksReuiDataGrid } from "@/components/dashboard/reui-data-grids";
import { showToast } from "@/components/ui/toast-provider";
import { ShortLink } from "@/types";

export default function PreviewLinksPage() {
  const [links] = useState<ShortLink[]>(PREVIEW_LINKS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExportLinksCSV = () => {
    showToast.success("Short links exported to CSV!");
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Page Title + Breadcrumb & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold ds-text-primary">
            Short Links Data Table
          </h1>
          <p className="text-sm ds-text-muted mt-0.5">
            Home &gt; Short Links ({links.length} active links)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportLinksCSV}
            className="inline-flex items-center gap-1.5 rounded-lg ds-card px-2.5 py-1.5 text-xs font-medium ds-text-secondary hover:ds-text-primary h-8 cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#465FFF]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => showToast.success("Links list refreshed!")}
            className="inline-flex items-center gap-1.5 rounded-lg ds-card px-2.5 py-1.5 text-xs font-medium ds-text-secondary hover:ds-text-primary h-8 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#465FFF]" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => showToast.info("Preview: Create link modal is active in full version.")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] px-3 py-1.5 text-xs font-semibold !text-white h-8 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 !text-white" />
            <span className="!text-white">Create Short Link</span>
          </button>
        </div>
      </div>

      {/* TailAdmin Data Table */}
      <LinksReuiDataGrid
        links={links}
        pageSize={10}
        copiedId={copiedId}
        onCopy={(text, id) => {
          navigator.clipboard.writeText(text);
          setCopiedId(id);
          showToast.success("Link copied!");
          setTimeout(() => setCopiedId(null), 2000);
        }}
      />
    </div>
  );
}
