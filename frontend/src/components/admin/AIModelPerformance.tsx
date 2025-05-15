import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Info } from "lucide-react";
import aiService from "@/services/ai/aiService";
import { Button } from "@/components/ui/button";
import databaseService from "@/services/databaseService";
import { useToast } from "@/components/ui/use-toast";

// Component internal interfaces
interface ModelData {
  name: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
  isActive: boolean;
}

interface ContextData {
  name: string;
  percentage: number;
  effectiveness: number;
}

// API response interfaces
interface AIServiceModelUsage {
  model: string;
  count: number;
  successRate?: number;
}

interface AIServiceResponseTime {
  model: string;
  avgTime: number;
}

interface AIServiceContextUsage {
  name: string;
  count: number;
  effectiveness?: number;
}

interface DailyUsage {
  date: string;
  count: number;
}

interface AIServicePerformanceResult {
  modelUsage: AIServiceModelUsage[];
  avgResponseTimes: AIServiceResponseTime[];
  dailyUsage: DailyUsage[]; // Not used in this component but properly typed
  timeRange: string;
  contextUsage?: AIServiceContextUsage[];
}

// Component props
interface AIModelPerformanceProps {
  timeRange?: "day" | "week" | "month";
}

const AIModelPerformance: React.FC<AIModelPerformanceProps> = ({
  timeRange = "week",
}) => {
  const [modelData, setModelData] = useState<ModelData[]>([]);
  const [contextData, setContextData] = useState<ContextData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("distribution");
  const { toast } = useToast();

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert timeRange to API format
      const apiTimeRange = timeRange === "day" ? "1d" : timeRange === "week" ? "7d" : "30d";

      // Try using the database service first
      const performanceData = await databaseService.getModelPerformance({
        timeRange: apiTimeRange
      });

      if (performanceData) {
        // Process model data
        if (performanceData.modelUsage && performanceData.modelUsage.length > 0) {
          const formattedModelData: ModelData[] = performanceData.modelUsage.map(
            (model) => ({
              name: model.model,
              requestCount: model.count,
              avgResponseTime:
                performanceData.avgResponseTimes?.find(
                  (m) => m.model === model.model
                )?.avgTime || 0,
              errorRate: 100 - (model.successRate || 100), // Convert success rate to error rate
              isActive: true,
            })
          );
          setModelData(formattedModelData);
        }

        // Process context data if available
        if (performanceData.contextUsage && performanceData.contextUsage.length > 0) {
          const totalContexts = performanceData.contextUsage.reduce(
            (sum, ctx) => sum + ctx.count,
            0
          );
          const formattedContextData: ContextData[] = performanceData.contextUsage.map(
            (ctx) => ({
              name: ctx.name || "No Context",
              percentage:
                totalContexts > 0 ? (ctx.count / totalContexts) * 100 : 0,
              effectiveness: ctx.effectiveness || 90, // Default to 90% if not available
            })
          );
          setContextData(formattedContextData);
        }
      } else {
        // Fall back to AI service if database service fails
        const result = await aiService.getModelPerformance({
          timeRange: apiTimeRange,
        }) as AIServicePerformanceResult;

        // Process model data
        if (result.modelUsage && result.modelUsage.length > 0) {
          const formattedModelData: ModelData[] = result.modelUsage.map(
            (model) => ({
              name: model.model,
              requestCount: model.count,
              avgResponseTime:
                result.avgResponseTimes?.find(
                  (m) => m.model === model.model
                )?.avgTime || 0,
              errorRate: 100 - (model.successRate || 100), // Convert success rate to error rate
              isActive: true,
            })
          );
          setModelData(formattedModelData);
        }

        // Process context data if available
        if (result.contextUsage && result.contextUsage.length > 0) {
          const totalContexts = result.contextUsage.reduce(
            (sum, ctx) => sum + ctx.count,
            0
          );

          const formattedContextData: ContextData[] = result.contextUsage.map(
            (ctx) => ({
              name: ctx.name || "No Context",
              percentage:
                totalContexts > 0 ? (ctx.count / totalContexts) * 100 : 0,
              effectiveness: ctx.effectiveness || 90, // Default to 90% if not available
            })
          );
          setContextData(formattedContextData);
        }
      }

      if (modelData.length === 0) {
        toast({
          title: "No performance data",
          description: "There is no model usage data for the selected time period.",
          variant: "default"
        });
      }
    } catch (err) {
      console.error("Error fetching AI model performance data:", err);
      setError("Failed to load performance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPerformanceData();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest performance metrics"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Error</p>
        </div>
        <p>{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (modelData.length === 0 && contextData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 text-gray-800 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 mt-0.5 text-blue-500" />
          <div>
            <p className="font-medium">No Data Available</p>
            <p className="text-sm text-muted-foreground">
              There is no AI model performance data available for the selected time
              period. Try selecting a different time range or checking if there are any AI interactions in the system.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="mt-4"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">AI Model Performance</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="distribution">Model Distribution</TabsTrigger>
          <TabsTrigger value="context">Context Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Distribution</CardTitle>
              <CardDescription>
                Query distribution between models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No model usage data available for the selected time period.
                  </div>
                ) : (
                  modelData.map((model, index) => {
                    const colorClasses = [
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-red-500",
                      "bg-indigo-500",
                    ];

                    const percentage =
                      (model.requestCount /
                        modelData.reduce((sum, m) => sum + m.requestCount, 0)) *
                      100;

                    return (
                      <div key={model.name}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`mr-2 h-3 w-3 rounded-full ${colorClasses[index % colorClasses.length]}`}
                            ></div>
                            <span className="text-sm">{model.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })
                )}
              </div>

              {modelData.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium">Model Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modelData.slice(0, 2).map((model, index) => (
                      <div
                        key={model.name}
                        className="space-y-2 rounded-lg border p-3"
                      >
                        <h4 className="text-sm font-medium">{model.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Avg. Response Time
                          </span>
                          <span className="text-xs font-medium">
                            {model.avgResponseTime.toFixed(1)}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Accuracy Rate
                          </span>
                          <span className="text-xs font-medium">
                            {(100 - model.errorRate).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Error Rate
                          </span>
                          <span className="text-xs font-medium">
                            {model.errorRate.toFixed(1)}%
                          </span>
                        </div>
                        <Badge
                          className={`mt-2 ${index === 0 ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                        >
                          {index === 0 ? "Primary Model" : "Fallback Model"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Context Breakdown</CardTitle>
              <CardDescription>
                Distribution of conversation contexts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contextData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No context usage data available for the selected time
                    period.
                  </div>
                ) : (
                  contextData.map((context) => (
                    <div key={context.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">{context.name}</span>
                        <span className="text-sm font-medium">
                          {context.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={context.percentage} className="h-2" />
                    </div>
                  ))
                )}
              </div>

              {contextData.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-medium">
                    Context Rule Effectiveness
                  </h3>
                  <div className="space-y-4">
                    {contextData.slice(0, 3).map((context) => (
                      <div
                        key={context.name}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <h4 className="text-sm font-medium">
                            {context.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {context.name === "General Inquiries"
                              ? "Handles basic questions about the platform"
                              : context.name === "Technical Support"
                                ? "Resolves technical issues and implementation questions"
                                : context.name === "Product Information"
                                  ? "Provides details about features and capabilities"
                                  : "Manages user inquiries and requests"}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {context.effectiveness.toFixed(0)}% Effective
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelPerformance;
