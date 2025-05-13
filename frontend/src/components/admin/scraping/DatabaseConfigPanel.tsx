import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SelectorConfig, DatabaseConfig } from "@/services/scrapingService";
import { Loader2, Database, Save, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import axios from "axios";

interface DatabaseConfigPanelProps {
  selectors: SelectorConfig[];
  onSaveConfig: (config: DatabaseConfig) => void;
}

interface TableInfo {
  name: string;
  columns: string[];
}

const DatabaseConfigPanel: React.FC<DatabaseConfigPanelProps> = ({
  selectors,
  onSaveConfig,
}) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbType, setDbType] = useState<
    "postgres" | "mysql" | "sqlite" | "mongodb"
  >("postgres");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeUrl, setIncludeUrl] = useState(true);

  // Fetch database tables and columns
  useEffect(() => {
    const fetchTables = async () => {
      if (selectors.length === 0) return;

      try {
        setLoading(true);
        setError(null);

        // Call the API endpoint to get database tables and columns
        const response = await axios.get("/api/scraping/database/tables", {
          timeout: 10000, // 10 second timeout
        });

        if (response.data && Array.isArray(response.data)) {
          setTables(response.data);
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        console.error("Error fetching database tables:", err);

        // More descriptive error message based on the error type
        if (err.code === "ECONNABORTED") {
          setError(
            "Connection timeout. The database server might be overloaded or unreachable.",
          );
        } else if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(
            `Server error: ${err.response.status} - ${err.response.data?.message || "Unknown error"}`,
          );
        } else if (err.request) {
          // The request was made but no response was received
          setError(
            "No response from server. Please check your network connection.",
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(`Failed to load database tables: ${err.message}`);
        }

        // Fallback to mock data for development
        const mockTables: TableInfo[] = [
          {
            name: "scraped_data",
            columns: [
              "id",
              "url",
              "title",
              "description",
              "price",
              "image_url",
              "created_at",
            ],
          },
          {
            name: "products",
            columns: [
              "id",
              "name",
              "price",
              "description",
              "image_url",
              "category",
              "created_at",
            ],
          },
          {
            name: "categories",
            columns: ["id", "name", "slug", "parent_id", "created_at"],
          },
        ];
        setTables(mockTables);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [selectors]);

  // Initialize column mappings when table is selected
  useEffect(() => {
    if (selectedTable && tables.length > 0) {
      const table = tables.find((t) => t.name === selectedTable);
      if (table) {
        // Reset mappings
        const initialMappings: Record<string, string> = {};
        selectors.forEach((selector) => {
          // Try to find a matching column name
          const matchingColumn = table.columns.find(
            (col) =>
              col.toLowerCase() === selector.name.toLowerCase() ||
              col.toLowerCase().includes(selector.name.toLowerCase()),
          );

          initialMappings[selector.id] = matchingColumn || "";
        });

        setColumnMappings(initialMappings);
      }
    }
  }, [selectedTable, tables, selectors]);

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
  };

  // Handle column mapping change
  const handleColumnMappingChange = (
    selectorId: string,
    columnName: string,
  ) => {
    setColumnMappings((prev) => ({
      ...prev,
      [selectorId]: columnName,
    }));
  };

  // Save database configuration
  const handleSaveConfig = () => {
    if (!selectedTable) {
      setError("Please select a table");
      toast({
        title: "Validation Error",
        description: "Please select a table",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty mappings
    const filteredMappings: Record<string, string> = {};
    Object.entries(columnMappings).forEach(([selectorId, columnName]) => {
      if (columnName) {
        filteredMappings[selectorId] = columnName;
      }
    });

    if (Object.keys(filteredMappings).length === 0) {
      setError("Please map at least one selector to a database column");
      toast({
        title: "Validation Error",
        description: "Please map at least one selector to a database column",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate column names
    const uniqueColumnNames = new Set(Object.values(filteredMappings));
    if (uniqueColumnNames.size !== Object.keys(filteredMappings).length) {
      setError("Column names must be unique");
      toast({
        title: "Validation Error",
        description: "Column names must be unique",
        variant: "destructive",
      });
      return;
    }

    const config: DatabaseConfig = {
      table: selectedTable,
      columns: filteredMappings,
      dbType,
      options: {
        includeTimestamp,
        includeUrl,
      },
    };

    onSaveConfig(config);
    toast({
      title: "Configuration Saved",
      description: `Database configuration saved for table ${selectedTable}`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
          <CardDescription>Loading database information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={18} />
          Database Configuration
        </CardTitle>
        <CardDescription>
          Map scraped data to database columns
          {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectors.length === 0 ? (
          <p className="text-sm text-gray-500">
            No selectors configured. Please add selectors in the Preview tab
            before configuring database mappings.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="table-select">Select Table</Label>
                <Select value={selectedTable} onValueChange={handleTableSelect}>
                  <SelectTrigger id="table-select">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.name} value={table.name}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <Select
                  value={dbType}
                  onValueChange={(value) => setDbType(value as any)}
                >
                  <SelectTrigger id="db-type">
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="sqlite">SQLite</SelectItem>
                    <SelectItem value="mongodb">MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="options">
                <AccordionTrigger>Additional Options</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-timestamp"
                        checked={includeTimestamp}
                        onCheckedChange={(checked) =>
                          setIncludeTimestamp(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="include-timestamp"
                        className="cursor-pointer"
                      >
                        Include timestamp column
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-url"
                        checked={includeUrl}
                        onCheckedChange={(checked) =>
                          setIncludeUrl(checked as boolean)
                        }
                      />
                      <Label htmlFor="include-url" className="cursor-pointer">
                        Include source URL column
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {selectedTable && (
              <>
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">
                      Map Selectors to Columns
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select all selectors
                          const newMappings = { ...columnMappings };
                          selectors.forEach((selector) => {
                            if (!newMappings[selector.id]) {
                              const table = tables.find(
                                (t) => t.name === selectedTable,
                              );
                              if (table) {
                                // Try to find a matching column
                                const matchingColumn = table.columns.find(
                                  (col) =>
                                    col.toLowerCase() ===
                                      selector.name.toLowerCase() ||
                                    col
                                      .toLowerCase()
                                      .includes(selector.name.toLowerCase()),
                                );
                                newMappings[selector.id] =
                                  matchingColumn ||
                                  selector.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "_");
                              }
                            }
                          });
                          setColumnMappings(newMappings);
                          toast({
                            title: "All Selectors Mapped",
                            description:
                              "All selectors have been mapped to columns",
                          });
                        }}
                      >
                        Auto-Map All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setColumnMappings({});
                          toast({
                            title: "Mappings Cleared",
                            description:
                              "All column mappings have been cleared",
                          });
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 border rounded-md p-3">
                    {selectors.map((selector) => {
                      const table = tables.find(
                        (t) => t.name === selectedTable,
                      );
                      return (
                        <div
                          key={selector.id}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {selector.name}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle
                                      size={14}
                                      className="text-gray-400 cursor-help"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Type: {selector.type}</p>
                                    {selector.attribute && (
                                      <p>Attribute: {selector.attribute}</p>
                                    )}
                                    {selector.listItemSelector && (
                                      <p>
                                        List item: {selector.listItemSelector}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <span className="text-gray-500 text-xs block truncate">
                              {selector.selector}
                            </span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Select
                              value={columnMappings[selector.id] || ""}
                              onValueChange={(value) =>
                                handleColumnMappingChange(selector.id, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column">
                                  {columnMappings[selector.id] || ""}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Skip --</SelectItem>
                                {table?.columns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Generate a column name based on selector name
                                const columnName = selector.name
                                  .toLowerCase()
                                  .replace(/\s+/g, "_");
                                handleColumnMappingChange(
                                  selector.id,
                                  columnName,
                                );
                              }}
                              className="whitespace-nowrap"
                            >
                              Auto
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  className="w-full mt-4 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Database Configuration
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export { DatabaseConfigPanel };
export default DatabaseConfigPanel;
