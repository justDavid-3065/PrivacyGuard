import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Shield, Eye, Edit, Crown, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeamManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

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

  // Mock team data - in a real app this would come from an API
  const teamMembers = [
    {
      id: user?.id || "current-user",
      email: user?.email || "current@user.com",
      firstName: user?.firstName || "Current",
      lastName: user?.lastName || "User",
      role: user?.role || "owner",
      status: "active",
      lastActive: new Date().toISOString(),
      joinedAt: "2024-01-15T00:00:00Z",
      isCurrentUser: true,
    },
    {
      id: "team-member-1",
      email: "sarah.johnson@company.com",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "admin",
      status: "active",
      lastActive: "2024-12-08T14:30:00Z",
      joinedAt: "2024-02-20T00:00:00Z",
      isCurrentUser: false,
    },
    {
      id: "team-member-2",
      email: "mike.chen@company.com",
      firstName: "Mike",
      lastName: "Chen",
      role: "viewer",
      status: "active",
      lastActive: "2024-12-07T16:45:00Z",
      joinedAt: "2024-03-10T00:00:00Z",
      isCurrentUser: false,
    },
    {
      id: "team-member-3",
      email: "lisa.park@company.com",
      firstName: "Lisa",
      lastName: "Park",
      role: "admin",
      status: "pending",
      lastActive: null,
      joinedAt: "2024-12-08T00:00:00Z",
      isCurrentUser: false,
    },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredMembers = teamMembers.filter((member) => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === "active").length;
  const pendingMembers = teamMembers.filter(m => m.status === "pending").length;
  const adminMembers = teamMembers.filter(m => m.role === "admin" || m.role === "owner").length;

  const handleInviteMember = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Team invitations will be available in the next update",
    });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Role management will be available in the next update",
    });
  };

  const handleRemoveMember = (memberId: string) => {
    toast({
      title: "Feature Coming Soon",
      description: "Member removal will be available in the next update",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>
        <Button onClick={handleInviteMember}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-3xl font-bold text-foreground">{totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-secondary">{activeMembers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-accent">{pendingMembers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-3xl font-bold text-foreground">{adminMembers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Permissions Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-6">
          <h3 className="font-medium text-foreground mb-4">Team Roles & Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="font-medium">Owner</span>
              </div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Full access to all features</li>
                <li>• Manage team members and roles</li>
                <li>• Billing and subscription control</li>
                <li>• Export all compliance data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Admin</span>
              </div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Manage privacy compliance data</li>
                <li>• Configure SSL monitoring</li>
                <li>• Handle DSAR requests</li>
                <li>• Generate compliance reports</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Viewer</span>
              </div>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• View compliance dashboard</li>
                <li>• Access SSL certificate status</li>
                <li>• View reports and analytics</li>
                <li>• Read-only access to all data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Team Members Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || roleFilter ? "No members match your filters." : "Invite your first team member to get started."}
            </p>
            {!searchTerm && !roleFilter && (
              <Button onClick={handleInviteMember}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-foreground">
                          {member.firstName} {member.lastName}
                          {member.isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-2">(You)</span>
                          )}
                        </h3>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined: {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                        {member.lastActive && (
                          <span>
                            Last active: {new Date(member.lastActive).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                    
                    {!member.isCurrentUser && (
                      <div className="flex gap-2">
                        <Select 
                          value={member.role} 
                          onValueChange={(value) => handleRoleChange(member.id, value)}
                          disabled
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive hover:text-destructive"
                          disabled
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Coming Soon Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Enhanced Team Features Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We're working on advanced team management features including real-time collaboration, 
                activity logs, custom roles, and automated role assignments based on compliance tasks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
