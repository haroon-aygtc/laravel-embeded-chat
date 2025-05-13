import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { usePromptTemplates } from "@/hooks/usePromptTemplates";

const templateFormSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    template: z.string().min(10, "Template must be at least 10 characters"),
    category: z.string().min(1, "Category is required"),
    variables: z.string().optional(),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof templateFormSchema>;

export default function NewTemplatePage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const { createTemplate, isSaving } = usePromptTemplates({ initialLoad: false });

    const form = useForm<FormValues>({
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

    const onSubmit = async (data: FormValues) => {
        try {
            // Parse variables from comma-separated string to array
            const variables = data.variables
                ? data.variables.split(",").map(v => v.trim()).filter(v => v)
                : [];

            const newTemplate = await createTemplate({
                name: data.name,
                description: data.description,
                template: data.template,
                category: data.category,
                variables,
                isActive: data.isActive,
            });

            navigate(`/admin/templates/${newTemplate.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/admin/templates")}
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Templates
                </Button>
                <h1 className="text-2xl font-bold ml-4">Create New Template</h1>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Template Details</CardTitle>
                    <CardDescription>
                        Create a new prompt template for your AI system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                Comma-separated list of variables
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="template"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Template Content</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter your prompt template with variables in {{variable}} format"
                                                className="min-h-[200px]"
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

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Active Status</FormLabel>
                                            <FormDescription>
                                                Enable or disable this template
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/admin/templates")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Template"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
} 