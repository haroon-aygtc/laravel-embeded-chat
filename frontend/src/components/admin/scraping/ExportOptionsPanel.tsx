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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileJson,
  Table2,
  FileText,
  FileCode,
  Save,
  Loader2,
} from "lucide-react";

export interface ExportConfig {
  format: "json" | "csv" | "xml" | "excel" | "text";
  includeMetadata: boolean;
  useSemanticKeys: boolean;
  extractLinks: boolean;
  extractImages: boolean;
  extractTables: boolean;
  saveToPublic: boolean;
  overwriteExisting: boolean;
  customFilename: string;
}

interface ExportOptionsPanelProps {
  config: ExportConfig;
  onChange: (config: ExportConfig) => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
  hasResults: boolean;
}

const ExportOptionsPanel: React.FC<ExportOptionsPanelProps> = ({
  config,
  onChange,
  onExport,
  isExporting,
  hasResults,
}) => {
  const handleFormatChange = (
    format: "json" | "csv" | "xml" | "excel" | "text",
  ) => {
    onChange({ ...config, format });
  };

  const handleToggleOption = (option: keyof ExportConfig, value: boolean) => {
    onChange({ ...config, [option]: value });
  };

  const handleFilenameChange = (value: string) => {
    onChange({ ...config, customFilename: value });
  };

  const formatIcons = {
    json: <FileJson size={24} />,
    csv: <Table2 size={24} />,
    xml: <FileCode size={24} />,
    excel: <Table2 size={24} />,
    text: <FileText size={24} />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download size={18} />
          Export Options
        </CardTitle>
        <CardDescription>
          Configure how to export and save scraped data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="grid grid-cols-5 gap-2">
            {(["json", "csv", "xml", "excel", "text"] as const).map(
              (format) => (
                <div
                  key={format}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${config.format === format ? "border-primary" : ""}`}
                  onClick={() => handleFormatChange(format)}
                >
                  <div
                    className={`p-2 rounded-full ${config.format === format ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}
                  >
                    {formatIcons[format]}
                  </div>
                  <span className="font-medium capitalize">{format}</span>
                  <Badge
                    variant={config.format === format ? "default" : "outline"}
                    className="text-xs"
                  >
                    {config.format === format ? "Selected" : "Select"}
                  </Badge>
                </div>
              ),
            )}
          </div>
        </div>

        <Separator className="my-2" />

        <div className="space-y-3">
          <Label>JSON Transformation Options</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-metadata"
                checked={config.includeMetadata}
                onCheckedChange={(checked) =>
                  handleToggleOption("includeMetadata", checked)
                }
                disabled={config.format !== "json" && config.format !== "xml"}
              />
              <Label
                htmlFor="include-metadata"
                className={`cursor-pointer ${config.format !== "json" && config.format !== "xml" ? "text-gray-400" : ""}`}
              >
                Include Metadata
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="use-semantic-keys"
                checked={config.useSemanticKeys}
                onCheckedChange={(checked) =>
                  handleToggleOption("useSemanticKeys", checked)
                }
                disabled={config.format !== "json"}
              />
              <Label
                htmlFor="use-semantic-keys"
                className={`cursor-pointer ${config.format !== "json" ? "text-gray-400" : ""}`}
              >
                Use Semantic Keys
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Content Extraction</Label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="extract-links"
                checked={config.extractLinks}
                onCheckedChange={(checked) =>
                  handleToggleOption("extractLinks", checked)
                }
              />
              <Label htmlFor="extract-links" className="cursor-pointer">
                Extract Links
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="extract-images"
                checked={config.extractImages}
                onCheckedChange={(checked) =>
                  handleToggleOption("extractImages", checked)
                }
              />
              <Label htmlFor="extract-images" className="cursor-pointer">
                Extract Images
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="extract-tables"
                checked={config.extractTables}
                onCheckedChange={(checked) =>
                  handleToggleOption("extractTables", checked)
                }
              />
              <Label htmlFor="extract-tables" className="cursor-pointer">
                Extract Tables
              </Label>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="space-y-3">
          <Label>File Options</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="save-to-public"
                checked={config.saveToPublic}
                onCheckedChange={(checked) =>
                  handleToggleOption("saveToPublic", checked)
                }
              />
              <Label htmlFor="save-to-public" className="cursor-pointer">
                Save to Public Folder
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="overwrite-existing"
                checked={config.overwriteExisting}
                onCheckedChange={(checked) =>
                  handleToggleOption("overwriteExisting", checked)
                }
              />
              <Label htmlFor="overwrite-existing" className="cursor-pointer">
                Overwrite Existing
              </Label>
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <Label htmlFor="custom-filename" className="text-xs">
              Custom Filename (without extension)
            </Label>
            <Input
              id="custom-filename"
              value={config.customFilename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              placeholder="scraped_data_export"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Button
          onClick={onExport}
          disabled={isExporting || !hasResults}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Save size={16} />
              Export Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExportOptionsPanel;
