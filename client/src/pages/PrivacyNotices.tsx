import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, FileText, Search, Filter, Eye, Globe } from "lucide-react";
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
import { insertPrivacyNoticeSchema } from "@shared/schema";

const privacyNoticeFormSchema = insertPrivacyNoticeSchema.extend({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  version: z.string().min(1, "Version is required"),
  regulation: z.string().min(1, "Regulation is required"),
});

type PrivacyNoticeFormData = z.infer<typeof privacyNoticeFormSchema>;

export default function PrivacyNotices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [previewNotice, setPreviewNotice] = useState<any>(null);

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

  const form = useForm<PrivacyNoticeFormData>({
    resolver: zodResolver(privacyNoticeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      version: "1.0",
      regulation: "",
      isActive: false,
      effectiveDate: "",
    },
  });

  const { data: privacyNotices, isLoading: noticesLoading } = useQuery({
    queryKey: ["/api/privacy-notices"],
    retry: false,
  });

  const createNoticeMutation = useMutation({
    mutationFn: async (data: PrivacyNoticeFormData) => {
      const response = await apiRequest("POST", "/api/privacy-notices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-notices"] });
      setDialogOpen(false);
      setEditingNotice(null);
      form.reset();
      toast({
        title: "Success",
        description: "Privacy notice created successfully",
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
        description: "Failed to create privacy notice",
        variant: "destructive",
      });
    },
  });

  const updateNoticeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PrivacyNoticeFormData> }) => {
      const response = await apiRequest("PUT", `/api/privacy-notices/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-notices"] });
      setDialogOpen(false);
      setEditingNotice(null);
      form.reset();
      toast({
        title: "Success",
        description: "Privacy notice updated successfully",
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
        description: "Failed to update privacy notice",
        variant: "destructive",
      });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/privacy-notices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-notices"] });
      toast({
        title: "Success",
        description: "Privacy notice deleted successfully",
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
        description: "Failed to delete privacy notice",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PrivacyNoticeFormData) => {
    if (editingNotice) {
      updateNoticeMutation.mutate({ id: editingNotice.id, data });
    } else {
      createNoticeMutation.mutate(data);
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    form.reset({
      title: notice.title,
      content: notice.content,
      version: notice.version,
      regulation: notice.regulation,
      isActive: notice.isActive,
      effectiveDate: notice.effectiveDate ? new Date(notice.effectiveDate).toISOString().split('T')[0] : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this privacy notice?")) {
      deleteNoticeMutation.mutate(id);
    }
  };

  const handlePreview = (notice: any) => {
    setPreviewNotice(notice);
    setPreviewDialogOpen(true);
  };

  const filteredNotices = privacyNotices?.filter((notice: any) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegulation = !regulationFilter || notice.regulation === regulationFilter;
    return matchesSearch && matchesRegulation;
  }) || [];

  const regulations = [...new Set(privacyNotices?.map((notice: any) => notice.regulation) || [])];

  if (noticesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Privacy Notices</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
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
          <h1 className="text-2xl font-bold text-foreground">Privacy Notices</h1>
          <p className="text-muted-foreground">Manage privacy policy templates and notices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingNotice(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNotice ? "Edit Privacy Notice" : "Create New Privacy Notice"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., GDPR Privacy Notice" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="regulation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regulation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select regulation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GDPR">GDPR</SelectItem>
                            <SelectItem value="CCPA">CCPA</SelectItem>
                            <SelectItem value="UK_DPA">UK DPA</SelectItem>
                            <SelectItem value="PIPEDA">PIPEDA</SelectItem>
                            <SelectItem value="LGPD">LGPD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <FormLabel>Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Make this notice active
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
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Privacy Notice Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your privacy notice content here..."
                          rows={15}
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
                    disabled={createNoticeMutation.isPending || updateNoticeMutation.isPending}
                  >
                    {editingNotice ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Gallery */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Privacy Notice Templates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use structured input templates to build compliant GDPR, CCPA, and UK DPA privacy notices with version tracking and change logs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search privacy notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={regulationFilter} onValueChange={setRegulationFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by regulation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regulations</SelectItem>
                  {regulations.map((regulation) => (
                    <SelectItem key={regulation} value={regulation}>
                      {regulation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notices Grid */}
      {filteredNotices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Privacy Notices Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || regulationFilter ? "No privacy notices match your filters." : "Create your first privacy notice to get started with compliance."}
            </p>
            {!searchTerm && !regulationFilter && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Notice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotices.map((notice: any) => (
            <Card key={notice.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      {notice.isActive && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notice.regulation}</Badge>
                      <Badge variant="outline">v{notice.version}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(notice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {notice.content.length > 150 ? `${notice.content.substring(0, 150)}...` : notice.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created: {new Date(notice.createdAt).toLocaleDateString()}</span>
                  {notice.effectiveDate && (
                    <span>Effective: {new Date(notice.effectiveDate).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewNotice?.title}</DialogTitle>
          </DialogHeader>
          {previewNotice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Badge variant="outline">{previewNotice.regulation}</Badge>
                <Badge variant="outline">Version {previewNotice.version}</Badge>
                {previewNotice.isActive && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                )}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">{previewNotice.content}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
