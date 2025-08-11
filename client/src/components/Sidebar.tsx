import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Shield,
  Database,
  UserCheck,
  FileText,
  AlertTriangle,
  Lock,
  Globe,
  Bell,
  Users,
  BarChart3,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Data Inventory", href: "/data-inventory", icon: Database },
  { name: "Consent Tracker", href: "/consent-tracker", icon: UserCheck },
  { name: "DSAR Manager", href: "/dsar-manager", icon: FileText },
  { name: "Privacy Notices", href: "/privacy-notices", icon: Shield },
  { name: "Incident Logbook", href: "/incident-logbook", icon: AlertTriangle },
  { name: "SSL Certificates", href: "/ssl-certificates", icon: Lock },
  { name: "Domain Monitor", href: "/domain-monitor", icon: Globe },
  { name: "Alert Settings", href: "/alert-settings", icon: Bell },
  { name: "Team Management", href: "/team-management", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Privacy Guard
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5",
                    collapsed ? "mx-auto" : "mr-3",
                    isActive
                      ? "text-blue-700 dark:text-blue-200"
                      : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                  )}
                />
                {!collapsed && item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}