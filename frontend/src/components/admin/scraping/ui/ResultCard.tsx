import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrapingResult } from "@/services/scrapingService";
import { ChevronDown, ChevronUp, ExternalLink, Download } from "lucide-react";

interface ResultCardProps {
  result: ScrapingResult;
  onExport?: (result: ScrapingResult) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onExport }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-base truncate">{result.url}</h4>
                <Badge
                  variant={result.success ? "default" : "destructive"}
                  className="ml-2 shrink-0"
                >
                  {result.success ? "Success" : "Failed"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              {result.success && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-blue-600"
                  onClick={() => onExport?.(result)}
                >
                  <Download size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => window.open(result.url, "_blank")}
              >
                <ExternalLink size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-3"
            >
              {result.success ? (
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">
                    Extracted Data:
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>

                  {result.metadata && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {result.metadata.statusCode && (
                        <div>Status: {result.metadata.statusCode}</div>
                      )}
                      {result.metadata.contentType && (
                        <div>Type: {result.metadata.contentType}</div>
                      )}
                      {result.metadata.responseTime && (
                        <div>Time: {result.metadata.responseTime}ms</div>
                      )}
                      {result.metadata.pageTitle && (
                        <div className="col-span-2 truncate">
                          Title: {result.metadata.pageTitle}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-red-600 text-sm p-3 bg-red-50 rounded-md">
                  Error: {result.error}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResultCard;
