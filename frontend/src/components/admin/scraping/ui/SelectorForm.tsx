import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

interface SelectorFormProps {
  selector: SelectorConfig | null;
  onSave: (selector: SelectorConfig) => void;
  onCancel: () => void;
}

const SelectorForm: React.FC<SelectorFormProps> = ({
  selector,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [type, setType] = useState<"text" | "html" | "attribute" | "list">(
    "text",
  );
  const [attribute, setAttribute] = useState("");
  const [listItemSelector, setListItemSelector] = useState("");

  useEffect(() => {
    if (selector) {
      setName(selector.name);
      setPath(selector.selector);
      setType(selector.type);
      setAttribute(selector.attribute || "");
      setListItemSelector(selector.listItemSelector || "");
    } else {
      setName("");
      setPath("");
      setType("text");
      setAttribute("");
      setListItemSelector("");
    }
  }, [selector]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !path.trim()) {
      return;
    }

    const newSelector: SelectorConfig = {
      id: selector?.id || `selector_${Date.now()}`,
      name,
      selector: path,
      type,
    };

    if (type === "attribute" && attribute) {
      newSelector.attribute = attribute;
    }

    if (type === "list" && listItemSelector) {
      newSelector.listItemSelector = listItemSelector;
    }

    onSave(newSelector);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg p-4 bg-card"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="selector-name">Name</Label>
          <Input
            id="selector-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Product Title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="selector-path">CSS Selector</Label>
          <Input
            id="selector-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="e.g., .product-title, #price"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="selector-type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as any)}>
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

        {type === "attribute" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="attribute-name">Attribute Name</Label>
            <Input
              id="attribute-name"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              placeholder="e.g., href, src, data-id"
              required={type === "attribute"}
            />
          </motion.div>
        )}

        {type === "list" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="list-item-selector">List Item Selector</Label>
            <Input
              id="list-item-selector"
              value={listItemSelector}
              onChange={(e) => setListItemSelector(e.target.value)}
              placeholder="e.g., li, .item, tr"
              required={type === "list"}
            />
          </motion.div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {selector ? "Update Selector" : "Add Selector"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default SelectorForm;
