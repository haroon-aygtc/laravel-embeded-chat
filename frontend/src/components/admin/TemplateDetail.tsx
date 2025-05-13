import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Edit, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import TemplateTestForm from "@/components/ai/TemplateTestForm";
import { promptTemplateService } from "@/services/promptTemplateService";
import { usePromptTemplates } from "@/hooks/usePromptTemplates";

const TemplateDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { templates, testTemplate } = usePromptTemplates({ initialLoad: false });
    const [template, setTemplate] = useState(templates.find(t => t.id === id) || null);

    useEffect(() => {
        if (id) {
            loadTemplate(id);
        }
    }, [id]);

    const loadTemplate = async (templateId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await promptTemplateService.getTemplateById(templateId);
            if (!data) {
                setError("Template not found");
                return;
            }
            setTemplate(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        // Navigate to edit template page or open edit modal
        navigate(`/admin/templates/edit/${id}`);
    };

    const handleDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        try {
            await promptTemplateService.deleteTemplate(id);
            navigate("/admin/templates");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setShowDeleteDialog(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!template) return;

        try {
            const newTemplate = await promptTemplateService.createTemplate({
                name: `${template.name} (Copy)`,
                description: template.description,
                template: template.template,
                category: template.category,
                variables: template.variables,
                isActive: template.isActive,
            });

            navigate(`/admin/templates/${newTemplate.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading template...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={() => navigate("/admin/templates")} variant="outline" className="mt-2">
                    Back to Templates
                </Button>
            </Alert>
        );
    }

    if (!template) {
        return (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Template not found</AlertTitle>
                <AlertDescription>The requested template could not be found.</AlertDescription>
                <Button onClick={() => navigate("/admin/templates")} variant="outline" className="mt-2">
                    Back to Templates
                </Button>
            </Alert>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/admin/templates")}
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Templates
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={handleDuplicate}
                    >
                        <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={handleEdit}
                    >
                        <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="flex items-center gap-1"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Template</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this template? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">{template.name}</CardTitle>
                            <CardDescription className="mt-1">
                                <Badge variant="outline" className="mr-2">
                                    {template.category || "general"}
                                </Badge>
                                <Badge variant={template.isActive ? "default" : "secondary"}>
                                    {template.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {template.description && (
                        <div>
                            <h3 className="text-sm font-medium mb-1">Description</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-medium mb-1">Template Content</h3>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto whitespace-pre-wrap">
                            {template.template}
                        </pre>
                    </div>

                    {template.variables && template.variables.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-1">Variables</h3>
                            <div className="flex flex-wrap gap-1">
                                {template.variables.map((variable) => (
                                    <Badge key={variable} variant="outline">
                                        {variable}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground border-t pt-4 flex justify-between">
                    <span>Created: {new Date(template.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(template.updatedAt).toLocaleString()}</span>
                </CardFooter>
            </Card>

            <Tabs defaultValue="test" className="mt-6">
                <TabsList>
                    <TabsTrigger value="test">Test Template</TabsTrigger>
                    <TabsTrigger value="usage">Usage Examples</TabsTrigger>
                </TabsList>
                <TabsContent value="test" className="p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-4">Test Template</h2>
                    <TemplateTestForm
                        template={template}
                        onTest={testTemplate}
                    />
                </TabsContent>
                <TabsContent value="usage" className="p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-2">Usage Examples</h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium">Frontend API Example</h3>
                            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                {`// Example using the prompt template in your application
import { promptTemplateService } from "@/services/promptTemplateService";

// Test the template with variables
const response = await promptTemplateService.testTemplate(
  "${template.id}", 
  {${template.variables?.map(v => `\n    ${v}: "your ${v} value"`).join(',') || ''}
  }
);`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium">API Endpoint</h3>
                            <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                {`// POST /api/prompt-templates/${template.id}/test
{
  "variables": {${template.variables?.map(v => `\n    "${v}": "your ${v} value"`).join(',') || ''}
  }
}`}
                            </pre>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TemplateDetail; 