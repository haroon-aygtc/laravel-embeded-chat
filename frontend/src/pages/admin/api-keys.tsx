import React from "react";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import ApiKeyManager from "@/components/admin/ApiKeyManager";

const ApiKeysPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-6">
        <ApiKeyManager />
      </div>
    </div>
  );
};

export default ApiKeysPage;
