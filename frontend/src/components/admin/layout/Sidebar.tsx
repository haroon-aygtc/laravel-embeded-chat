import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    Settings,
    Shield,
    Layers,
    UserCog
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
        title: 'Widgets',
        href: '/admin/widgets',
        icon: <Layers className="h-5 w-5" />,
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
        title: 'Embed Code',
        href: '/admin/embed-code',
        icon: <Code className="h-5 w-5" />,
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

    // Track expanded menu items
    const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});

    // Check if the current path matches a menu item or its subitems
    const isActiveItem = (item: any) => {
        if (location.pathname === item.href) return true;
        if (location.pathname.startsWith(item.href + '/')) return true;

        // Check subitems if they exist
        if (item.subItems) {
            return item.subItems.some((subItem: any) =>
                location.pathname === subItem.href ||
                location.pathname.startsWith(subItem.href + '/')
            );
        }

        return false;
    };

    // Toggle expanded state for an item or navigate if no subitems
    const handleItemClick = (item: any) => {
        if (item.subItems && !collapsed) {
            setExpandedItems(prev => ({
                ...prev,
                [item.href]: !prev[item.href]
            }));
        } else {
            // Navigate to the item's href if no subitems or if sidebar is collapsed
            navigate(item.href);
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
                            <div
                                className={cn(
                                    "flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer",
                                    isActiveItem(item)
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                                    collapsed ? "justify-center" : "justify-between"
                                )}
                                onClick={() => handleItemClick(item)}
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
                            </div>

                            {/* Subitems */}
                            {!collapsed && item.subItems && expandedItems[item.href] && (
                                <ul className="mt-1 ml-6 space-y-1">
                                    {item.subItems.map((subItem) => (
                                        <li key={subItem.href}>
                                            {subItem.permission ? (
                                                <PermissionGate permissions={subItem.permission}>
                                                    <Link
                                                        to={subItem.href}
                                                        className={cn(
                                                            "flex items-center px-3 py-2 rounded-md transition-colors text-sm",
                                                            location.pathname === subItem.href ||
                                                                location.pathname.startsWith(subItem.href + '/')
                                                                ? "bg-gray-800 text-white"
                                                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                                                        )}
                                                    >
                                                        {subItem.icon}
                                                        <span className="ml-2">{subItem.title}</span>
                                                    </Link>
                                                </PermissionGate>
                                            ) : (
                                                <Link
                                                    to={subItem.href}
                                                    className={cn(
                                                        "flex items-center px-3 py-2 rounded-md transition-colors text-sm",
                                                        location.pathname === subItem.href ||
                                                            location.pathname.startsWith(subItem.href + '/')
                                                            ? "bg-gray-800 text-white"
                                                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                                                    )}
                                                >
                                                    {subItem.icon}
                                                    <span className="ml-2">{subItem.title}</span>
                                                </Link>
                                            )}
                                        </li>
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

