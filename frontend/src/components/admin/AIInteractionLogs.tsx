import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter, Calendar } from "lucide-react";
import aiService from "@/services/ai/aiService";
import { format } from "date-fns";
import databaseService from "@/services/databaseService";
import logger from "@/utils/logger";
import { AIInteractionLog as AILogType } from "@/services/api/features/aifeatures";

interface AIInteractionLog {
  id: string;
  user_id: string;
  query: string;
  response: string;
  model_used: string;
  context_rule_id: string | null;
  created_at: string;
  metadata: any;
  context_rule?: {
    name: string;
  };
  knowledge_base_results?: number;
  knowledge_base_ids?: string[];
}

const AIInteractionLogs = () => {
  const [logs, setLogs] = useState<AIInteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  } | null>({ from: null, to: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contextRules, setContextRules] = useState<
    { id: string; name: string }[]
  >([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchContextRules();
    fetchLogs();
  }, [page, searchTerm, modelFilter, contextFilter, dateRange]);

  const fetchContextRules = async () => {
    try {
      setError(null);
      const rules = await databaseService.getContextRules();
      setContextRules(rules);
    } catch (error) {
      console.error("Error fetching context rules:", error);
      setError("Failed to load context rules. Please try again.");
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params: any = {
        page,
        pageSize,
        query: searchTerm || undefined,
        modelUsed: modelFilter || undefined,
        contextRuleId: contextFilter || undefined,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      };

      // Fetch logs using aiService
      const result = await aiService.getInteractionLogs(params);

      // Convert the aiService logs to the expected format
      const formattedLogs = result.logs.map((log: AILogType) => ({
        id: log.id,
        user_id: log.userId,
        query: log.query,
        response: log.response,
        model_used: log.modelUsed,
        context_rule_id: log.contextRuleId || null,
        created_at: log.createdAt,
        metadata: log.metadata || {},
        context_rule: log.contextRule,
        knowledge_base_results: log.knowledgeBaseResults,
        knowledge_base_ids: log.knowledgeBaseIds,
      }));

      setLogs(formattedLogs);
      setTotalPages(result.totalPages);

      // Extract unique models for filtering
      if (result.logs && result.logs.length > 0) {
        const models = [
          ...new Set(result.logs.map((log: AILogType) => log.modelUsed)),
        ];
        setAvailableModels(models);
      }
    } catch (error) {
      console.error("Error fetching AI interaction logs:", error);
      setError("Failed to load interaction logs. Please try again.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setError(null);

      // Prepare export options
      const exportOptions = {
        query: searchTerm || undefined,
        modelUsed: modelFilter || undefined,
        contextRuleId: contextFilter || undefined,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      };

      // Request export from API using the databaseService
      const exportResult = await databaseService.exportLogs(exportOptions);

      if (!exportResult) {
        setError("Failed to generate export file. Please try again.");
        return;
      }

      // Trigger download
      databaseService.downloadFile(exportResult.url, exportResult.filename);
    } catch (error) {
      console.error("Error exporting logs:", error);
      setError("Failed to export logs. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setModelFilter(null);
    setContextFilter(null);
    setDateRange({ from: null, to: null });
    setPage(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Interaction Logs</CardTitle>
        <CardDescription>
          Review and analyze AI model interactions and responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search queries or responses..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={loading || exportLoading || logs.length === 0}
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model-filter">Filter by Model</Label>
              <Select
                value={modelFilter || "all"}
                onValueChange={(value) =>
                  setModelFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="model-filter">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="context-filter">Filter by Context</Label>
              <Select
                value={contextFilter || "all"}
                onValueChange={(value) =>
                  setContextFilter(value === "all" ? null : value)
                }
              >
                <SelectTrigger id="context-filter">
                  <SelectValue placeholder="All Contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  <SelectItem value="null">No Context</SelectItem>
                  {contextRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-10"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User Query</TableHead>
                  <TableHead>AI Response</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Knowledge Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.query}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {log.response}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.model_used}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.context_rule ? (
                          <Badge variant="secondary">
                            {log.context_rule.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.knowledge_base_results ? (
                          <Badge variant="secondary">
                            {log.knowledge_base_results} results
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not used</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInteractionLogs;
