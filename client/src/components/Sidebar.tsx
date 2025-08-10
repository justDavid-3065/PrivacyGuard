import { Link, useLocation } from "wouter";
import { Shield, BarChart3, Database, Handshake, FileText, ClipboardList, AlertTriangle, Lock, Globe, Bell, Users, FileBarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, current: true },
];

const privacyCompliance = [
  { name: "Data Inventory", href: "/data-inventory", icon: Database },
  { name: "Consent Tracker", href: "/consent-tracker", icon: Handshake },
  { name: "DSAR Manager", href: "/dsar-manager", icon: FileText },
  { name: "Privacy Notices", href: "/privacy-notices", icon: ClipboardList },
  { name: "Incident Logbook", href: "/incident-logbook", icon: AlertTriangle },
];

const securityMonitoring = [
  { name: "SSL Certificates", href: "/ssl-certificates", icon: Lock },
  { name: "Domain Monitor", href: "/domain-monitor", icon: Globe },
  { name: "Alert Settings", href: "/alert-settings", icon: Bell },
];

const administration = [
  { name: "Team Management", href: "/team-management", icon: Users },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  const NavLink = ({ item }: { item: any }) => (
    <Link href={item.href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          location === item.href
            ? "text-primary bg-blue-50 dark:bg-blue-950"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
        {item.name}
      </a>
    </Link>
  );

  return (
    <aside className="w-64 bg-card shadow-lg border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">PrivacyGuard</h1>
            <p className="text-xs text-muted-foreground">Compliance Suite</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4 space-y-6">
        <div className="space-y-2">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
        
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Privacy Compliance
          </p>
          <div className="space-y-1">
            {privacyCompliance.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Security Monitoring
          </p>
          <div className="space-y-1">
            {securityMonitoring.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Administration
          </p>
          <div className="space-y-1">
            {administration.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
