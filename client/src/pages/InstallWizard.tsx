
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2, Database, Settings, Users, Shield } from "lucide-react";

interface InstallationStatus {
  isInstalled: boolean;
  hasReferenceData: boolean;
  hasDefaultConfigurations: boolean;
  sampleDataExists: boolean;
  installationDate?: string;
}

interface InstallationOptions {
  includeSampleData: boolean;
  adminUser?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function InstallWizard() {
  const [status, setStatus] = useState<InstallationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installationComplete, setInstallationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [options, setOptions] = useState<InstallationOptions>({
    includeSampleData: false,
    adminUser: {
      email: '',
      firstName: '',
      lastName: ''
    }
  });

  useEffect(() => {
    checkInstallationStatus();
  }, []);

  const checkInstallationStatus = async () => {
    try {
      const response = await fetch('/api/install/status');
      const data = await response.json();
      setStatus(data);
      
      if (data.isInstalled) {
        setInstallationComplete(true);
      }
    } catch (error) {
      console.error('Failed to check installation status:', error);
      setError('Failed to check installation status');
    } finally {
      setLoading(false);
    }
  };

  const performInstallation = async () => {
    setInstalling(true);
    setError(null);

    try {
      const response = await fetch('/api/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      const result = await response.json();

      if (result.success) {
        setInstallationComplete(true);
        await checkInstallationStatus();
      } else {
        setError(result.message || 'Installation failed');
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setError('Installation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setInstalling(false);
    }
  };

  const removeSampleData = async () => {
    try {
      const response = await fetch('/api/install/sample-data', {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        await checkInstallationStatus();
      } else {
        setError(result.message || 'Failed to remove sample data');
      }
    } catch (error) {
      console.error('Failed to remove sample data:', error);
      setError('Failed to remove sample data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking installation status...</p>
        </div>
      </div>
    );
  }

  if (installationComplete && status?.isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Installation Complete!</CardTitle>
            <CardDescription>
              Privacy Guard has been successfully installed and configured.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                <span>Reference data: {status?.hasReferenceData ? 'Installed' : 'Missing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-green-500" />
                <span>Default configs: {status?.hasDefaultConfigurations ? 'Set' : 'Missing'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Sample data: {status?.sampleDataExists ? 'Present' : 'Not included'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Status: Ready for use</span>
              </div>
            </div>

            {status?.installationDate && (
              <p className="text-sm text-gray-600 text-center">
                Installed on: {new Date(status.installationDate).toLocaleString()}
              </p>
            )}

            {status?.sampleDataExists && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sample data is currently present in your database. You can remove it when you're ready to use real data.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {status?.sampleDataExists && (
              <Button variant="outline" onClick={removeSampleData}>
                Remove Sample Data
              </Button>
            )}
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Privacy Guard Setup</CardTitle>
          <CardDescription>
            Configure your Privacy Guard installation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yourcompany.com"
                value={options.adminUser?.email || ''}
                onChange={(e) => setOptions({
                  ...options,
                  adminUser: {
                    ...options.adminUser!,
                    email: e.target.value
                  }
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={options.adminUser?.firstName || ''}
                  onChange={(e) => setOptions({
                    ...options,
                    adminUser: {
                      ...options.adminUser!,
                      firstName: e.target.value
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={options.adminUser?.lastName || ''}
                  onChange={(e) => setOptions({
                    ...options,
                    adminUser: {
                      ...options.adminUser!,
                      lastName: e.target.value
                    }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sampleData"
                checked={options.includeSampleData}
                onCheckedChange={(checked) => setOptions({
                  ...options,
                  includeSampleData: !!checked
                })}
              />
              <Label htmlFor="sampleData" className="text-sm">
                Include sample data for testing and demonstration
              </Label>
            </div>

            {options.includeSampleData && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sample data will be generated to help you explore the features. 
                  You can remove it later from the settings page.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">What will be installed:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Reference data (categories, statuses, regulations)</li>
              <li>• Default alert settings and retention policies</li>
              <li>• Database schema and indexes</li>
              {options.includeSampleData && <li>• Sample operational data for testing</li>}
            </ul>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            onClick={performInstallation} 
            disabled={installing || !options.adminUser?.email}
            className="w-full"
          >
            {installing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : (
              'Install Privacy Guard'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
