import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { promptTemplateService, PromptTemplate } from "@/services/promptTemplateService";

interface UsePromptTemplatesOptions {
    initialLoad?: boolean;
    userId?: string;
}

interface UsePromptTemplatesReturn {
    templates: PromptTemplate[];
    isLoading: boolean;
    error: Error | null;
    fetchTemplates: () => Promise<PromptTemplate[]>;
    fetchUserTemplates: (userId: string) => Promise<PromptTemplate[]>;
    createTemplate: (template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => Promise<PromptTemplate>;
    updateTemplate: (id: string, template: Partial<PromptTemplate>) => Promise<PromptTemplate>;
    deleteTemplate: (id: string) => Promise<boolean>;
    testTemplate: (id: string, variables: Record<string, string>) => Promise<string>;
    categories: string[];
    fetchCategories: () => Promise<string[]>;
    isSaving: boolean;
}

/**
 * Custom hook for managing prompt templates
 */
export function usePromptTemplates({
    initialLoad = true,
    userId,
}: UsePromptTemplatesOptions = {}): UsePromptTemplatesReturn {
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(initialLoad);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await promptTemplateService.getAllTemplates();
            setTemplates(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            toast({
                variant: "destructive",
                title: "Error loading templates",
                description: error.message,
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const fetchUserTemplates = useCallback(async (uid: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await promptTemplateService.getUserTemplates(uid);
            setTemplates(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            toast({
                variant: "destructive",
                title: "Error loading user templates",
                description: error.message,
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await promptTemplateService.getCategories();
            setCategories(data);
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            toast({
                variant: "destructive",
                title: "Error loading categories",
                description: error.message,
            });
            throw error;
        }
    }, [toast]);

    const createTemplate = useCallback(async (template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => {
        setIsSaving(true);
        try {
            const newTemplate = await promptTemplateService.createTemplate(template);
            setTemplates(prev => [...prev, newTemplate]);
            toast({
                title: "Template created",
                description: "Your prompt template has been created successfully",
            });
            return newTemplate;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            toast({
                variant: "destructive",
                title: "Failed to create template",
                description: error.message,
            });
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [toast]);

    const updateTemplate = useCallback(async (id: string, templateUpdates: Partial<PromptTemplate>) => {
        setIsSaving(true);
        try {
            const updatedTemplate = await promptTemplateService.updateTemplate(id, templateUpdates);
            setTemplates(prev =>
                prev.map(template => template.id === id ? updatedTemplate : template)
            );
            toast({
                title: "Template updated",
                description: "Your prompt template has been updated successfully",
            });
            return updatedTemplate;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            toast({
                variant: "destructive",
                title: "Failed to update template",
                description: error.message,
            });
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [toast]);

    const deleteTemplate = useCallback(async (id: string) => {
        try {
            await promptTemplateService.deleteTemplate(id);
            setTemplates(prev => prev.filter(template => template.id !== id));
            toast({
                title: "Template deleted",
                description: "The template has been successfully deleted",
            });
            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            toast({
                variant: "destructive",
                title: "Failed to delete template",
                description: error.message,
            });
            throw error;
        }
    }, [toast]);

    const testTemplate = useCallback(async (id: string, variables: Record<string, string>) => {
        try {
            const result = await promptTemplateService.testTemplate(id, variables);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            toast({
                variant: "destructive",
                title: "Failed to test template",
                description: error.message,
            });
            throw error;
        }
    }, [toast]);

    // Initial load
    useEffect(() => {
        if (initialLoad) {
            if (userId) {
                fetchUserTemplates(userId);
            } else {
                fetchTemplates();
            }
            fetchCategories();
        }
    }, [initialLoad, userId, fetchTemplates, fetchUserTemplates, fetchCategories]);

    return {
        templates,
        isLoading,
        error,
        fetchTemplates,
        fetchUserTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        testTemplate,
        categories,
        fetchCategories,
        isSaving,
    };
} 