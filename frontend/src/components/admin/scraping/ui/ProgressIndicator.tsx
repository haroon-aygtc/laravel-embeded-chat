import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "info" | "warning" | "danger";
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  showPercentage = true,
  size = "md",
  variant = "default",
}) => {
  const getHeight = () => {
    switch (size) {
      case "sm":
        return "h-1";
      case "lg":
        return "h-3";
      case "md":
      default:
        return "h-2";
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "success":
        return "bg-green-600";
      case "info":
        return "bg-blue-600";
      case "warning":
        return "bg-amber-600";
      case "danger":
        return "bg-red-600";
      case "default":
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="font-medium">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <div className="relative">
        <Progress value={value} className={getHeight()} />
        <motion.div
          className={`absolute top-0 left-0 ${getHeight()} ${getVariantClass()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      {!label && showPercentage && (
        <p className="text-xs text-center text-muted-foreground">
          {Math.round(value)}%
        </p>
      )}
    </div>
  );
};

export default ProgressIndicator;
