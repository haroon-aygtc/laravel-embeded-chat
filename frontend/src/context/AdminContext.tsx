import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AdminContextType {
    activeSection: string;
    setActiveSection: (section: string) => void;
    refreshTrigger: number;
    triggerRefresh: () => void;
    navigateToSection: (section: string) => void;
    currentView: string;
    setCurrentView: (view: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Map tab sections to their corresponding routes
// This is kept for reference but not used directly anymore
// as we're using Link components for navigation
const _sectionToRouteMap: Record<string, string> = {
    'overview': '/admin/dashboard',
    'widgets': '/admin/dashboard?tab=widgets',
    'context': '/admin/context-rules',
    'templates': '/admin/templates',
    'knowledge': '/admin/knowledge-base',
    'embed': '/admin/embed-code',
    'logs': '/admin/logs',
    'analytics': '/admin/analytics',
    'settings': '/admin/settings',
    'users': '/admin/users',
    'aiconfig': '/admin/ai-config'
};

// Map routes to their corresponding tab sections
const routeToSectionMap: Record<string, string> = {
    '/admin/dashboard': 'overview',
    '/admin/widgets': 'widgets',
    '/admin/widgets/create': 'widgets',
    '/admin/widgets/edit': 'widgets',
    '/admin/widgets/edit/': 'widgets',
    '/admin/widgets/test': 'widgets',
    '/admin/context-rules': 'context',
    '/admin/templates': 'templates',
    '/admin/knowledge-base': 'knowledge',
    '/admin/embed-code': 'embed',
    '/admin/logs': 'logs',
    '/admin/analytics': 'analytics',
    '/admin/settings': 'settings',
    '/admin/users': 'users',
    '/admin/ai-config': 'aiconfig'
};

export function AdminProvider({ children }: { children: ReactNode }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [currentView, setCurrentView] = useState('dashboard');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const location = useLocation();

    // Sync active section with current route
    useEffect(() => {
        const path = location.pathname;

        // Only update if we're on an admin route
        if (path.startsWith('/admin')) {
            // Find the matching section for the current route
            let foundMatch = false;

            // Special handling for widget edit routes
            if (path.includes('/admin/widgets/edit/')) {
                setActiveSection('widgets');
                foundMatch = true;
                console.log('Matched widget edit route: Setting section to: widgets');
            } else if (path === '/admin/embed-code') {
                setActiveSection('embed');
                foundMatch = true;
                console.log('Matched embed code route: Setting section to: embed');
            } else {
                // Check for other routes
                for (const [route, section] of Object.entries(routeToSectionMap)) {
                    if (path.startsWith(route)) {
                        setActiveSection(section);
                        foundMatch = true;
                        console.log(`Route matched: ${route} -> Setting section to: ${section}`);
                        break;
                    }
                }
            }

            // If no match was found but we're on an admin route, default to overview
            if (!foundMatch) {
                setActiveSection('overview');
                console.log('No route match found, defaulting to overview section');
            }

            // Set current view based on the path
            const viewName = path.split('/').filter(Boolean)[1] || 'dashboard';
            setCurrentView(viewName);
            console.log(`Current view set to: ${viewName}`);
        }
    }, [location.pathname]);

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Update the active section without forcing navigation
    const navigateToSection = (section: string) => {
        console.log(`Setting active section to: ${section}`);
        setActiveSection(section);
        // We no longer force navigation here, as it can cause authentication issues
        // Instead, we just update the active section and let the Link components handle navigation
    };

    return (
        <AdminContext.Provider value={{
            activeSection,
            setActiveSection,
            refreshTrigger,
            triggerRefresh,
            navigateToSection,
            currentView,
            setCurrentView
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