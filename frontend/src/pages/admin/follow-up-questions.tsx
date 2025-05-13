import React, { useState, useEffect } from "react";
import FollowUpQuestionsConfig from "@/components/admin/FollowUpQuestionsConfig";
import { useToast } from "@/components/ui/use-toast";
import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminPageHeader from "@/components/admin/common/AdminPageHeader";

interface FollowUpConfig {
  id: string;
  name: string;
  enable_follow_up_questions: boolean;
  max_follow_up_questions: number;
  show_follow_up_as: string;
  generate_automatically: boolean;
  is_default: boolean;
}

const FollowUpQuestionsPage = () => {
  const { toast } = useToast();
  const { triggerRefresh } = useAdmin();
  const [configs, setConfigs] = useState<FollowUpConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [selectedConfig, setSelectedConfig] = useState<FollowUpConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  useEffect(() => {
    if (selectedConfigId) {
      const config = configs.find((c) => c.id === selectedConfigId) || null;
      setSelectedConfig(config);
    } else {
      setSelectedConfig(null);
    }
  }, [selectedConfigId, configs]);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/follow-up-questions/configs");
      if (!response.ok) {
        throw new Error("Failed to fetch follow-up configurations");
      }
      const data = await response.json();
      setConfigs(data.data || []);

      // Select the default config or the first one
      const defaultConfig = data.data.find((c: FollowUpConfig) => c.is_default);
      if (defaultConfig) {
        setSelectedConfigId(defaultConfig.id);
      } else if (data.data.length > 0) {
        setSelectedConfigId(data.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching follow-up configurations:", error);
      toast({
        title: "Error",
        description: "Failed to load follow-up configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (config: any) => {
    try {
      // Call your API endpoint to save the configuration
      const response = await fetch("/api/admin/follow-up-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save follow-up questions configuration");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Follow-up questions configuration saved successfully.",
      });

      // Refresh the configurations list
      await fetchConfigurations();

      // If this was a new config, select it
      if (creatingNew && result.data && result.data.id) {
        setSelectedConfigId(result.data.id);
        setCreatingNew(false);
      }

      triggerRefresh();
      return true;
    } catch (error) {
      console.error("Error saving follow-up questions configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save follow-up questions configuration.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateNew = () => {
    setCreatingNew(true);
    setSelectedConfigId("");
    setSelectedConfig(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AdminPageHeader
        title="Follow-up Questions"
        description="Configure how follow-up questions are presented to users in chat interactions"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4 w-1/2">
              <Select
                value={selectedConfigId}
                onValueChange={setSelectedConfigId}
                disabled={loading || creatingNew}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} {config.is_default ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateNew} disabled={creatingNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Configuration
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading configurations...
            </div>
          ) : creatingNew ? (
            <FollowUpQuestionsConfig onSave={handleSaveConfig} />
          ) : selectedConfig ? (
            <FollowUpQuestionsConfig
              onSave={handleSaveConfig}
              initialConfig={selectedConfig}
            />
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Select a configuration or create a new one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpQuestionsPage;
