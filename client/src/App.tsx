import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import DataInventory from "./pages/DataInventory";
import ConsentTracker from "./pages/ConsentTracker";
import DSARManager from "./pages/DSARManager";
import PrivacyNotices from "./pages/PrivacyNotices";
import IncidentLogbook from "./pages/IncidentLogbook";
import DomainMonitor from "./pages/DomainMonitor";
import SSLCertificates from "./pages/SSLCertificates";
import AlertSettings from "./pages/AlertSettings";
import Settings from "./pages/Settings";
import TeamManagement from "./pages/TeamManagement";
import Reports from "./pages/Reports";
import NotFoundPage from "./pages/not-found";
import InstallWizard from "./pages/InstallWizard";
import { useAuth } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function InstallationChecker({ children }: { children: React.ReactNode }) {
  const [installationStatus, setInstallationStatus] = useState<{
    isInstalled: boolean;
    loading: boolean;
  }>({ isInstalled: false, loading: true });

  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const response = await fetch('/api/install/status');
        const status = await response.json();
        setInstallationStatus({
          isInstalled: status.isInstalled,
          loading: false
        });
      } catch (error) {
        console.error('Failed to check installation status:', error);
        setInstallationStatus({
          isInstalled: false,
          loading: false
        });
      }
    };

    checkInstallation();
  }, []);

  if (installationStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking system status...</p>
        </div>
      </div>
    );
  }

  if (!installationStatus.isInstalled) {
    return <InstallWizard />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/install" element={<InstallWizard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/data-inventory" element={<DataInventory />} />
        <Route path="/consent-tracker" element={<ConsentTracker />} />
        <Route path="/dsar-manager" element={<DSARManager />} />
        <Route path="/privacy-notices" element={<PrivacyNotices />} />
        <Route path="/incident-logbook" element={<IncidentLogbook />} />
        <Route path="/ssl-certificates" element={<SSLCertificates />} />
        <Route path="/domain-monitor" element={<DomainMonitor />} />
        <Route path="/alert-settings" element={<AlertSettings />} />
        <Route path="/team-management" element={<TeamManagement />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <InstallationChecker>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/install" element={<InstallWizard />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/data-inventory" element={<ProtectedRoute><Layout><DataInventory /></Layout></ProtectedRoute>} />
              <Route path="/consent-tracker" element={<ProtectedRoute><Layout><ConsentTracker /></Layout></ProtectedRoute>} />
              <Route path="/dsar-manager" element={<ProtectedRoute><Layout><DSARManager /></Layout></ProtectedRoute>} />
              <Route path="/privacy-notices" element={<ProtectedRoute><Layout><PrivacyNotices /></Layout></ProtectedRoute>} />
              <Route path="/incident-logbook" element={<ProtectedRoute><Layout><IncidentLogbook /></Layout></ProtectedRoute>} />
              <Route path="/domain-monitor" element={<ProtectedRoute><Layout><DomainMonitor /></Layout></ProtectedRoute>} />
              <Route path="/ssl-certificates" element={<ProtectedRoute><Layout><SSLCertificates /></Layout></ProtectedRoute>} />
              <Route path="/alert-settings" element={<ProtectedRoute><Layout><AlertSettings /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/team-management" element={<ProtectedRoute><Layout><TeamManagement /></Layout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </InstallationChecker>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;