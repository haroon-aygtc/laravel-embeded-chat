import React from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import {
    ChevronLeft,
    ChevronRight,
    ServerIcon,
    LayoutDashboard,
    Users,
    MessageSquare,
    FileText,
    Database,
    Code,
    Code2,
    Settings,
    Shield,
    UserCog,
    PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/auth/PermissionGate";

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: <Users className="h-5 w-5" />,
        subItems: [
            {
                title: 'User List',
                href: '/admin/users',
                icon: <Users className="h-4 w-4" />,
            },
            {
                title: 'Role Management',
                href: '/admin/user/roles',
                icon: <UserCog className="h-4 w-4" />,
                permission: 'manage_users',
            }
        ]
    },
    {
        title: 'Context Rules',
        href: '/admin/context-rules',
        icon: <MessageSquare className="h-5 w-5" />,
    },
    {
        title: 'Templates',
        href: '/admin/templates',
        icon: <FileText className="h-5 w-5" />,
    },
    {
        title: 'Knowledge Base',
        href: '/admin/knowledge-base',
        icon: <Database className="h-5 w-5" />,
    },
    {
        title: 'Widgets',
        href: '/admin/widgets',
        icon: <Code className="h-5 w-5" />,
        subItems: [
            {
                title: 'Widget List',
                href: '/admin/widgets',
                icon: <Code className="h-4 w-4" />,
            },
            {
                title: 'Create Widget',
                href: '/admin/widgets/create',
                icon: <PlusCircle className="h-4 w-4" />,
            },
            {
                title: 'Embed Code',
                href: '/admin/embed-code',
                icon: <Code2 className="h-4 w-4" />,
                directNavigate: true,
            },
        ]
    },
    {
        title: 'AI Providers',
        href: '/admin/ai-providers',
        icon: <ServerIcon className="h-5 w-5" />,
    },
    {
        title: 'Moderation',
        href: '/admin/moderation/queue',
        icon: <Shield className="h-5 w-5" />,
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: <Settings className="h-5 w-5" />,
    },
];

const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { activeSection } = useAdmin();

    // Determine if we're on an AI provider-related page
    const isAIProviderRoute = location.pathname.includes('/admin/ai-providers');

    // Track expanded menu items - initialize with Widgets expanded if on embed-code page
    const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({
        '/admin/widgets': location.pathname === '/admin/embed-code'
    });

    // Log for debugging and handle special routes
    React.useEffect(() => {
        console.log("Current location:", location.pathname);
        console.log("AI Provider route?", isAIProviderRoute);
        console.log("Search params:", Object.fromEntries(searchParams.entries()));
        console.log("Current provider:", searchParams.get('provider'));

        // Ensure Widgets submenu is expanded when on embed-code page
        if (location.pathname === '/admin/embed-code') {
            console.log("On embed-code page, ensuring Widgets submenu is expanded");
            setExpandedItems(prev => ({
                ...prev,
                '/admin/widgets': true
            }));

            // Set active section to embed
            if (activeSection !== 'embed') {
                console.log("Setting active section to embed");
            }
        }
    }, [location.pathname, isAIProviderRoute, searchParams, activeSection]);

    // Check if the current path or active section matches a menu item
    const isActiveItem = (item: any) => {
        // Special case for Embed Code
        if (location.pathname === '/admin/embed-code') {
            if (item.href === '/admin/embed-code') return true;
            if (item.title === 'Widgets') return true;
        }

        // Check if the path matches
        if (location.pathname === item.href) return true;
        if (location.pathname.startsWith(item.href + '/')) return true;

        // Check if the active section matches
        if (item.href.includes('/context-rules') && activeSection === 'context') return true;
        if (item.href.includes('/templates') && activeSection === 'templates') return true;
        if (item.href.includes('/knowledge-base') && activeSection === 'knowledge') return true;
        if (item.href.includes('/embed-code') && activeSection === 'embed') return true;
        if (item.href.includes('/dashboard') && activeSection === 'overview') return true;
        if (item.href.includes('/ai-providers') && activeSection === 'ai') return true;
        if (item.href.includes('/moderation') && activeSection === 'moderation') return true;
        if (item.href.includes('/settings') && activeSection === 'settings') return true;

        // Check subitems if they exist
        if (item.subItems) {
            return item.subItems.some((subItem: any) => {
                // Special case for embed-code in subitems
                if (location.pathname === '/admin/embed-code' && subItem.href === '/admin/embed-code') return true;

                return location.pathname === subItem.href ||
                    location.pathname.startsWith(subItem.href + '/');
            });
        }

        return false;
    };

    // Toggle expanded state for items with subitems
    const handleItemClick = (e: React.MouseEvent, item: any) => {
        // Always prevent default for items with subitems to avoid navigation
        if (item.subItems && !collapsed) {
            e.preventDefault();
            // Just toggle the expanded state for items with subitems
            setExpandedItems(prev => ({
                ...prev,
                [item.href]: !prev[item.href]
            }));

            console.log(`Toggled expanded state for ${item.title}`);
        }
        // We don't handle navigation here - Link components handle that
    };

    // Handle subitem click
    const handleSubItemClick = (_e: React.MouseEvent, subItem: any) => {
        // Don't need to prevent default here - we want normal navigation
        console.log(`Navigating to ${subItem.href}`);

        // For items that need direct navigation (like embed-code)
        if (subItem.directNavigate || subItem.href === '/admin/embed-code') {
            console.log(`Direct navigating to ${subItem.href}`);
            // Use navigate with replace to avoid history issues
            navigate(subItem.href, { replace: true });
        } else {
            // Use navigate for normal navigation
            navigate(subItem.href);
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-gray-900 text-white transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                {!collapsed && <h1 className="text-xl font-bold">Admin</h1>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="text-gray-400 hover:text-white"
                >
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </Button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {sidebarItems.map((item) => (
                        <li key={item.href} className="space-y-1">
                            {item.subItems ? (
                                // For items with subitems, use Link but handle onClick to toggle expanding
                                <Link
                                    to={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                                        isActiveItem(item)
                                            ? "bg-gray-800 text-white"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800",
                                        collapsed ? "justify-center" : "justify-between"
                                    )}
                                    onClick={(e) => handleItemClick(e, item)}
                                >
                                    <div className="flex items-center">
                                        {item.icon}
                                        {!collapsed && <span className="ml-3">{item.title}</span>}
                                    </div>

                                    {!collapsed && item.subItems && (
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                expandedItems[item.href] ? "rotate-90" : ""
                                            )}
                                        />
                                    )}
                                </Link>
                            ) : (
                                // For items without subitems, use Link component
                                item.title === 'AI Providers' ? (
                                    // Special handling for AI Providers to maintain state
                                    <div
                                        onClick={() => {
                                            // Get current provider or default to openai
                                            const currentProvider = searchParams.get('provider') || 'openai';
                                            console.log(`Navigating to AI Providers with provider=${currentProvider}`);

                                            // Use navigate with replace: true to ensure the URL is updated correctly
                                            // and doesn't create a new history entry
                                            navigate(`/admin/ai-providers?provider=${currentProvider}`, { replace: true });
                                        }}
                                        className={cn(
                                            "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                                            isActiveItem(item)
                                                ? "bg-gray-800 text-white"
                                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                                            collapsed && "justify-center"
                                        )}
                                    >
                                        {item.icon}
                                        {!collapsed && <span className="ml-3">{item.title}</span>}
                                    </div>
                                ) : (
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            "flex items-center px-3 py-2 rounded-md transition-colors",
                                            isActiveItem(item)
                                                ? "bg-gray-800 text-white"
                                                : "text-gray-400 hover:text-white hover:bg-gray-800",
                                            collapsed && "justify-center"
                                        )}
                                    >
                                        {item.icon}
                                        {!collapsed && <span className="ml-3">{item.title}</span>}
                                    </Link>
                                )
                            )}

                            {/* Display subItems for expanded items */}
                            {!collapsed && item.subItems && expandedItems[item.href] && (
                                <ul className="mt-1 pl-8 space-y-1">
                                    {item.subItems.map((subItem: any) => (
                                        <PermissionGate
                                            key={subItem.href}
                                            permissions={subItem.permission}
                                            fallback={null}
                                        >
                                            <li>
                                                <div
                                                    className={cn(
                                                        "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                                                        isActiveItem(subItem)
                                                            ? "bg-gray-800 text-white"
                                                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                                                    )}
                                                    onClick={(_e) => handleSubItemClick(_e, subItem)}
                                                >
                                                    {subItem.icon}
                                                    <span className="ml-3">{subItem.title}</span>
                                                </div>
                                            </li>
                                        </PermissionGate>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800">
                {!collapsed && (
                    <div className="text-xs text-gray-500">
                        <p>The Last Lab Admin</p>
                        <p>v1.0.0</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;

