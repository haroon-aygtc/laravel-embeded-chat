import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { api } from "./api/middleware/apiMiddleware";
import { chatEndpoints } from "./api/endpoints/chatEndpoints";
import axios from "axios";
import { authHeader } from "@/utils/authHeader";
import { API_BASE_URL } from "@/config/api";

export interface ChatMessage {
    created_at: string | number | Date;
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: string;
    contextSnippets?: string[];
    attachments?: Array<{
        type: string;
        url: string;
        name: string;
        size?: number;
    }>;
}

export interface ChatSession {
    id: string;
    name: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
    contextRuleId?: string;
    contextName?: string;
    contextMode?: 'restricted' | 'general';
}

const SESSION_STORAGE_KEY = 'chat_sessions';

// Local storage helper functions
const loadSessions = (): ChatSession[] => {
    try {
        const sessionsJson = localStorage.getItem(SESSION_STORAGE_KEY);
        return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
        logger.error('Error loading chat sessions:', error);
        return [];
    }
};

const saveSessions = (sessions: ChatSession[]): void => {
    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
        logger.error('Error saving chat sessions:', error);
    }
};

// Chat service API
export const chatService = {
    /**
     * Get all chat sessions
     */
    getSessions: async (): Promise<ChatSession[]> => {
        try {
            const response = await api.get<ChatSession[]>(chatEndpoints.sessions);
            if (!response.success || !response.data) {
                throw new Error('Failed to fetch chat sessions');
            }
            return response.data;
        } catch (error) {
            logger.error('Error fetching chat sessions:', error);
            return [];
        }
    },

    /**
     * Get a specific chat session
     */
    getSession: async (sessionId: string): Promise<ChatSession | null> => {
        try {
            const response = await api.get<ChatSession>(chatEndpoints.sessionById(sessionId));
            if (!response.success || !response.data) {
                throw new Error('Failed to fetch chat session');
            }
            return response.data;
        } catch (error) {
            logger.error(`Error fetching chat session ${sessionId}:`, error);
            return null;
        }
    },

    /**
     * Create a new chat session
     */
    createSession: async (name: string = 'New Chat', contextOptions?: {
        contextRuleId?: string;
        contextName?: string;
        contextMode?: 'restricted' | 'general';
    }): Promise<ChatSession | null> => {
        try {
            const sessionData = {
                name,
                ...contextOptions
            };

            const response = await api.post<ChatSession>(chatEndpoints.sessions, sessionData);
            if (!response.success || !response.data) {
                throw new Error('Failed to create chat session');
            }
            return response.data;
        } catch (error) {
            logger.error('Error creating chat session:', error);
            return null;
        }
    },

    /**
     * Update a chat session (rename, etc.)
     */
    updateSession: async (sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> => {
        try {
            const response = await api.put<ChatSession>(chatEndpoints.sessionById(sessionId), updates);
            if (!response.success || !response.data) {
                throw new Error('Failed to update chat session');
            }
            return response.data;
        } catch (error) {
            logger.error(`Error updating chat session ${sessionId}:`, error);
            return null;
        }
    },

    /**
     * Delete a chat session
     */
    deleteSession: async (sessionId: string): Promise<boolean> => {
        try {
            const response = await api.delete<{ message: string }>(chatEndpoints.sessionById(sessionId));
            return response.success;
        } catch (error) {
            logger.error(`Error deleting chat session ${sessionId}:`, error);
            return false;
        }
    },

    /**
     * Get messages from a chat session
     */
    getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        try {
            const response = await api.get<ChatMessage[]>(chatEndpoints.sessionMessages(sessionId));
            if (!response.success || !response.data) {
                throw new Error('Failed to fetch chat messages');
            }
            return response.data;
        } catch (error) {
            logger.error(`Error fetching messages for session ${sessionId}:`, error);
            return [];
        }
    },

    /**
     * Add a message to a chat session and get AI response
     */
    sendMessage: async (sessionId: string, content: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
                content,
                type: 'text',
            }, {
                headers: authHeader()
            });

            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    /**
     * Clear all messages in a chat session
     */
    clearMessages: async (sessionId: string): Promise<boolean> => {
        try {
            const response = await api.delete<{ message: string }>(chatEndpoints.sessionMessages(sessionId));
            return response.success;
        } catch (error) {
            logger.error(`Error clearing messages in session ${sessionId}:`, error);
            return false;
        }
    }
};

export default chatService;
