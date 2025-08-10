import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Filter, AlertTriangle, Eye, Edit, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertIncidentSchema } from "@shared/schema";

const incidentFormSchema = insertIncidentSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  discoveredAt: z.string().min(1, "Discovery date is required"),
}).omit({ status: true });

type IncidentFormData = z.infer<typeof incidentFormSchema>;

export default function IncidentLogbook() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [previewIncident, setPreviewIncident] = useState<any>(null);

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

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      affectedRecords: undefined,
      discoveredAt: "",
      reportedAt: "",
      resolvedAt: "",
      notificationRequired: false,
      notificationSent: false,
      steps: "",
    },
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ["/api/incidents"],
    retry: false,
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      const response = await apiRequest("POST", "/api/incidents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setDialogOpen(false);
      setEditingIncident(null);
      form.reset();
      toast({
        title: "Success",
        description: "Incident logged successfully",
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
        description: "Failed to log incident",
        variant: "destructive",
      });
    },
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const response = await apiRequest("PUT", `/api/incidents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setDialogOpen(false);
      setEditingIncident(null);
      form.reset();
      toast({
        title: "Success",
        description: "Incident updated successfully",
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
        description: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: IncidentFormData) => {
    if (editingIncident) {
      updateIncidentMutation.mutate({ id: editingIncident.id, data });
    } else {
      createIncidentMutation.mutate(data);
    }
  };

  const handleEdit = (incident: any) => {
    setEditingIncident(incident);
    form.reset({
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      affectedRecords: incident.affectedRecords || undefined,
      discoveredAt: incident.discoveredAt ? new Date(incident.discoveredAt).toISOString().split('T')[0] : "",
      reportedAt: incident.reportedAt ? new Date(incident.reportedAt).toISOString().split('T')[0] : "",
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt).toISOString().split('T')[0] : "",
      notificationRequired: incident.notificationRequired,
      notificationSent: incident.notificationSent,
      steps: incident.steps || "",
    });
    setDialogOpen(true);
  };

  const handlePreview = (incident: any) => {
    setPreviewIncident(incident);
    setPreviewDialogOpen(true);
  };

  const handleStatusUpdate = (incidentId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date().toISOString();
    }
    updateIncidentMutation.mutate({ id: incidentId, data: updateData });
  };

  const filteredIncidents = incidents?.filter((incident: any) => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !severityFilter || incident.severity === severityFilter;
    const matchesStatus = !statusFilter || incident.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (incidentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Incident Logbook</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-foreground">Incident Logbook</h1>
          <p className="text-muted-foreground">Track data breaches and security incidents</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingIncident(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Log Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingIncident ? "Edit Incident" : "Log New Incident"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Unauthorized access to customer database" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="affectedRecords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affected Records (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Number of records"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what happened, when it was discovered, and the initial assessment..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="discoveredAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discovery Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reportedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reported Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resolvedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolved Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notificationRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notification Required</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Regulatory notification needed
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
                  <FormField
                    control={form.control}
                    name="notificationSent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notification Sent</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Authorities have been notified
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
                </div>

                <FormField
                  control={form.control}
                  name="steps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steps Taken (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Document the steps taken to investigate and resolve the incident..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createIncidentMutation.isPending || updateIncidentMutation.isPending}
                  >
                    {editingIncident ? "Update" : "Log Incident"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['open', 'investigating', 'resolved'].map((status) => {
          const count = incidents?.filter((incident: any) => incident.status === status).length || 0;
          return (
            <Card key={status}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">{status}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    status === 'resolved' ? 'bg-green-100 dark:bg-green-900' :
                    status === 'investigating' ? 'bg-blue-100 dark:bg-blue-900' :
                    'bg-yellow-100 dark:bg-yellow-900'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-foreground">
                  {incidents?.filter((incident: any) => incident.severity === 'critical').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Incidents Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || severityFilter || statusFilter ? "No incidents match your filters." : "No security incidents have been logged yet."}
            </p>
            {!searchTerm && !severityFilter && !statusFilter && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log First Incident
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident: any) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      incident.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                      incident.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                      incident.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      'bg-green-100 dark:bg-green-900'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        {incident.notificationRequired && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Notification Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Discovered: {new Date(incident.discoveredAt).toLocaleDateString()}
                        </span>
                        {incident.affectedRecords && (
                          <span>{incident.affectedRecords} records affected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Select 
                      value={incident.status} 
                      onValueChange={(value) => handleStatusUpdate(incident.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(incident)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(incident)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {previewIncident && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b">
                <h2 className="text-lg font-semibold">{previewIncident.title}</h2>
                <Badge className={getSeverityColor(previewIncident.severity)}>
                  {previewIncident.severity}
                </Badge>
                <Badge className={getStatusColor(previewIncident.status)}>
                  {previewIncident.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Discovered</p>
                  <p className="text-muted-foreground">{new Date(previewIncident.discoveredAt).toLocaleDateString()}</p>
                </div>
                {previewIncident.affectedRecords && (
                  <div>
                    <p className="font-medium mb-1">Affected Records</p>
                    <p className="text-muted-foreground">{previewIncident.affectedRecords}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium mb-1">Notification Required</p>
                  <p className="text-muted-foreground">{previewIncident.notificationRequired ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Notification Sent</p>
                  <p className="text-muted-foreground">{previewIncident.notificationSent ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Description</p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{previewIncident.description}</p>
              </div>

              {previewIncident.steps && (
                <div>
                  <p className="font-medium mb-2">Steps Taken</p>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{previewIncident.steps}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
