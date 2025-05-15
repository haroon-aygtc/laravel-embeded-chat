import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string
    icon?: ReactNode
    actions?: ReactNode
    className?: string
}

export function PageHeader({
    title,
    description,
    icon,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row justify-between items-start gap-4", className)}>
            <div className="flex items-center gap-3">
                {icon && <div className="p-2 bg-muted rounded-lg">{icon}</div>}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="md:ml-auto">{actions}</div>}
        </div>
    )
} 