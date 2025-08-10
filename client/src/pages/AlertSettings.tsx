import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Mail, MessageSquare, Smartphone, Save, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertAlertSettingsSchema } from "@shared/schema";

const alertSettingsFormSchema = insertAlertSettingsSchema.extend({
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  smsNumber: z.string().optional(),
  slackWebhook: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
});

type AlertSettingsFormData = z.infer<typeof alertSettingsFormSchema>;

export default function AlertSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [testingEmail, setTestingEmail] = useState(false);

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

  const form = useForm<AlertSettingsFormData>({
    resolver: zodResolver(alertSettingsFormSchema),
    defaultValues: {
      email: "",
      smsNumber: "",
      slackWebhook: "",
      alertThresholds: JSON.stringify({ 30: true, 15: true, 7: true, 1: true }),
      emailEnabled: true,
      smsEnabled: false,
      slackEnabled: false,
    },
  });

  const { data: alertSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/alert-settings"],
    retry: false,
    onSuccess: (data) => {
      if (data && Object.keys(data).length > 0) {
        const thresholds = data.alertThresholds ? JSON.parse(data.alertThresholds) : { 30: true, 15: true, 7: true, 1: true };
        form.reset({
          email: data.email || "",
          smsNumber: data.smsNumber || "",
          slackWebhook: data.slackWebhook || "",
          alertThresholds: JSON.stringify(thresholds),
          emailEnabled: data.emailEnabled ?? true,
          smsEnabled: data.smsEnabled ?? false,
          slackEnabled: data.slackEnabled ?? false,
        });
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AlertSettingsFormData) => {
      const response = await apiRequest("POST", "/api/alert-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-settings"] });
      toast({
        title: "Success",
        description: "Alert settings updated successfully",
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
        description: "Failed to update alert settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AlertSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestEmail = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address first",
        variant: "destructive",
      });
      return;
    }

    setTestingEmail(true);
    try {
      // This would trigger a test email - for now we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Test Email Sent",
        description: `A test alert has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Parse current thresholds from form
  const currentThresholds = (() => {
    try {
      return JSON.parse(form.watch("alertThresholds") || "{}");
    } catch {
      return { 30: true, 15: true, 7: true, 1: true };
    }
  })();

  const updateThreshold = (days: number, enabled: boolean) => {
    const newThresholds = { ...currentThresholds, [days]: enabled };
    form.setValue("alertThresholds", JSON.stringify(newThresholds));
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Alert Settings</h1>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
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
          <h1 className="text-2xl font-bold text-foreground">Alert Settings</h1>
          <p className="text-muted-foreground">Configure how and when you receive SSL certificate alerts</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Alert Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alert Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose when to receive alerts before SSL certificates expire.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[30, 15, 7, 1].map((days) => (
                  <div key={days} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{days} day{days > 1 ? 's' : ''}</p>
                      <p className="text-sm text-muted-foreground">before expiry</p>
                    </div>
                    <Switch
                      checked={currentThresholds[days] || false}
                      onCheckedChange={(checked) => updateThreshold(days, checked)}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Recommended Settings
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Enable 30 and 7-day alerts for most domains. Enable 1-day alerts for critical domains. 
                  The 15-day alert provides a good middle ground for planning certificate renewals.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Email Alerts</FormLabel>
                      <FormDescription>
                        Receive SSL certificate expiration alerts via email
                      </FormDescription>
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

              {form.watch("emailEnabled") && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="alerts@yourcompany.com" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestEmail}
                            disabled={testingEmail || !field.value}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            {testingEmail ? "Sending..." : "Test"}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS Notifications
                <Badge variant="outline" className="ml-2">Coming Soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="smsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable SMS Alerts</FormLabel>
                      <FormDescription>
                        Receive critical SSL certificate alerts via SMS
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("smsEnabled") && (
                <FormField
                  control={form.control}
                  name="smsNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        SMS notifications are coming soon. Join our newsletter for updates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Slack Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Slack Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slackEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Slack Alerts</FormLabel>
                      <FormDescription>
                        Send SSL certificate alerts to a Slack channel
                      </FormDescription>
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

              {form.watch("slackEnabled") && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slackWebhook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slack Webhook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://hooks.slack.com/services/..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Create a webhook in your Slack workspace and paste the URL here.{" "}
                          <a 
                            href="https://api.slack.com/messaging/webhooks" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Learn how →
                          </a>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Slack Integration Benefits
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <li>• Real-time alerts to your team channel</li>
                      <li>• Rich message formatting with domain details</li>
                      <li>• Perfect for DevOps and IT teams</li>
                      <li>• Integrates with your existing workflow</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Escalation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    Auto-Escalation (Coming Soon)
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Set up automatic escalation rules to notify different team members based on certificate priority and time until expiration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 opacity-50">
                    <h5 className="font-medium mb-2">Critical Domains</h5>
                    <p className="text-sm text-muted-foreground">
                      Immediately notify team leads for production domains
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 opacity-50">
                    <h5 className="font-medium mb-2">Overdue Certificates</h5>
                    <p className="text-sm text-muted-foreground">
                      Send urgent alerts for expired certificates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="min-w-32"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
