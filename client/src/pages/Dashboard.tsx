import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, 
  FileText, 
  Lock, 
  Database, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Plus,
  Users,
  CheckCircle,
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: dsarRequests, isLoading: dsarLoading } = useQuery({
    queryKey: ["/api/dsar-requests"],
    retry: false,
  });

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ["/api/domains"],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to fetch dashboard statistics. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentDsarRequests = dsarRequests?.slice(0, 3) || [];
  const domainsWithCerts = domains?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-3xl font-bold text-secondary">{stats.complianceScore}%</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Good standing
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open DSARs</p>
                <p className="text-3xl font-bold text-foreground">{stats.openDsars}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SSL Certificates</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalDomains}</p>
                <p className="text-xs text-orange-600 mt-1 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.expiringCerts} expiring soon
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Types</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalDataTypes}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Database className="w-3 h-3 mr-1" />
                  Inventory managed
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent DSAR Requests */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent DSAR Requests</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/dsar-manager">
                    View All <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dsarLoading ? (
                <div className="p-6">Loading DSAR requests...</div>
              ) : recentDsarRequests.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No DSAR requests yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="/dsar-manager">Create First Request</a>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentDsarRequests.map((request: any) => (
                    <div key={request.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{request.subjectName || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground truncate">{request.subjectEmail}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Submitted {new Date(request.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="capitalize">
                            {request.requestType.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={request.status === 'completed' ? 'default' : 'destructive'}
                            className="capitalize"
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SSL Certificate Status */}
          <Card className="mt-8">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">SSL Certificate Status</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <a href="/domain-monitor">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {domainsLoading ? (
                <div>Loading domains...</div>
              ) : domainsWithCerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No domains monitored yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="/domain-monitor">Add First Domain</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {domainsWithCerts.map((domain: any) => {
                    const cert = domain.sslCertificates?.[0];
                    const isValid = cert?.isValid;
                    const expiresAt = cert?.validTo ? new Date(cert.validTo) : null;
                    const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                    
                    return (
                      <div key={domain.id} className={`flex items-center justify-between p-4 rounded-lg ${
                        isValid && daysUntilExpiry && daysUntilExpiry > 30 
                          ? 'bg-green-50 dark:bg-green-950' 
                          : daysUntilExpiry && daysUntilExpiry <= 7
                          ? 'bg-red-50 dark:bg-red-950'
                          : 'bg-orange-50 dark:bg-orange-950'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isValid && daysUntilExpiry && daysUntilExpiry > 30
                              ? 'bg-green-100 dark:bg-green-900'
                              : daysUntilExpiry && daysUntilExpiry <= 7
                              ? 'bg-red-100 dark:bg-red-900'
                              : 'bg-orange-100 dark:bg-orange-900'
                          }`}>
                            {isValid && daysUntilExpiry && daysUntilExpiry > 30 ? (
                              <CheckCircle className="w-4 h-4 text-secondary" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{domain.name}</p>
                            <p className="text-xs text-muted-foreground">{cert?.issuer || 'No certificate'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {expiresAt && (
                            <span className="text-sm text-muted-foreground">
                              Expires: {expiresAt.toLocaleDateString()}
                            </span>
                          )}
                          <Badge variant={
                            isValid && daysUntilExpiry && daysUntilExpiry > 30 
                              ? 'default'
                              : 'destructive'
                          }>
                            {!cert ? 'No Certificate' 
                             : !isValid ? 'Invalid'
                             : daysUntilExpiry && daysUntilExpiry <= 0 ? 'Expired'
                             : daysUntilExpiry && daysUntilExpiry <= 7 ? `Expires in ${daysUntilExpiry} days`
                             : 'Valid'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button className="w-full justify-center" asChild>
                <a href="/dsar-manager">
                  <Plus className="w-4 h-4 mr-2" />
                  New DSAR Request
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-center" asChild>
                <a href="/data-inventory">
                  <Database className="w-4 h-4 mr-2" />
                  Add Data Type
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-center" asChild>
                <a href="/reports">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-center" asChild>
                <a href="/incident-logbook">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Log Incident
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Compliance Trends */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold">Compliance Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">GDPR Compliance</span>
                    <span className="text-sm font-medium text-secondary">96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">CCPA Compliance</span>
                    <span className="text-sm font-medium text-primary">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Data Security</span>
                    <span className="text-sm font-medium text-purple-600">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Improvement Suggestion</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Update 3 privacy notices to meet latest CCPA requirements and boost compliance to 98%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
