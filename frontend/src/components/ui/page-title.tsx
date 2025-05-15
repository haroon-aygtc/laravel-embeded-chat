import React from 'react';

interface PageTitleProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageTitle({ title, description, actions }: PageTitleProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
} 