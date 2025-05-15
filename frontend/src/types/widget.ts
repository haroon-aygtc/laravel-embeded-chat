/**
 * Type definitions for widget functionality
 */

export interface Widget {
    id: string;
    name: string;
    description?: string;
    title: string;
    subtitle?: string;
    domain?: string;
    userId: string;
    contextRuleId?: string;
    responseFormattingId?: string;
    followUpConfigId?: string;
    knowledgeBaseIds?: string[];
    isActive: boolean;
    visualSettings: {
        primaryColor: string;
        secondaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
        fontFamily?: string;
    };
    behavioralSettings: {
        initialState: "open" | "closed" | "minimized";
        autoOpen?: boolean;
        openDelay?: number;
    };
    contentSettings: {
        initialMessage?: string;
        placeholderText?: string;
        allowAttachments?: boolean;
        allowVoice?: boolean;
        allowEmoji?: boolean;
    };
    allowedDomains?: string[];
    createdAt: string;
    updatedAt: string;
} 