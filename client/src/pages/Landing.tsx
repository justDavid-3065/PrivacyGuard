import { Shield, CheckCircle, Users, Globe, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PrivacyGuard</h1>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/api/login'} className="bg-primary hover:bg-primary/90">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Privacy Compliance & SSL Monitoring
            <span className="block text-primary mt-2">Made Simple</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comprehensive GDPR, CCPA, and UK DPA compliance management with advanced SSL certificate monitoring and team collaboration tools.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            >
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">Everything You Need for Compliance</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From data inventory management to SSL monitoring, we've got your privacy and security compliance covered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Data Inventory Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track data types, purposes, and sources with CSV import and API connectors for HubSpot, Stripe, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-secondary mb-2" />
              <CardTitle>Consent Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Record user consents with timestamps and policy versions. API/webhook support for website integration.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-accent mb-2" />
              <CardTitle>DSAR Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Handle access, deletion, and modification requests with auto-deadline calculator and status tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Lock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>SSL Certificate Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Scheduled 12-hour SSL validity checks with multi-region monitoring and configurable alert thresholds.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Globe className="w-8 h-8 text-secondary mb-2" />
              <CardTitle>Domain Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Add/remove domains with HTTPS verification and comprehensive uptime reporting dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-8 h-8 text-accent mb-2" />
              <CardTitle>Incident Logbook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Register breach events, track steps taken, manage notification timelines with exportable reports.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">Trusted Compliance Standards</h3>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            <div className="text-lg font-semibold">GDPR</div>
            <div className="text-lg font-semibold">CCPA</div>
            <div className="text-lg font-semibold">UK DPA</div>
            <div className="text-lg font-semibold">SOC 2</div>
            <div className="text-lg font-semibold">ISO 27001</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="bg-primary rounded-2xl p-12 text-primary-foreground">
          <h3 className="text-3xl font-bold mb-4">Start Your Compliance Journey Today</h3>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses who trust PrivacyGuard for their privacy compliance and SSL monitoring needs.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="text-lg px-8 py-3"
          >
            Get Started - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold">PrivacyGuard</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 PrivacyGuard. All rights reserved. Built for privacy compliance and SSL monitoring.
          </p>
        </div>
      </footer>
    </div>
  );
}
