import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Maximize2, Minimize2, Plus } from "lucide-react";
import { SelectorConfig } from "@/services/scrapingService";
import SelectorTool from "./SelectorTool";
import axios from "axios";

interface WebPreviewProps {
  url: string;
  onSelectorCreated: (selector: SelectorConfig) => void;
  mode?: "visual" | "code";
}

const WebPreview: React.FC<WebPreviewProps> = ({
  url,
  onSelectorCreated,
  mode = "visual",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSelectorTool, setShowSelectorTool] = useState(false);
  const [selectorToolPosition, setSelectorToolPosition] = useState({
    x: 20,
    y: 80,
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [proxyUrl, setProxyUrl] = useState<string>("");

  // Load URL in iframe
  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    // Create a proxy URL to avoid CORS issues
    const fetchProxyUrl = async () => {
      try {
        // Make an actual API call to the proxy endpoint
        const response = await axios.get(
          `/api/scraping/proxy?url=${encodeURIComponent(url)}`,
        );
        if (response.status === 200) {
          // For iframe loading, we still need to use the proxy URL
          const proxiedUrl = `/api/scraping/proxy?url=${encodeURIComponent(url)}`;
          setProxyUrl(proxiedUrl);
        } else {
          throw new Error(`Failed to proxy URL: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Error creating proxy URL:", err);
        setError(
          `Failed to create proxy for ${url}. ${err.response?.data?.message || err.message || "Please check if the URL is valid."}`,
        );
        setLoading(false);
      }
    };

    fetchProxyUrl();
  }, [url]);

  // Handle iframe load events
  useEffect(() => {
    if (!proxyUrl) return;

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
      setError(
        `Failed to load ${url}. This could be due to CORS restrictions or the site blocking iframe embedding.`,
      );
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", handleLoad);
      iframe.addEventListener("error", handleError);

      // Set timeout to detect loading failures
      const timeout = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError(
            `Timeout loading ${url}. The page may be too large or the server may be slow to respond.`,
          );
        }
      }, 30000); // 30 seconds timeout

      return () => {
        iframe.removeEventListener("load", handleLoad);
        iframe.removeEventListener("error", handleError);
        clearTimeout(timeout);
      };
    }
  }, [proxyUrl, url, loading]);

  // Refresh the iframe
  const refreshIframe = () => {
    if (iframeRef.current && proxyUrl) {
      setLoading(true);
      iframeRef.current.src = proxyUrl;
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  // Toggle selector tool
  const toggleSelectorTool = () => {
    setShowSelectorTool(!showSelectorTool);
  };

  return (
    <div
      className={`relative border border-gray-200 rounded-md overflow-hidden ${fullscreen ? "fixed inset-0 z-50 bg-white" : "h-[600px]"}`}
    >
      {/* Toolbar */}
      <div className="p-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshIframe}
            disabled={loading || !proxyUrl}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </Button>
          <Input value={url} readOnly className="w-96 text-sm bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectorTool}
            disabled={loading || !proxyUrl}
          >
            <Plus size={16} className="mr-1" />
            Selector
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Loading page...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10 p-4">
          <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            <p className="font-medium mb-2">Error Loading Page</p>
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={refreshIframe}
            >
              <RefreshCw size={16} className="mr-1" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Iframe */}
      {proxyUrl && (
        <iframe
          ref={iframeRef}
          src={proxyUrl}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts"
          title="Web Preview"
        />
      )}

      {/* Selector Tool */}
      {showSelectorTool && (
        <SelectorTool
          iframeRef={iframeRef}
          onSelectorCreated={onSelectorCreated}
          onClose={() => setShowSelectorTool(false)}
          position={selectorToolPosition}
          size={{ width: 300, height: 400 }}
        />
      )}
    </div>
  );
};

export default WebPreview;
