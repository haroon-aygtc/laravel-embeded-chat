import React, { useState, useRef, useEffect } from "react";
import { X, Move, Plus, Check, Copy, Crosshair } from "lucide-react";
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
import { SelectorConfig } from "@/services/scrapingService";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectorToolProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onSelectorCreated: (selector: SelectorConfig) => void;
  onClose: () => void;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const SelectorTool: React.FC<SelectorToolProps> = ({
  iframeRef,
  onSelectorCreated,
  onClose,
  position,
  size,
}) => {
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );
  const [selectorPath, setSelectorPath] = useState("");
  const [selectorName, setSelectorName] = useState("");
  const [selectorType, setSelectorType] = useState<
    "text" | "html" | "attribute" | "list"
  >("text");
  const [attribute, setAttribute] = useState("");
  const [listItemSelector, setListItemSelector] = useState("");
  const [previewContent, setPreviewContent] = useState("");

  // Function to generate a CSS selector path for an element
  const generateSelector = (element: HTMLElement): string => {
    if (!element) return "";

    // Try to use ID if available
    if (element.id) {
      return `#${element.id}`;
    }

    // Use classes if available
    if (element.className && typeof element.className === "string") {
      const classes = element.className.trim().split(/\s+/).join(".");
      if (classes) {
        return `.${classes}`;
      }
    }

    // Use tag name and position
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || []);
    const sameTagSiblings = siblings.filter(
      (sibling) => sibling.tagName.toLowerCase() === tagName,
    );

    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(element) + 1;
      return `${tagName}:nth-of-type(${index})`;
    }

    return tagName;
  };

  // Function to generate a full CSS selector path
  const generateFullSelector = (element: HTMLElement): string => {
    const path: string[] = [];
    let currentElement: HTMLElement | null = element;

    while (currentElement && currentElement.tagName !== "HTML") {
      path.unshift(generateSelector(currentElement));
      currentElement = currentElement.parentElement;

      // Limit the depth to avoid overly complex selectors
      if (path.length >= 5) break;
    }

    return path.join(" > ");
  };

  // Handle dragging
  const handleDragStart = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: dragPosition.x,
      posY: dragPosition.y,
    };
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!dragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    setDragPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  // Add and remove global event listeners for dragging
  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    } else {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [dragging]);

  // Copy selector to clipboard
  const copySelector = () => {
    navigator.clipboard.writeText(selectorPath);
    toast({
      title: "Copied to Clipboard",
      description: "Selector has been copied to clipboard",
    });
  };

  // Function to start the selection process
  const startSelection = () => {
    setIsSelecting(true);

    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      // Create overlay in the iframe
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "10000";
      overlay.style.cursor = "crosshair";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.1)";

      iframe.contentDocument.body.appendChild(overlay);

      // Add mouseover event to highlight elements
      const mouseover = (e: MouseEvent) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;

        // Reset previous highlights
        const previousHighlight = iframe.contentDocument?.querySelector(
          ".selector-highlight",
        );
        if (previousHighlight) {
          previousHighlight.classList.remove("selector-highlight");
          previousHighlight.removeAttribute("style");
        }

        // Highlight current element
        target.classList.add("selector-highlight");
        target.style.outline = "2px solid #3b82f6";
        target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
      };

      // Add click event to select an element
      const click = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        setSelectedElement(target);

        // Generate selector
        const selector = generateFullSelector(target);
        setSelectorPath(selector);

        // Get preview content based on selector type
        updatePreview(target, "text");

        // Clean up event listeners
        overlay.removeEventListener("mouseover", mouseover);
        overlay.removeEventListener("click", click);
        iframe.contentDocument?.body.removeChild(overlay);

        setIsSelecting(false);

        toast({
          title: "Element Selected",
          description: `Selected ${target.tagName.toLowerCase()} element`,
        });
      };

      overlay.addEventListener("mouseover", mouseover);
      overlay.addEventListener("click", click);
    } catch (error) {
      console.error("Error starting selection:", error);
      setIsSelecting(false);
    }
  };

  // Update preview content based on selector type
  const updatePreview = (
    element: HTMLElement | null,
    type: "text" | "html" | "attribute" | "list",
  ) => {
    if (!element) return;

    switch (type) {
      case "text":
        setPreviewContent(element.textContent || "");
        break;
      case "html":
        setPreviewContent(element.innerHTML);
        break;
      case "attribute":
        if (attribute) {
          setPreviewContent(element.getAttribute(attribute) || "");
        } else {
          setPreviewContent("");
        }
        break;
      case "list":
        if (listItemSelector) {
          const items = Array.from(element.querySelectorAll(listItemSelector));
          setPreviewContent(items.map((item) => item.textContent).join("\n"));
        } else {
          setPreviewContent("");
        }
        break;
    }
  };

  // Effect to update preview when selector type changes
  useEffect(() => {
    if (selectedElement) {
      updatePreview(selectedElement, selectorType);
    }
  }, [selectorType, attribute, listItemSelector]);

  // Save the selector configuration
  const saveSelector = () => {
    if (!selectorPath || !selectorName) {
      toast({
        title: "Validation Error",
        description: "Selector name and CSS selector are required",
        variant: "destructive",
      });
      return;
    }

    if (selectorType === "attribute" && !attribute) {
      toast({
        title: "Validation Error",
        description: "Please specify an attribute name for attribute selector",
        variant: "destructive",
      });
      return;
    }

    if (selectorType === "list" && !listItemSelector) {
      toast({
        title: "Validation Error",
        description: "Please specify a list item selector for list selector",
        variant: "destructive",
      });
      return;
    }

    const newSelector: SelectorConfig = {
      id: `selector_${Date.now()}`,
      selector: selectorPath,
      name: selectorName,
      type: selectorType,
    };

    if (selectorType === "attribute" && attribute) {
      newSelector.attribute = attribute;
    }

    if (selectorType === "list" && listItemSelector) {
      newSelector.listItemSelector = listItemSelector;
    }

    onSelectorCreated(newSelector);
    toast({
      title: "Selector Created",
      description: `Successfully created selector "${selectorName}"`,
    });
    onClose();
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-md shadow-lg z-50 flex flex-col overflow-hidden absolute"
      style={{
        top: dragPosition.y,
        left: dragPosition.x,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Header */}
      <div
        className="p-2 bg-gray-100 flex items-center justify-between border-b border-gray-200 cursor-move"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Move size={16} className="text-gray-500" />
          <span className="text-sm font-medium">Element Selector</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        <div className="flex flex-col gap-2">
          <Button
            onClick={startSelection}
            disabled={isSelecting}
            className="flex items-center gap-2"
            variant={isSelecting ? "secondary" : "default"}
          >
            {isSelecting ? (
              <>Selecting Element...</>
            ) : (
              <>
                <Crosshair size={16} />
                Select Element
              </>
            )}
          </Button>
        </div>

        {selectorPath && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="selector-path">CSS Selector</Label>
              <div className="flex gap-2">
                <Input
                  id="selector-path"
                  value={selectorPath}
                  onChange={(e) => setSelectorPath(e.target.value)}
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copySelector}
                      >
                        <Copy size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy selector</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="selector-name">Name</Label>
              <Input
                id="selector-name"
                value={selectorName}
                onChange={(e) => setSelectorName(e.target.value)}
                placeholder="e.g., Product Title"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="selector-type">Type</Label>
              <Select
                value={selectorType}
                onValueChange={(value) => setSelectorType(value as any)}
              >
                <SelectTrigger id="selector-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="attribute">Attribute</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectorType === "attribute" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="attribute-name">Attribute Name</Label>
                <Input
                  id="attribute-name"
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                  placeholder="e.g., href, src, data-id"
                />
              </div>
            )}

            {selectorType === "list" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="list-item-selector">List Item Selector</Label>
                <Input
                  id="list-item-selector"
                  value={listItemSelector}
                  onChange={(e) => setListItemSelector(e.target.value)}
                  placeholder="e.g., li, .item, tr"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Preview</Label>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded-md text-sm max-h-32 overflow-y-auto">
                {previewContent || (
                  <span className="text-gray-400">No content</span>
                )}
              </div>
            </div>

            <Button
              onClick={saveSelector}
              className="mt-2 flex items-center gap-2"
            >
              <Check size={16} />
              Save Selector
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectorTool;
