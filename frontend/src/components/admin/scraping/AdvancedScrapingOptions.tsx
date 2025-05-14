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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield } from "lucide-react";

export interface AdvancedScrapingConfig {
  skipHeadersFooters: boolean;
  skipMedia: boolean;
  waitForDynamicContent: boolean;
  respectRobotsTxt: boolean;
  handlePagination: boolean;
  paginationSelector: string;
  maxPages: number;
  stealthMode: boolean;
  enableProxy: boolean;
  proxyUrl: string;
  rateLimitDelay: number;
  maxRetries: number;
  followRedirects: boolean;
}

interface AdvancedScrapingOptionsProps {
  config: AdvancedScrapingConfig;
  onChange: (config: AdvancedScrapingConfig) => void;
}

const AdvancedScrapingOptions: React.FC<AdvancedScrapingOptionsProps> = ({
  config,
  onChange,
}) => {
  const handleToggleOption = (
    option: keyof AdvancedScrapingConfig,
    value: boolean,
  ) => {
    onChange({ ...config, [option]: value });
  };

  const handleInputChange = (
    option: keyof AdvancedScrapingConfig,
    value: string | number,
  ) => {
    onChange({ ...config, [option]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={18} />
          Advanced Scraping Options
        </CardTitle>
        <CardDescription>
          Configure detailed scraping behavior and limitations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Content Filtering</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="skip-headers-footers"
                checked={config.skipHeadersFooters}
                onCheckedChange={(checked) =>
                  handleToggleOption("skipHeadersFooters", checked)
                }
              />
              <Label htmlFor="skip-headers-footers" className="cursor-pointer">
                Skip Headers & Footers
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="skip-media"
                checked={config.skipMedia}
                onCheckedChange={(checked) =>
                  handleToggleOption("skipMedia", checked)
                }
              />
              <Label htmlFor="skip-media" className="cursor-pointer">
                Skip Images & Media
              </Label>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="space-y-3">
          <Label>Page Handling</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="wait-dynamic-content"
                checked={config.waitForDynamicContent}
                onCheckedChange={(checked) =>
                  handleToggleOption("waitForDynamicContent", checked)
                }
              />
              <Label htmlFor="wait-dynamic-content" className="cursor-pointer">
                Wait for Dynamic Content
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="respect-robots"
                checked={config.respectRobotsTxt}
                onCheckedChange={(checked) =>
                  handleToggleOption("respectRobotsTxt", checked)
                }
              />
              <Label htmlFor="respect-robots" className="cursor-pointer">
                Respect robots.txt
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="handle-pagination"
                checked={config.handlePagination}
                onCheckedChange={(checked) =>
                  handleToggleOption("handlePagination", checked)
                }
              />
              <Label htmlFor="handle-pagination" className="cursor-pointer">
                Handle Pagination
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="follow-redirects"
                checked={config.followRedirects}
                onCheckedChange={(checked) =>
                  handleToggleOption("followRedirects", checked)
                }
              />
              <Label htmlFor="follow-redirects" className="cursor-pointer">
                Follow Redirects
              </Label>
            </div>
          </div>

          {config.handlePagination && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <Label htmlFor="pagination-selector" className="text-xs">
                  Pagination Selector
                </Label>
                <Input
                  id="pagination-selector"
                  value={config.paginationSelector}
                  onChange={(e) =>
                    handleInputChange("paginationSelector", e.target.value)
                  }
                  placeholder=".pagination .next, #next-page, etc."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="max-pages" className="text-xs">
                  Max Pages
                </Label>
                <Input
                  id="max-pages"
                  type="number"
                  value={config.maxPages}
                  onChange={(e) =>
                    handleInputChange("maxPages", parseInt(e.target.value) || 1)
                  }
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} />
            <Label>Security & Rate Limiting</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="stealth-mode"
                checked={config.stealthMode}
                onCheckedChange={(checked) =>
                  handleToggleOption("stealthMode", checked)
                }
              />
              <Label htmlFor="stealth-mode" className="cursor-pointer">
                Stealth Mode
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-proxy"
                checked={config.enableProxy}
                onCheckedChange={(checked) =>
                  handleToggleOption("enableProxy", checked)
                }
              />
              <Label htmlFor="enable-proxy" className="cursor-pointer">
                Enable Proxy
              </Label>
            </div>
          </div>

          {config.enableProxy && (
            <div className="space-y-1">
              <Label htmlFor="proxy-url" className="text-xs">
                Proxy URL
              </Label>
              <Input
                id="proxy-url"
                value={config.proxyUrl}
                onChange={(e) => handleInputChange("proxyUrl", e.target.value)}
                placeholder="http://username:password@proxy.example.com:8000"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            <div className="space-y-1">
              <Label htmlFor="rate-limit-delay" className="text-xs">
                Rate Limit Delay (ms)
              </Label>
              <Input
                id="rate-limit-delay"
                type="number"
                value={config.rateLimitDelay}
                onChange={(e) =>
                  handleInputChange(
                    "rateLimitDelay",
                    parseInt(e.target.value) || 0,
                  )
                }
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="max-retries" className="text-xs">
                Max Retries
              </Label>
              <Input
                id="max-retries"
                type="number"
                value={config.maxRetries}
                onChange={(e) =>
                  handleInputChange("maxRetries", parseInt(e.target.value) || 3)
                }
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedScrapingOptions;
