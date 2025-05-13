import React, { useState } from "react";
import { PlusCircle, Edit, Trash2, Save, X, Copy, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { usePromptTemplates } from "@/hooks/usePromptTemplates";
import { PromptTemplate } from "@/services/promptTemplateService";

// Form validation schema
const templateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  template: z.string().min(10, "Template must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  variables: z.string().optional(),
  isActive: z.boolean().default(true),
});

const PromptTemplates = () => {
  const {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isSaving
  } = usePromptTemplates();

  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Extract unique categories whenever templates change
  React.useEffect(() => {
    const uniqueCategories = ["all", ...new Set(templates.map(t => t.category || "general"))];
    setCategories(uniqueCategories);
  }, [templates]);

  const form = useForm({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      template: "",
      category: "general",
      variables: "",
      isActive: true,
    },
  });

  const handleCreateTemplate = async (data: z.infer<typeof templateFormSchema>) => {
    try {
      // Parse variables from comma-separated string to array
      const variables = data.variables
        ? data.variables.split(",").map(v => v.trim()).filter(v => v)
        : [];

      await createTemplate({
        name: data.name,
        description: data.description || "",
        template: data.template,
        category: data.category,
        variables,
        isActive: data.isActive,
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (err) {
      // Error handling is managed by the hook
    }
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      template: template.template,
      category: template.category || "general",
      variables: template.variables?.join(", ") || "",
      isActive: template.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTemplate = async (data: z.infer<typeof templateFormSchema>) => {
    if (!editingTemplate) return;

    try {
      // Parse variables from comma-separated string to array
      const variables = data.variables
        ? data.variables.split(",").map(v => v.trim()).filter(v => v)
        : [];

      await updateTemplate(
        editingTemplate.id,
        {
          name: data.name,
          description: data.description,
          template: data.template,
          category: data.category,
          variables,
          isActive: data.isActive,
        }
      );

      setIsDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
    } catch (err) {
      // Error handling is managed by the hook
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
    } catch (err) {
      // Error handling is managed by the hook
    }
  };

  const handleDuplicateTemplate = async (template: PromptTemplate) => {
    try {
      await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        template: template.template,
        category: template.category,
        variables: template.variables,
        isActive: template.isActive,
      });
    } catch (err) {
      // Error handling is managed by the hook
    }
  };

  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((t) => t.category === activeTab);

  return (
    <div className="w-full p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prompt Templates</h1>
          <p className="text-muted-foreground">
            Manage and customize AI prompt templates for your chat system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Update the details of your prompt template."
                  : "Create a new prompt template for your chat system."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  editingTemplate ? handleUpdateTemplate : handleCreateTemplate,
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., General Information Query"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of when to use this template"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., general, support, uae-gov"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Category helps organize templates
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variables</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., question, topic, product, issue"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of variables used in the template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your prompt template with variables in {{variable}} format"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use {'{{'}variable{'}}'}  syntax for dynamic content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="gap-2">
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingTemplate ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingTemplate ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading templates...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <Button onClick={fetchTemplates} variant="outline" className="mt-2">
            Retry
          </Button>
        </Alert>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category === "all" ? "All Templates" : category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  No templates found in this category.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Create your first template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Category:{" "}
                            <span className="capitalize">
                              {template.category || "general"}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateTemplate(template)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTemplate(template)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-auto max-h-[100px]">
                        {template.template}
                      </div>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold mb-1">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <span
                                key={variable}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                              >
                                {variable}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground border-t pt-3">
                      <div className="w-full flex justify-between">
                        <span>
                          Created:{" "}
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Updated:{" "}
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PromptTemplates;
