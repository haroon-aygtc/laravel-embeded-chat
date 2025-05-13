import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  FileUp,
  FileJson,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface URLManagerProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  onPreviewUrl: (url: string) => void;
}

const URLManager: React.FC<URLManagerProps> = ({
  urls,
  onUrlsChange,
  onPreviewUrl,
}) => {
  const { toast } = useToast();
  const [bulkUrls, setBulkUrls] = useState("");
  const [jsonUrls, setJsonUrls] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [validUrlsCount, setValidUrlsCount] = useState(0);
  const [invalidUrlsCount, setInvalidUrlsCount] = useState(0);
  const [showUrlValidationSummary, setShowUrlValidationSummary] =
    useState(false);
  const [validationSummary, setValidationSummary] = useState<{
    valid: string[];
    invalid: string[];
  }>({ valid: [], invalid: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add URL input field
  const addUrlField = () => {
    if (newUrl.trim()) {
      try {
        // Validate URL format
        new URL(newUrl);
        onUrlsChange([...urls, newUrl]);
        setNewUrl("");
        toast({
          title: "URL Added",
          description: `Added ${newUrl}`,
        });
      } catch (e) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL including http:// or https://",
          variant: "destructive",
        });
      }
    } else {
      onUrlsChange([...urls, ""]);
    }
  };

  // Handle key press in URL input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newUrl.trim()) {
      addUrlField();
    }
  };

  // Remove URL input field
  const removeUrlField = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    onUrlsChange(newUrls);
    toast({
      title: "URL Removed",
      description: urls[index] ? `Removed ${urls[index]}` : "Removed empty URL",
    });
  };

  // Update URL value
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onUrlsChange(newUrls);
  };

  // Move URL up in the list
  const moveUrlUp = (index: number) => {
    if (index === 0) return;
    const newUrls = [...urls];
    [newUrls[index - 1], newUrls[index]] = [newUrls[index], newUrls[index - 1]];
    onUrlsChange(newUrls);
  };

  // Move URL down in the list
  const moveUrlDown = (index: number) => {
    if (index === urls.length - 1) return;
    const newUrls = [...urls];
    [newUrls[index], newUrls[index + 1]] = [newUrls[index + 1], newUrls[index]];
    onUrlsChange(newUrls);
  };

  // Validate a single URL
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Process and validate URLs with progress tracking
  const processUrls = (
    urlList: string[],
  ): Promise<{ valid: string[]; invalid: string[] }> => {
    return new Promise((resolve) => {
      setIsProcessing(true);
      setProcessingProgress(0);
      setValidUrlsCount(0);
      setInvalidUrlsCount(0);

      const validUrls: string[] = [];
      const invalidUrls: string[] = [];
      const totalUrls = urlList.length;
      let processed = 0;

      // Process URLs in batches to avoid UI freezing
      const processBatch = (startIndex: number, batchSize: number) => {
        const endIndex = Math.min(startIndex + batchSize, totalUrls);

        for (let i = startIndex; i < endIndex; i++) {
          const url = urlList[i].trim();
          if (!url) continue;

          if (validateUrl(url)) {
            validUrls.push(url);
            setValidUrlsCount((prev) => prev + 1);
          } else {
            invalidUrls.push(url);
            setInvalidUrlsCount((prev) => prev + 1);
          }
          processed++;
        }

        const progress = Math.floor((processed / totalUrls) * 100);
        setProcessingProgress(progress);

        if (endIndex < totalUrls) {
          // Process next batch
          setTimeout(() => processBatch(endIndex, batchSize), 0);
        } else {
          // All done
          setIsProcessing(false);
          resolve({ valid: validUrls, invalid: invalidUrls });
        }
      };

      // Start processing in batches of 100
      processBatch(0, 100);
    });
  };

  // Handle bulk URL import
  const handleBulkImport = async () => {
    if (!bulkUrls.trim()) {
      setShowBulkDialog(false);
      return;
    }

    const urlList = bulkUrls
      .split(/\n/)
      .map((url) => url.trim())
      .filter((url) => url !== "");

    if (urlList.length === 0) {
      setShowBulkDialog(false);
      return;
    }

    // Process and validate URLs
    const { valid: validUrls, invalid: invalidUrls } =
      await processUrls(urlList);
    setValidationSummary({ valid: validUrls, invalid: invalidUrls });

    if (validUrls.length > 0) {
      onUrlsChange([...urls, ...validUrls]);
      toast({
        title: "URLs Imported",
        description: `Successfully imported ${validUrls.length} URLs${invalidUrls.length > 0 ? ` (${invalidUrls.length} invalid URLs skipped)` : ""}`,
      });

      if (invalidUrls.length > 0) {
        setShowUrlValidationSummary(true);
      }
    } else if (invalidUrls.length > 0) {
      toast({
        title: "Import Failed",
        description: `All ${invalidUrls.length} URLs were invalid. Please ensure they include http:// or https://`,
        variant: "destructive",
      });
      setShowUrlValidationSummary(true);
    }

    setBulkUrls("");
    setShowBulkDialog(false);
  };

  // Handle JSON URL import
  const handleJsonImport = async () => {
    if (!jsonUrls.trim()) {
      setShowJsonDialog(false);
      return;
    }

    try {
      const jsonData = JSON.parse(jsonUrls);
      const extractedUrls: string[] = [];

      // Function to recursively extract URLs from JSON
      const extractUrls = (data: any) => {
        if (typeof data === "string" && data.match(/^https?:\/\//)) {
          extractedUrls.push(data);
        } else if (Array.isArray(data)) {
          data.forEach((item) => extractUrls(item));
        } else if (typeof data === "object" && data !== null) {
          Object.values(data).forEach((value) => extractUrls(value));
        }
      };

      extractUrls(jsonData);

      if (extractedUrls.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid URLs found in the JSON data",
          variant: "destructive",
        });
        setJsonUrls("");
        setShowJsonDialog(false);
        return;
      }

      // Process and validate URLs
      setIsProcessing(true);
      const { valid: validUrls, invalid: invalidUrls } =
        await processUrls(extractedUrls);
      setValidationSummary({ valid: validUrls, invalid: invalidUrls });

      if (validUrls.length > 0) {
        onUrlsChange([...urls, ...validUrls]);
        toast({
          title: "URLs Imported from JSON",
          description: `Successfully imported ${validUrls.length} URLs from JSON${invalidUrls.length > 0 ? ` (${invalidUrls.length} invalid URLs skipped)` : ""}`,
        });

        if (invalidUrls.length > 0) {
          setShowUrlValidationSummary(true);
        }
      } else {
        toast({
          title: "Import Failed",
          description: "No valid URLs found in the JSON data",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "Please enter valid JSON data",
        variant: "destructive",
      });
    }

    setJsonUrls("");
    setShowJsonDialog(false);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          setJsonUrls(content);
          setShowJsonDialog(true);
        } else if (file.name.endsWith(".csv")) {
          // Process CSV file
          const lines = content.split(/\r?\n/);
          const extractedUrls = lines
            .map((line) => {
              // Extract first column if it's a CSV
              const columns = line.split(",");
              return columns[0].trim().replace(/["']/g, ""); // Remove quotes
            })
            .filter((url) => url && url.match(/^https?:\/\//));

          if (extractedUrls.length > 0) {
            setBulkUrls(extractedUrls.join("\n"));
            setShowBulkDialog(true);
          } else {
            toast({
              title: "No URLs Found",
              description: "No valid URLs found in the CSV file",
              variant: "destructive",
            });
          }
        } else {
          // Treat as plain text file
          setBulkUrls(content);
          setShowBulkDialog(true);
        }
      } catch (e) {
        toast({
          title: "File Read Error",
          description: "Failed to read the file content",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  // Remove all URLs
  const clearAllUrls = () => {
    if (urls.length === 0) return;

    onUrlsChange([]);
    toast({
      title: "URLs Cleared",
      description: `Removed all ${urls.length} URLs`,
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="bulk">Bulk URLs</TabsTrigger>
          <TabsTrigger value="json">JSON Format</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="pt-4">
          <div className="flex items-center gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button
              variant="default"
              onClick={addUrlField}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Add URL
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="pt-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Enter one URL per line:\nhttps://example.com\nhttps://another-site.com"
              className="min-h-[150px]"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkUrls("")}>
                Clear
              </Button>
              <Button onClick={handleBulkImport} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Import URLs</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="json" className="pt-4">
          <div className="space-y-4">
            <Textarea
              placeholder='{"urls": ["https://example.com", "https://another-site.com"]}\nor\n["https://example.com", "https://another-site.com"]'
              className="min-h-[150px] font-mono text-sm"
              value={jsonUrls}
              onChange={(e) => setJsonUrls(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setJsonUrls("")}>
                Clear
              </Button>
              <Button onClick={handleJsonImport} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Extract URLs</>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {urls.length} URL{urls.length !== 1 ? "s" : ""} added
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.json,.csv"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp size={16} className="mr-1" />
            Import File
          </Button>
          {urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllUrls}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} className="mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing URLs...</span>
            <span>{processingProgress}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Valid: {validUrlsCount}</span>
            <span>Invalid: {invalidUrlsCount}</span>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          {urls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No URLs added yet. Add a URL to start scraping.
            </div>
          ) : (
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUrlUp(index)}
                      disabled={index === 0}
                      className="h-6 w-6"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUrlDown(index)}
                      disabled={index === urls.length - 1}
                      className="h-6 w-6"
                    >
                      <ArrowDown size={14} />
                    </Button>
                  </div>
                  <Input
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreviewUrl(url)}
                    className="flex-shrink-0"
                    title="Preview URL"
                    disabled={!url}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrlField(index)}
                    className="flex-shrink-0 text-red-500 hover:text-red-700"
                    title="Remove URL"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk URL Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import URLs</DialogTitle>
            <DialogDescription>
              Enter one URL per line. Each URL must include http:// or https://
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder="https://example.com\nhttps://another-site.com"
            rows={10}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Import URLs</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON URL Dialog */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import URLs from JSON</DialogTitle>
            <DialogDescription>
              The system will extract all valid URLs from the JSON structure
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={jsonUrls}
            onChange={(e) => setJsonUrls(e.target.value)}
            placeholder='{"urls": ["https://example.com"]}'
            rows={10}
            className="font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJsonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleJsonImport} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Extract URLs</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Validation Summary Dialog */}
      <Dialog
        open={showUrlValidationSummary}
        onOpenChange={setShowUrlValidationSummary}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>URL Validation Results</DialogTitle>
            <DialogDescription>
              Summary of valid and invalid URLs from your import
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-green-500" size={18} />
                  <h3 className="font-medium">
                    Valid URLs ({validationSummary.valid.length})
                  </h3>
                </div>
                <div className="border rounded-md p-2 bg-green-50 max-h-[300px] overflow-y-auto">
                  {validationSummary.valid.length > 0 ? (
                    <ul className="space-y-1">
                      {validationSummary.valid.map((url, idx) => (
                        <li
                          key={idx}
                          className="text-sm truncate hover:text-clip"
                        >
                          {url}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 p-2">
                      No valid URLs found
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <X className="text-red-500" size={18} />
                  <h3 className="font-medium">
                    Invalid URLs ({validationSummary.invalid.length})
                  </h3>
                </div>
                <div className="border rounded-md p-2 bg-red-50 max-h-[300px] overflow-y-auto">
                  {validationSummary.invalid.length > 0 ? (
                    <ul className="space-y-1">
                      {validationSummary.invalid.map((url, idx) => (
                        <li
                          key={idx}
                          className="text-sm truncate hover:text-clip"
                        >
                          {url}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 p-2">
                      No invalid URLs found
                    </p>
                  )}
                </div>
              </div>
            </div>

            {validationSummary.invalid.length > 0 && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid URL Format</AlertTitle>
                <AlertDescription>
                  Invalid URLs were skipped. Make sure all URLs include http://
                  or https:// prefix and are properly formatted.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={() => setShowUrlValidationSummary(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default URLManager;
