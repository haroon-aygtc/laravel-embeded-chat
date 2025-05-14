import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
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

// In-memory storage for development/testing
let sessions: ChatSession[] = [];

const loadSessions = (): ChatSession[] => {
    try {
        const saved = localStorage.getItem('chat_sessions');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load chat sessions from localStorage', e);
        return [];
    }
};

const saveSessions = (sessions: ChatSession[]): void => {
    try {
        localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save chat sessions to localStorage', e);
    }
};

// Initialize sessions from localStorage if available
sessions = loadSessions();

export const chatService = {
    /**
     * Create a new chat session
     */
    createSession: async (): Promise<ChatSession> => {
        const session: ChatSession = {
            id: uuidv4(),
            name: `Chat ${sessions.length + 1}`,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        sessions.push(session);
        saveSessions(sessions);
        return session;
    },

    /**
     * Get all sessions
     */
    getSessions: async (): Promise<ChatSession[]> => {
        return sessions;
    },

    /**
     * Get a specific session by ID
     */
    getSession: async (id: string): Promise<ChatMessage[]> => {
        const session = sessions.find(s => s.id === id);
        return session ? session.messages : [];
    },

    /**
     * Send a message in a session
     */
    sendMessage: async (sessionId: string, content: string): Promise<{ userMessage: ChatMessage; aiResponse: ChatMessage }> => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Create user message
        const userMessage: ChatMessage = {
            id: uuidv4(),
            content,
            role: 'user',
            timestamp: new Date().toISOString(),
        };

        // Create AI response (simulated)
        const aiResponse: ChatMessage = {
            id: uuidv4(),
            content: `This is a simulated response to: "${content}"`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
        };

        // Add messages to session
        session.messages.push(userMessage, aiResponse);
        session.updatedAt = new Date().toISOString();

        // Update storage
        saveSessions(sessions);

        return { userMessage, aiResponse };
    },

    /**
     * Clear messages in a session
     */
    clearSession: async (id: string): Promise<void> => {
        const index = sessions.findIndex(s => s.id === id);
        if (index !== -1) {
            sessions[index].messages = [];
            sessions[index].updatedAt = new Date().toISOString();
            saveSessions(sessions);
        }
    },

    /**
     * Delete a session
     */
    deleteSession: async (id: string): Promise<void> => {
        const index = sessions.findIndex(s => s.id === id);
        if (index !== -1) {
            sessions.splice(index, 1);
            saveSessions(sessions);
        }
    }
};

export default chatService;
