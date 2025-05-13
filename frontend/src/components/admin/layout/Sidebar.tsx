import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ServerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const sidebarItems = [
    {
        title: 'AI Providers',
        href: '/admin/ai-providers',
        icon: <ServerIcon className="h-5 w-5" />,
    },
    // Add more sidebar items as needed
];

const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();

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

            <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                    {sidebarItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                to={item.href}
                                className={cn(
                                    "flex items-center px-3 py-2 rounded-md transition-colors",
                                    location.pathname === item.href
                                        ? "bg-gray-800 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                                    collapsed ? "justify-center" : "justify-start"
                                )}
                            >
                                {item.icon}
                                {!collapsed && <span className="ml-3">{item.title}</span>}
                            </Link>
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

