import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Trash2, Edit, Zap } from "lucide-react";
import { SelectorConfig } from "@/services/scrapingService";
import { cn } from "@/lib/utils";

interface SelectorCardProps {
  selector: SelectorConfig;
  onEdit: (selector: SelectorConfig) => void;
  onRemove: (id: string) => void;
  onTest: (id: string) => void;
  testResult?: {
    success: boolean;
    result: any;
    error?: string;
  };
  isTesting: boolean;
}

const SelectorCard: React.FC<SelectorCardProps> = ({
  selector,
  onEdit,
  onRemove,
  onTest,
  testResult,
  isTesting,
}) => {
  const [copied, setCopied] = useState(false);

  const copySelector = () => {
    navigator.clipboard.writeText(selector.selector);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card
        className="overflow-hidden border-l-4 hover:shadow-md transition-shadow duration-200"
        style={{ borderLeftColor: getSelectorTypeColor(selector.type) }}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="font-medium text-lg">{selector.name}</h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    selector.type === "text" &&
                      "bg-blue-50 text-blue-700 border-blue-200",
                    selector.type === "html" &&
                      "bg-purple-50 text-purple-700 border-purple-200",
                    selector.type === "attribute" &&
                      "bg-amber-50 text-amber-700 border-amber-200",
                    selector.type === "list" &&
                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                  )}
                >
                  {selector.type}
                </Badge>
                {selector.attribute && (
                  <Badge variant="outline" className="text-xs bg-gray-50">
                    attr: {selector.attribute}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => onTest(selector.id)}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => onEdit(selector)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-red-600"
                onClick={() => onRemove(selector.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          <div className="mt-2 relative">
            <div className="flex items-center gap-2 bg-gray-50 rounded-md p-2 pr-10 overflow-x-auto">
              <code className="text-xs font-mono text-gray-700 whitespace-nowrap">
                {selector.selector}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 absolute right-2 top-2 text-gray-500 hover:text-blue-600"
                onClick={copySelector}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-3"
            >
              <div
                className={cn(
                  "p-3 rounded-md text-sm",
                  testResult.success
                    ? "bg-green-50 border border-green-100"
                    : "bg-red-50 border border-red-100",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Test Result:</span>
                  <Badge
                    variant={testResult.success ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {testResult.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                {testResult.success ? (
                  <div className="max-h-32 overflow-y-auto bg-white p-2 rounded border text-xs font-mono">
                    {typeof testResult.result === "object"
                      ? JSON.stringify(testResult.result, null, 2)
                      : String(testResult.result)}
                  </div>
                ) : (
                  <div className="text-red-600 text-xs">
                    {testResult.error || "Unknown error"}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

function getSelectorTypeColor(type: string): string {
  switch (type) {
    case "text":
      return "#3b82f6"; // blue
    case "html":
      return "#8b5cf6"; // purple
    case "attribute":
      return "#f59e0b"; // amber
    case "list":
      return "#10b981"; // emerald
    default:
      return "#6b7280"; // gray
  }
}

export default SelectorCard;
