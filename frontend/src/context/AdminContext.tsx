import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
    activeSection: string;
    setActiveSection: (section: string) => void;
    refreshTrigger: number;
    triggerRefresh: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <AdminContext.Provider value={{
            activeSection,
            setActiveSection,
            refreshTrigger,
            triggerRefresh
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin(): AdminContextType {
    const context = useContext(AdminContext);

    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }

    return context;
} 