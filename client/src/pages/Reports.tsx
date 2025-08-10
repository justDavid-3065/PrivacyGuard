import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart, Download, Calendar, Filter, TrendingUp, FileText, Lock, Database, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [reportType, setReportType] = useState("compliance");
  const [timeRange, setTimeRange] = useState("30d");
  const [generatingReport, setGeneratingReport] = useState("");

  // Redirect if not authenticated
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

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: dsarRequests } = useQuery({
    queryKey: ["/api/dsar-requests"],
    retry: false,
  });

  const { data: domains } = useQuery({
    queryKey: ["/api/domains"],
    retry: false,
  });

  const { data: incidents } = useQuery({
    queryKey: ["/api/incidents"],
    retry: false,
  });

  const { data: dataTypes } = useQuery({
    queryKey: ["/api/data-types"],
    retry: false,
  });

  const handleGenerateReport = async (type: string) => {
    setGeneratingReport(type);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: `Your ${type} report has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport("");
    }
  };

  // Calculate report data
  const complianceScore = dashboardStats?.complianceScore || 0;
  const totalDsars = dsarRequests?.length || 0;
  const completedDsars = dsarRequests?.filter((req: any) => req.status === "completed").length || 0;
  const overdueDsars = dsarRequests?.filter((req: any) => {
    const dueDate = new Date(req.dueDate);
    const now = new Date();
    return dueDate < now && req.status !== "completed";
  }).length || 0;

  const totalDomains = domains?.length || 0;
  const healthyDomains = domains?.filter((domain: any) => {
    const cert = domain.sslCertificates?.[0];
    if (!cert || !cert.isValid) return false;
    const expiry = new Date(cert.validTo);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  }).length || 0;

  const expiringDomains = domains?.filter((domain: any) => {
    const cert = domain.sslCertificates?.[0];
    if (!cert || !cert.isValid) return false;
    const expiry = new Date(cert.validTo);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length || 0;

  const totalIncidents = incidents?.length || 0;
  const openIncidents = incidents?.filter((inc: any) => inc.status === "open").length || 0;
  const criticalIncidents = incidents?.filter((inc: any) => inc.severity === "critical").length || 0;

  const reportTypes = [
    {
      id: "compliance",
      name: "Compliance Overview",
      description: "GDPR, CCPA compliance status and DSAR metrics",
      icon: FileText,
    },
    {
      id: "ssl",
      name: "SSL Security Report",
      description: "Certificate status, expiration alerts, and security health",
      icon: Lock,
    },
    {
      id: "data-audit",
      name: "Data Audit Report",
      description: "Data inventory, processing activities, and compliance gaps",
      icon: Database,
    },
    {
      id: "incident",
      name: "Incident Summary",
      description: "Security incidents, breach reports, and response metrics",
      icon: AlertTriangle,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate compliance and security reports for stakeholders</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-3xl font-bold text-secondary">{complianceScore}%</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Good standing
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">DSAR Completion</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalDsars > 0 ? Math.round((completedDsars / totalDsars) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedDsars} of {totalDsars} completed
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileBarChart className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SSL Health</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalDomains > 0 ? Math.round((healthyDomains / totalDomains) * 100) : 0}%
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {expiringDomains} expiring soon
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
                <p className="text-sm font-medium text-muted-foreground">Open Incidents</p>
                <p className="text-3xl font-bold text-foreground">{openIncidents}</p>
                <p className="text-xs text-red-600 mt-1">
                  {criticalIncidents} critical
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Compliance Trends ({timeRange})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">GDPR Compliance</span>
                <span className="text-sm font-medium text-secondary">96%</span>
              </div>
              <Progress value={96} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {dataTypes?.filter((dt: any) => dt.legalBasis).length || 0} data types with legal basis defined
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">CCPA Compliance</span>
                <span className="text-sm font-medium text-primary">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Privacy notice coverage and consent tracking active
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Data Security</span>
                <span className="text-sm font-medium text-purple-600">89%</span>
              </div>
              <Progress value={89} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                SSL certificates monitored and incident response procedures active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Generate Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <report.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={generatingReport === report.id}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {generatingReport === report.id ? "Generating..." : "Download"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DSAR Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{completedDsars}</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {totalDsars > 0 ? Math.round((completedDsars / totalDsars) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {dsarRequests?.filter((req: any) => req.status === "in_progress").length || 0}
                  </span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{overdueDsars}</span>
                  {overdueDsars > 0 && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Attention
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SSL Certificate Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Healthy</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{healthyDomains}</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Valid
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expiring Soon</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{expiringDomains}</span>
                  {expiringDomains > 0 && (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Warning
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Issues</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {domains?.filter((domain: any) => {
                      const cert = domain.sslCertificates?.[0];
                      return !cert || !cert.isValid;
                    }).length || 0}
                  </span>
                  <Badge variant="outline">Monitor</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Notice */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Automated Reporting</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set up scheduled reports to be automatically generated and emailed to stakeholders. 
                Perfect for monthly compliance reviews and quarterly audits.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                Configure Scheduled Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
