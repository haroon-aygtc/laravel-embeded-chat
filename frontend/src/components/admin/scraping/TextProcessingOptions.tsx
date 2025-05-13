import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Wand2 } from "lucide-react";

export interface TextProcessingConfig {
  enabled: boolean;
  cleaningLevel: "basic" | "thorough" | "semantic";
  extractStructuredData: boolean;
  performSentimentAnalysis: boolean;
  extractEntities: boolean;
  generateSummary: boolean;
  extractKeywords: boolean;
  categorizeContent: boolean;
}

interface TextProcessingOptionsProps {
  config: TextProcessingConfig;
  onChange: (config: TextProcessingConfig) => void;
}

const TextProcessingOptions: React.FC<TextProcessingOptionsProps> = ({
  config,
  onChange,
}) => {
  const handleToggleEnabled = (enabled: boolean) => {
    onChange({ ...config, enabled });
  };

  const handleCleaningLevelChange = (
    cleaningLevel: "basic" | "thorough" | "semantic",
  ) => {
    onChange({ ...config, cleaningLevel });
  };

  const handleToggleOption = (
    option: keyof TextProcessingConfig,
    value: boolean,
  ) => {
    onChange({ ...config, [option]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 size={18} />
          Text Processing Options
        </CardTitle>
        <CardDescription>
          Configure AI-powered text processing and data extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="enable-text-processing"
            checked={config.enabled}
            onCheckedChange={handleToggleEnabled}
          />
          <Label htmlFor="enable-text-processing">
            {config.enabled
              ? "Text Processing Enabled"
              : "Text Processing Disabled"}
          </Label>
        </div>

        {config.enabled && (
          <>
            <Separator className="my-2" />

            <div className="space-y-2">
              <Label>Cleaning Level</Label>
              <RadioGroup
                value={config.cleaningLevel}
                onValueChange={(value) =>
                  handleCleaningLevelChange(value as any)
                }
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="cleaning-basic" />
                  <Label htmlFor="cleaning-basic" className="cursor-pointer">
                    Basic (Remove HTML tags only)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="thorough" id="cleaning-thorough" />
                  <Label htmlFor="cleaning-thorough" className="cursor-pointer">
                    Thorough (Clean formatting and structure paragraphs)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="semantic" id="cleaning-semantic" />
                  <Label htmlFor="cleaning-semantic" className="cursor-pointer">
                    Semantic (Extract structured data based on content)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator className="my-2" />

            <div className="space-y-3">
              <Label>AI Analysis Options</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="extract-structured-data"
                    checked={config.extractStructuredData}
                    onCheckedChange={(checked) =>
                      handleToggleOption("extractStructuredData", checked)
                    }
                  />
                  <Label
                    htmlFor="extract-structured-data"
                    className="cursor-pointer"
                  >
                    Extract Structured Data
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sentiment-analysis"
                    checked={config.performSentimentAnalysis}
                    onCheckedChange={(checked) =>
                      handleToggleOption("performSentimentAnalysis", checked)
                    }
                  />
                  <Label
                    htmlFor="sentiment-analysis"
                    className="cursor-pointer"
                  >
                    Sentiment Analysis
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="extract-entities"
                    checked={config.extractEntities}
                    onCheckedChange={(checked) =>
                      handleToggleOption("extractEntities", checked)
                    }
                  />
                  <Label htmlFor="extract-entities" className="cursor-pointer">
                    Named Entity Recognition
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="generate-summary"
                    checked={config.generateSummary}
                    onCheckedChange={(checked) =>
                      handleToggleOption("generateSummary", checked)
                    }
                  />
                  <Label htmlFor="generate-summary" className="cursor-pointer">
                    Generate Summary
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="extract-keywords"
                    checked={config.extractKeywords}
                    onCheckedChange={(checked) =>
                      handleToggleOption("extractKeywords", checked)
                    }
                  />
                  <Label htmlFor="extract-keywords" className="cursor-pointer">
                    Extract Keywords
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="categorize-content"
                    checked={config.categorizeContent}
                    onCheckedChange={(checked) =>
                      handleToggleOption("categorizeContent", checked)
                    }
                  />
                  <Label
                    htmlFor="categorize-content"
                    className="cursor-pointer"
                  >
                    Categorize Content
                  </Label>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TextProcessingOptions;
