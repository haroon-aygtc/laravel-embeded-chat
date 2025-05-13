import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModerationRules from "@/components/admin/ModerationRules";
import ModerationQueue from "@/components/admin/ModerationQueue";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";
import { Shield } from "lucide-react";

const ModerationPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <AdminPageHeader
        title="Content Moderation"
        description="Manage content moderation rules and review flagged content"
        icon={<Shield className="h-6 w-6" />}
      />

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="rules">Moderation Rules</TabsTrigger>
          <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
        </TabsList>
        <TabsContent value="rules">
          <ModerationRules />
        </TabsContent>
        <TabsContent value="queue">
          <ModerationQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationPage;
