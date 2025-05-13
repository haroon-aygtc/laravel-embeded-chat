import React from "react";
import ResponseFormattingOptions from "@/components/admin/ResponseFormattingOptions";
import { useToast } from "@/components/ui/use-toast";
import { useAdmin } from "@/context/AdminContext";

const ResponseFormattingPage = () => {
  const { toast } = useToast();
  const { triggerRefresh } = useAdmin();

  const handleSaveConfig = async (config: any) => {
    try {
      // Call your API endpoint to save the configuration
      const response = await fetch("/api/admin/response-formatting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save response formatting configuration");
      }

      toast({
        title: "Success",
        description: "Response formatting configuration saved successfully.",
      });
      triggerRefresh();
      return true;
    } catch (error) {
      console.error("Error saving response formatting configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save response formatting configuration.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <ResponseFormattingOptions onSave={handleSaveConfig} />
    </div>
  );
};

export default ResponseFormattingPage;
