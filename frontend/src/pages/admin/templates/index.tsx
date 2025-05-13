import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PromptTemplates from "@/components/admin/PromptTemplates";

export default function TemplatesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-40 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PromptTemplates />
        </Suspense>
    );
} 