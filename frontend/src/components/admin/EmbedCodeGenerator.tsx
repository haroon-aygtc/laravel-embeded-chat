import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Code2,
  Globe,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ContextRule } from "@/types/contextRules";
import { widgetApi } from "@/services/api/features/widget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { contextRulesApi } from "@/services/api/features/contextRulesfeatures";

interface EmbedCodeGeneratorProps {
  widgetId?: string;
  widgetColor?: string;
  widgetPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  widgetSize?: "small" | "medium" | "large";
  userId?: string;
}

const EmbedCodeGenerator = ({
  widgetId: initialWidgetId = "chat-widget-123",
  widgetColor: initialWidgetColor = "#4f46e5",
  widgetPosition: initialWidgetPosition = "bottom-right",
  widgetSize: initialWidgetSize = "medium",
  userId = "current-user", // In a real app, this would come from auth context
}: EmbedCodeGeneratorProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [contextRules, setContextRules] = useState<ContextRule[]>([]);
  const [selectedContextRuleId, setSelectedContextRuleId] =
    useState<string>("");
  const [contextMode, setContextMode] = useState<"general" | "business">(
    "general",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState(initialWidgetId);
  const [widgetColor, setWidgetColor] = useState(initialWidgetColor);
  const [widgetPosition, setWidgetPosition] = useState(initialWidgetPosition);
  const [widgetSize, setWidgetSize] = useState(initialWidgetSize);
  const [embedCode, setEmbedCode] = useState<string>("");
  const [iframeEmbedCode, setIframeEmbedCode] = useState<string>("");
  const { toast } = useToast();

  // Fetch available context rules and widget configuration
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch context rules
        const rulesResponse = await contextRulesApi.getAllRules();
        if (rulesResponse.success && rulesResponse.data) {
          const activeRules = rulesResponse.data.filter((rule) => rule.isActive);
          setContextRules(activeRules);
          if (activeRules.length > 0) {
            setSelectedContextRuleId(activeRules[0].id);
          }
        }

        // Fetch widget embed code if widgetId is provided
        if (widgetId && widgetId !== "chat-widget-123") {
          const response = await widgetApi.getWidgetEmbedCode(widgetId);
          if (response.success && response.data) {
            setEmbedCode(response.data.code);

            // Generate iframe code using our backend-provided widget configuration
            const widgetResponse = await widgetApi.getWidgetById(widgetId);
            if (widgetResponse.success && widgetResponse.data) {
              const widget = widgetResponse.data;

              // Update state with widget settings
              if (widget.visualSettings && widget.visualSettings.primaryColor) {
                setWidgetColor(widget.visualSettings.primaryColor);
              }

              if (widget.behavioralSettings && widget.behavioralSettings.initialState) {
                setWidgetPosition(widget.behavioralSettings.initialState as "bottom-right" | "bottom-left" | "top-right" | "top-left");
              }

              // Generate iframe embed code
              const baseUrl = window.location.origin;
              const iframeCode = generateCustomIframeCode(baseUrl, widget);
              setIframeEmbedCode(iframeCode);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load configuration data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load configuration data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [widgetId, toast]);

  const baseUrl = window.location.origin;

  // Generate a custom iframe code based on widget settings
  const generateCustomIframeCode = (baseUrl: string, widget: any) => {
    const width = widgetSize === "small" ? "300" : widgetSize === "medium" ? "380" : "450";
    const position = widget.position || "bottom-right";

    let positionCSS = "";
    if (position.includes("bottom")) {
      positionCSS += "bottom: 20px;";
    } else {
      positionCSS += "top: 20px;";
    }

    if (position.includes("right")) {
      positionCSS += "right: 20px;";
    } else {
      positionCSS += "left: 20px;";
    }

    return `<iframe 
  src="${baseUrl}/chat-embed?widgetId=${widget.id}" 
  width="${width}" 
  height="600" 
  style="border: none; position: fixed; ${positionCSS} z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 12px; background-color: white;"
  title="Chat Widget"
></iframe>`;
  };

  // Generate iframe embed code
  const generateIframeCode = () => {
    if (iframeEmbedCode) {
      return iframeEmbedCode;
    }

    let url = `${baseUrl}/chat-embed`;
    const params = new URLSearchParams();

    params.append("widgetId", widgetId);
    params.append("position", widgetPosition);
    params.append("color", widgetColor);
    params.append("size", widgetSize);
    params.append("contextMode", contextMode);

    if (contextMode === "business" && selectedContextRuleId) {
      params.append("contextRuleId", selectedContextRuleId);
    }

    return `<iframe 
  src="${url}?${params.toString()}" 
  width="${widgetSize === "small" ? "300" : widgetSize === "medium" ? "380" : "450"}" 
  height="600" 
  style="border: none; position: fixed; ${widgetPosition.includes("bottom") ? "bottom: 20px;" : "top: 20px;"} ${widgetPosition.includes("right") ? "right: 20px;" : "left: 20px;"} z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 12px; background-color: white;"
  title="Chat Widget"
></iframe>`;
  };

  // Generate Web Component (Shadow DOM) embed code
  const generateWebComponentCode = () => {
    if (embedCode) {
      return embedCode;
    }

    let attributes = `widget-id="${widgetId}" position="${widgetPosition}" color="${widgetColor}" size="${widgetSize}" context-mode="${contextMode}"`;

    if (contextMode === "business" && selectedContextRuleId) {
      attributes += ` context-rule-id="${selectedContextRuleId}"`;
    }

    return `<script src="${baseUrl}/chat-widget.js"></script>
<chat-widget ${attributes}></chat-widget>`;
  };

  // Handle copy button click
  const handleCopy = (type: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {isLoading && (
        <div className="flex items-center justify-center p-4 mb-4 bg-blue-50 rounded-md">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
          <p className="text-blue-700">Loading configuration data...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Embed Code Generator
        </h2>
        <p className="text-gray-600">
          Generate code to embed the chat widget on your website using either an
          iframe or a Web Component.
        </p>
      </div>

      {!initialWidgetId || initialWidgetId === "chat-widget-123" ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Widget Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context Mode
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={contextMode}
                onChange={(e) =>
                  setContextMode(e.target.value as "general" | "business")
                }
              >
                <option value="general">General</option>
                <option value="business">Business</option>
              </select>
            </div>

            {contextMode === "business" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Rule
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedContextRuleId}
                  onChange={(e) => setSelectedContextRuleId(e.target.value)}
                  disabled={contextRules.length === 0}
                >
                  {contextRules.length === 0 ? (
                    <option value="">No rules available</option>
                  ) : (
                    contextRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="mb-4 w-full flex justify-start">
          <TabsTrigger value="iframe" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            iframe Embed
          </TabsTrigger>
          <TabsTrigger
            value="web-component"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Web Component
          </TabsTrigger>
        </TabsList>

        <TabsContent value="iframe" className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                iframe Embed Code
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy("iframe", generateIframeCode())}
                className="h-8"
              >
                {copied === "iframe" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                <code>{generateIframeCode()}</code>
              </pre>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              About iframe Embedding
            </h4>
            <p className="text-sm text-blue-700">
              The iframe method provides complete isolation from your website's
              styles and scripts. It's simple to implement but offers less
              customization options.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="web-component" className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Web Component Embed Code
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy("web-component", generateWebComponentCode())
                }
                className="h-8"
              >
                {copied === "web-component" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                <code>{generateWebComponentCode()}</code>
              </pre>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              About Web Component Embedding
            </h4>
            <p className="text-sm text-blue-700">
              The Web Component method uses Shadow DOM to encapsulate styles and
              scripts. It offers better integration with your website and more
              customization options.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-amber-50 rounded-md border border-amber-100">
        <h4 className="text-sm font-medium text-amber-800 mb-2">
          Implementation Notes
        </h4>
        <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
          <li>
            The chat widget will automatically initialize when the page loads.
          </li>
          <li>
            You can customize the appearance and behavior through the admin
            dashboard.
          </li>
          <li>
            For advanced customization options, refer to the documentation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;
