import React from "react";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import GuestUserManagement from "@/components/admin/GuestUserManagement";

const GuestUsersPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Guest Users Management</h1>
        <GuestUserManagement />
      </div>
    </AdminLayout>
  );
};

export default GuestUsersPage;
