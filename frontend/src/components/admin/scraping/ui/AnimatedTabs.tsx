import React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnimatedTabsProps {
  tabs: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onValueChange: (value: string) => void;
  fullWidth?: boolean;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  value,
  onValueChange,
  fullWidth = false,
}) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList
        className={fullWidth ? "grid w-full" : ""}
        style={
          fullWidth
            ? { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }
            : {}
        }
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="relative">
            <div className="flex items-center gap-1.5">
              {tab.icon}
              <span>{tab.label}</span>
            </div>
            {value === tab.value && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                layoutId="tab-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default AnimatedTabs;
