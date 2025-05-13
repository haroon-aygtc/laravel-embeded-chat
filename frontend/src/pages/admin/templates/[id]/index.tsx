import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import TemplateDetail from "@/components/admin/TemplateDetail";

export default function TemplateDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-40 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <TemplateDetail />
        </Suspense>
    );
} 