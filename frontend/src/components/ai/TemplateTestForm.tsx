import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PromptTemplate } from "@/services/promptTemplateService";

interface TemplateTestFormProps {
    template: PromptTemplate;
    onTest: (templateId: string, variables: Record<string, string>) => Promise<string>;
}

const TemplateTestForm = ({ template, onTest }: TemplateTestFormProps) => {
    const [result, setResult] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<Record<string, string>>({
        defaultValues: template.variables?.reduce((acc, varName) => {
            acc[varName] = "";
            return acc;
        }, {} as Record<string, string>) || {}
    });

    const handleTest = async (data: Record<string, string>) => {
        setIsTesting(true);
        setError(null);
        setResult(null);

        try {
            const response = await onTest(template.id, data);
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsTesting(false);
        }
    };

    if (!template.variables || template.variables.length === 0) {
        return (
            <div className="text-sm text-muted-foreground">
                This template doesn't have any variables to test.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleTest)} className="space-y-4">
                    {template.variables.map((variable) => (
                        <FormField
                            key={variable}
                            control={form.control}
                            name={variable}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{variable}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={`Enter value for ${variable}`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}

                    <Button type="submit" disabled={isTesting}>
                        {isTesting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            "Test Template"
                        )}
                    </Button>
                </form>
            </Form>

            {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mt-4">
                    {error}
                </div>
            )}

            {result && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-base">Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">
                            {result}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TemplateTestForm; 