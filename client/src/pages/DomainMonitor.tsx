import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Globe, Trash2, Search, RefreshCw, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertDomainSchema } from "@shared/schema";

const domainFormSchema = insertDomainSchema.extend({
  name: z.string()
    .min(1, "Domain name is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Please enter a valid domain name"),
});

type DomainFormData = z.infer<typeof domainFormSchema>;

export default function DomainMonitor() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const { data: domains, isLoading: domainsLoading, refetch } = useQuery({
    queryKey: ["/api/domains"],
    retry: false,
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      const response = await apiRequest("POST", "/api/domains", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Domain added successfully. SSL check in progress...",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add domain. Please check the domain name and try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/domains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Domain removed successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to remove domain",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DomainFormData) => {
    createDomainMutation.mutate(data);
  };

  const handleDelete = (id: string, domainName: string) => {
    if (confirm(`Are you sure you want to remove ${domainName} from monitoring?`)) {
      deleteDomainMutation.mutate(id);
    }
  };

  const getDomainStatus = (domain: any) => {
    const cert = domain.sslCertificates?.[0];
    if (!cert) return { status: "pending", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", text: "Checking..." };
    if (!cert.isValid) return { status: "error", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "SSL Error" };
    
    const expiry = new Date(cert.validTo);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { status: "expired", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Expired" };
    if (diffDays <= 7) return { status: "critical", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Critical" };
    if (diffDays <= 30) return { status: "warning", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", text: "Warning" };
    return { status: "healthy", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", text: "Healthy" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "critical":
      case "expired":
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-600 animate-spin" />;
    }
  };

  const filteredDomains = domains?.filter((domain: any) => {
    return domain.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Calculate statistics
  const totalDomains = domains?.length || 0;
  const activeDomains = domains?.filter((d: any) => d.isActive).length || 0;
  const healthyDomains = domains?.filter((d: any) => getDomainStatus(d).status === "healthy").length || 0;
  const warningDomains = domains?.filter((d: any) => {
    const status = getDomainStatus(d).status;
    return status === "warning" || status === "critical";
  }).length || 0;

  if (domainsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Domain Monitor</h1>
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
          <h1 className="text-2xl font-bold text-foreground">Domain Monitor</h1>
          <p className="text-muted-foreground">Add and monitor domains for SSL certificate status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => form.reset()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Domain</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="example.com" 
                            {...field}
                            onChange={(e) => {
                              // Remove protocol and www prefix if present
                              let value = e.target.value
                                .replace(/^https?:\/\//, '')
                                .replace(/^www\./, '')
                                .toLowerCase();
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active Monitoring</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Enable SSL certificate monitoring for this domain
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      How SSL Monitoring Works
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• SSL certificates are checked every 12 hours</li>
                      <li>• You'll receive alerts before expiration (30, 15, 7, 1 day thresholds)</li>
                      <li>• Multi-region checks help avoid false positives</li>
                      <li>• Historical data helps track certificate changes</li>
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDomainMutation.isPending}>
                      {createDomainMutation.isPending ? "Adding..." : "Add Domain"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Domains</p>
                <p className="text-3xl font-bold text-foreground">{totalDomains}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-foreground">{activeDomains}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-3xl font-bold text-secondary">{healthyDomains}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Need Attention</p>
                <p className="text-3xl font-bold text-accent">{warningDomains}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Domain List */}
      {filteredDomains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Domains Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No domains match your search." : "Add your first domain to start monitoring SSL certificates."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Domain
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDomains.map((domain: any) => {
            const domainStatus = getDomainStatus(domain);
            const cert = domain.sslCertificates?.[0];
            
            return (
              <Card key={domain.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{domain.name}</CardTitle>
                        {!domain.isActive && (
                          <Badge variant="outline" className="text-gray-600">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={domainStatus.color}>
                          {domainStatus.text}
                        </Badge>
                        {cert && (
                          <Badge variant="outline">
                            {cert.issuer}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        domainStatus.status === "healthy" ? "bg-green-100 dark:bg-green-900" :
                        domainStatus.status === "warning" ? "bg-orange-100 dark:bg-orange-900" :
                        domainStatus.status === "pending" ? "bg-gray-100 dark:bg-gray-900" :
                        "bg-red-100 dark:bg-red-900"
                      }`}>
                        {getStatusIcon(domainStatus.status)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(domain.id, domain.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {cert ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="font-medium">
                          {new Date(cert.validTo).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid From:</span>
                        <span>{new Date(cert.validFrom).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Checked:</span>
                        <span>{new Date(cert.lastChecked).toLocaleString()}</span>
                      </div>
                      {cert.error && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded text-xs text-red-700 dark:text-red-300">
                          Error: {cert.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Checking SSL certificate...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
