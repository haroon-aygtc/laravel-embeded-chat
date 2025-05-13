import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Sparkles,
  MessageSquare,
  BarChart,
  Tag,
  FileText,
  Loader2,
} from "lucide-react";
import { ScrapingResult } from "@/services/scrapingService";

interface AIAnalysisResult {
  summary?: string;
  sentiment?: {
    overall: string;
    score: number;
  };
  entities?: {
    name: string;
    type: string;
    count: number;
  }[];
  keywords?: string[];
  categories?: string[];
  structuredData?: Record<string, any>;
}

interface AIAnalysisPanelProps {
  result: ScrapingResult;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  aiAnalysis: AIAnalysisResult | null;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  result,
  onAnalyze,
  isAnalyzing,
  aiAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState("summary");

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return "bg-gray-100 text-gray-800";

    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      case "neutral":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={18} />
          AI Analysis
        </CardTitle>
        <CardDescription>
          AI-powered insights from scraped content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!aiAnalysis && !isAnalyzing ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No AI Analysis Yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Run AI analysis to extract insights, summaries, and structured
              data from your scraped content.
            </p>
            <Button onClick={onAnalyze} disabled={isAnalyzing}>
              <Brain size={16} className="mr-2" />
              Analyze Content
            </Button>
          </div>
        ) : isAnalyzing ? (
          <div className="text-center py-8">
            <Loader2
              size={32}
              className="animate-spin text-primary mx-auto mb-4"
            />
            <h3 className="text-lg font-medium mb-2">Analyzing Content</h3>
            <p className="text-sm text-gray-500">
              Our AI is processing your scraped data to extract valuable
              insights...
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="summary" className="text-xs">
                <MessageSquare size={14} className="mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="text-xs">
                <BarChart size={14} className="mr-1" />
                Sentiment
              </TabsTrigger>
              <TabsTrigger value="entities" className="text-xs">
                <Tag size={14} className="mr-1" />
                Entities
              </TabsTrigger>
              <TabsTrigger value="keywords" className="text-xs">
                <FileText size={14} className="mr-1" />
                Keywords
              </TabsTrigger>
              <TabsTrigger value="structured" className="text-xs">
                <Brain size={14} className="mr-1" />
                Structured
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="summary" className="space-y-4">
                {aiAnalysis?.summary ? (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Content Summary</h3>
                    <p className="text-sm">{aiAnalysis.summary}</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No summary available
                  </div>
                )}

                {aiAnalysis?.categories && aiAnalysis.categories.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Content Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sentiment">
                {aiAnalysis?.sentiment ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Overall Sentiment</h3>
                      <Badge
                        className={getSentimentColor(
                          aiAnalysis.sentiment.overall,
                        )}
                      >
                        {aiAnalysis.sentiment.overall}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Sentiment Score
                      </h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.abs(aiAnalysis.sentiment.score * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Negative</span>
                        <span>Neutral</span>
                        <span>Positive</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No sentiment analysis available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="entities">
                {aiAnalysis?.entities && aiAnalysis.entities.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {aiAnalysis.entities.map((entity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border-b last:border-0"
                        >
                          <div>
                            <span className="font-medium">{entity.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {entity.type}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{entity.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No entities detected
                  </div>
                )}
              </TabsContent>

              <TabsContent value="keywords">
                {aiAnalysis?.keywords && aiAnalysis.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-sm py-1 px-2"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No keywords extracted
                  </div>
                )}
              </TabsContent>

              <TabsContent value="structured">
                {aiAnalysis?.structuredData ? (
                  <ScrollArea className="h-[300px]">
                    <pre className="text-xs bg-gray-50 p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(aiAnalysis.structuredData, null, 2)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No structured data available
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
      {aiAnalysis && (
        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={14} className="mr-2" />
                Re-analyze
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIAnalysisPanel;
