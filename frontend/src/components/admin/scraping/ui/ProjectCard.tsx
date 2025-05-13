import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, FileText, Code } from "lucide-react";

interface Project {
  id: string;
  name: string;
  urls: string[];
  selectors: any[];
  lastRun?: string;
  results?: any[];
}

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onSelect,
  onDelete,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full cursor-pointer"
      onClick={() => onSelect(project)}
    >
      <Card
        className={`overflow-hidden hover:shadow-md transition-all duration-200 ${isActive ? "border-primary bg-primary/5" : ""}`}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="font-medium truncate pr-6">{project.name}</h4>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText size={12} />
                  <span>
                    {project.urls.filter((u) => u.trim()).length} URLs
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Code size={12} />
                  <span>{project.selectors.length} Selectors</span>
                </div>
                {project.lastRun && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {new Date(project.lastRun).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>

          {project.results && project.results.length > 0 && (
            <Badge
              variant="outline"
              className="mt-2 text-xs bg-green-50 text-green-700 border-green-200"
            >
              {project.results.length} Results
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
