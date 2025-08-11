import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import DataInventory from "@/pages/DataInventory";
import ConsentTracker from "@/pages/ConsentTracker";
import DSARManager from "@/pages/DSARManager";
import PrivacyNotices from "@/pages/PrivacyNotices";
import IncidentLogbook from "@/pages/IncidentLogbook";
import SSLCertificates from "@/pages/SSLCertificates";
import DomainMonitor from "@/pages/DomainMonitor";
import AlertSettings from "@/pages/AlertSettings";
import TeamManagement from "@/pages/TeamManagement";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/data-inventory" component={DataInventory} />
        <Route path="/consent-tracker" component={ConsentTracker} />
        <Route path="/dsar-manager" component={DSARManager} />
        <Route path="/privacy-notices" component={PrivacyNotices} />
        <Route path="/incident-logbook" component={IncidentLogbook} />
        <Route path="/ssl-certificates" component={SSLCertificates} />
        <Route path="/domain-monitor" component={DomainMonitor} />
        <Route path="/alert-settings" component={AlertSettings} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <AppContent />
          </Router>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Define AppContent to avoid issues with Router wrapping
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/data-inventory" component={DataInventory} />
        <Route path="/consent-tracker" component={ConsentTracker} />
        <Route path="/dsar-manager" component={DSARManager} />
        <Route path="/privacy-notices" component={PrivacyNotices} />
        <Route path="/incident-logbook" component={IncidentLogbook} />
        <Route path="/ssl-certificates" component={SSLCertificates} />
        <Route path="/domain-monitor" component={DomainMonitor} />
        <Route path="/alert-settings" component={AlertSettings} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;