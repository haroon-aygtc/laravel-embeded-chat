import React from "react";
import ScrapingModule from "@/components/admin/scraping";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";

export default function ScrapingPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <AdminPageHeader
        title="Web Scraping"
        description="AI-powered web scraping for content extraction and analysis"
      />
      <ScrapingModule />
    </div>
  );
}
