import UserManagement from '@/components/admin/user-management';
import { PageHeader } from '@/components/ui/page-header';
import { Icons } from '@/components/ui/icons';

export default function UsersPage() {
  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl">
      <PageHeader
        title="Users"
        description="Manage system users and their permissions"
        icon={<Icons.users className="h-6 w-6 text-primary" />}
      />
      <UserManagement />
    </div>
  );
}
