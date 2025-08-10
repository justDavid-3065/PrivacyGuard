import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, AlertTriangle, CheckCircle, Globe, Calendar, RefreshCw, ExternalLink, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SSLCertificates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const { data: domains, isLoading: domainsLoading, refetch } = useQuery({
    queryKey: ["/api/domains"],
    retry: false,
  });

  const { data: expiringCerts } = useQuery({
    queryKey: ["/api/ssl-certificates/expiring", "30"],
    retry: false,
  });

  const getDaysUntilExpiry = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCertificateStatus = (cert: any) => {
    if (!cert) return { status: "no-cert", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", text: "No Certificate" };
    if (!cert.isValid) return { status: "invalid", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Invalid" };
    
    const daysUntilExpiry = getDaysUntilExpiry(cert.validTo);
    if (daysUntilExpiry <= 0) return { status: "expired", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Expired" };
    if (daysUntilExpiry <= 7) return { status: "critical", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: `Expires in ${daysUntilExpiry} days` };
    if (daysUntilExpiry <= 30) return { status: "warning", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", text: `Expires in ${daysUntilExpiry} days` };
    return { status: "valid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", text: "Valid" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "critical":
      case "expired":
      case "invalid":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Lock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredDomains = domains?.filter((domain: any) => {
    const cert = domain.sslCertificates?.[0];
    const certStatus = getCertificateStatus(cert);
    
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || certStatus.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate statistics
  const totalCerts = domains?.length || 0;
  const validCerts = domains?.filter((d: any) => {
    const cert = d.sslCertificates?.[0];
    return getCertificateStatus(cert).status === "valid";
  }).length || 0;
  const warningCerts = domains?.filter((d: any) => {
    const cert = d.sslCertificates?.[0];
    const status = getCertificateStatus(cert).status;
    return status === "warning" || status === "critical";
  }).length || 0;
  const invalidCerts = domains?.filter((d: any) => {
    const cert = d.sslCertificates?.[0];
    const status = getCertificateStatus(cert).status;
    return status === "invalid" || status === "expired" || status === "no-cert";
  }).length || 0;

  if (domainsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">SSL Certificates</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SSL Certificates</h1>
          <p className="text-muted-foreground">Monitor SSL certificate status and expiration dates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          <Button asChild>
            <a href="/domain-monitor">
              <Globe className="w-4 h-4 mr-2" />
              Manage Domains
            </a>
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Certificates</p>
                <p className="text-3xl font-bold text-foreground">{totalCerts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid</p>
                <p className="text-3xl font-bold text-secondary">{validCerts}</p>
                <p className="text-xs text-green-600 mt-1">
                  {totalCerts > 0 ? Math.round((validCerts / totalCerts) * 100) : 0}% of total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-3xl font-bold text-accent">{warningCerts}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Within 30 days
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues</p>
                <p className="text-3xl font-bold text-destructive">{invalidCerts}</p>
                <p className="text-xs text-red-600 mt-1">
                  Need attention
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SSL Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SSL Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Health Score</span>
                <span className="text-sm font-medium text-foreground">
                  {totalCerts > 0 ? Math.round(((validCerts + warningCerts * 0.5) / totalCerts) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={totalCerts > 0 ? ((validCerts + warningCerts * 0.5) / totalCerts) * 100 : 0} 
                className="h-2" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Valid ({validCerts})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-muted-foreground">Expiring Soon ({warningCerts})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-muted-foreground">Issues ({invalidCerts})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="warning">Expiring Soon</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                  <SelectItem value="no-cert">No Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate List */}
      {filteredDomains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No SSL Certificates Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter ? "No certificates match your filters." : "Add domains to start monitoring SSL certificates."}
            </p>
            {!searchTerm && !statusFilter && (
              <Button asChild>
                <a href="/domain-monitor">
                  <Globe className="w-4 h-4 mr-2" />
                  Add First Domain
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDomains.map((domain: any) => {
            const cert = domain.sslCertificates?.[0];
            const certStatus = getCertificateStatus(cert);
            
            return (
              <Card key={domain.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        certStatus.status === "valid" ? "bg-green-100 dark:bg-green-900" :
                        certStatus.status === "warning" ? "bg-orange-100 dark:bg-orange-900" :
                        "bg-red-100 dark:bg-red-900"
                      }`}>
                        {getStatusIcon(certStatus.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">{domain.name}</h3>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`https://${domain.name}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                        
                        {cert ? (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Issued by: {cert.issuer}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Valid from: {new Date(cert.validFrom).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires: {new Date(cert.validTo).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Last checked: {new Date(cert.lastChecked).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No SSL certificate found</p>
                        )}
                        
                        {cert?.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {cert.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={certStatus.color}>
                        {certStatus.text}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
