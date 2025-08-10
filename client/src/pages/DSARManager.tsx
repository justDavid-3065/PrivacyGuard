import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Filter, FileText, Clock, CheckCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertDsarRequestSchema } from "@shared/schema";

const dsarFormSchema = insertDsarRequestSchema.extend({
  subjectEmail: z.string().email("Please enter a valid email"),
  requestType: z.string().min(1, "Request type is required"),
}).omit({ dueDate: true });

type DSARFormData = z.infer<typeof dsarFormSchema>;

export default function DSARManager() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);

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

  const form = useForm<DSARFormData>({
    resolver: zodResolver(dsarFormSchema),
    defaultValues: {
      subjectEmail: "",
      subjectName: "",
      requestType: "",
      description: "",
      notes: "",
    },
  });

  const { data: dsarRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/dsar-requests"],
    retry: false,
  });

  const createDsarMutation = useMutation({
    mutationFn: async (data: DSARFormData) => {
      const response = await apiRequest("POST", "/api/dsar-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dsar-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditingRequest(null);
      form.reset();
      toast({
        title: "Success",
        description: "DSAR request created successfully",
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
        description: "Failed to create DSAR request",
        variant: "destructive",
      });
    },
  });

  const updateDsarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      const response = await apiRequest("PUT", `/api/dsar-requests/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dsar-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "DSAR request updated successfully",
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
        description: "Failed to update DSAR request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DSARFormData) => {
    if (editingRequest) {
      updateDsarMutation.mutate({ id: editingRequest.id, data });
    } else {
      createDsarMutation.mutate(data);
    }
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    form.reset({
      subjectEmail: request.subjectEmail,
      subjectName: request.subjectName || "",
      requestType: request.requestType,
      description: request.description || "",
      notes: request.notes || "",
    });
    setDialogOpen(true);
  };

  const handleStatusUpdate = (requestId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    updateDsarMutation.mutate({ id: requestId, data: updateData });
  };

  const filteredRequests = dsarRequests?.filter((request: any) => {
    const matchesSearch = request.subjectEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (requestsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">DSAR Manager</h1>
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
          <h1 className="text-2xl font-bold text-foreground">DSAR Manager</h1>
          <p className="text-muted-foreground">Handle access, deletion, and modification requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRequest(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              New DSAR Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRequest ? "Edit DSAR Request" : "Create New DSAR Request"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subjectEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subjectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="access">Data Access</SelectItem>
                          <SelectItem value="deletion">Data Deletion</SelectItem>
                          <SelectItem value="rectification">Data Rectification</SelectItem>
                          <SelectItem value="portability">Data Portability</SelectItem>
                          <SelectItem value="objection">Object to Processing</SelectItem>
                          <SelectItem value="restriction">Restrict Processing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the request details..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Internal)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Internal notes for processing..."
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
                    disabled={createDsarMutation.isPending || updateDsarMutation.isPending}
                  >
                    {editingRequest ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['submitted', 'in_progress', 'completed', 'rejected'].map((status) => {
          const count = dsarRequests?.filter((req: any) => req.status === status).length || 0;
          return (
            <Card key={status}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-100 dark:bg-green-900' :
                    status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900' :
                    status === 'rejected' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-yellow-100 dark:bg-yellow-900'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DSAR Requests */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No DSAR Requests Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter ? "No requests match your filters." : "No data subject access requests have been submitted yet."}
            </p>
            {!searchTerm && !statusFilter && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request: any) => {
            const daysUntilDue = getDaysUntilDue(request.dueDate);
            const isOverdue = daysUntilDue < 0 && request.status !== 'completed';
            
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{request.subjectName || 'Unknown'}</p>
                          <Badge variant="outline" className="capitalize">
                            {request.requestType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.subjectEmail}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</span>
                          <span className={isOverdue ? 'text-red-600' : ''}>
                            Due: {new Date(request.dueDate).toLocaleDateString()}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </div>
                        {request.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isOverdue && (
                        <Badge variant="destructive" className="animate-pulse">
                          Overdue
                        </Badge>
                      )}
                      {daysUntilDue >= 0 && daysUntilDue <= 7 && request.status !== 'completed' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Due in {daysUntilDue} days
                        </Badge>
                      )}
                      <Select 
                        value={request.status} 
                        onValueChange={(value) => handleStatusUpdate(request.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(request)}
                      >
                        Edit
                      </Button>
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
