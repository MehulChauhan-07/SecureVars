import { useSecrets } from "@/contexts/SecretsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Shield, Activity, Clock, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Secret } from "@/types/secret";

const Dashboard = () => {
  const { secrets, recentlyAccessed, isLoading, error } = useSecrets();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    const active = secrets.filter((s) => s.meta.isActive).length;
    const byEnvironment = secrets.reduce((acc, secret) => {
      acc[secret.environment] = (acc[secret.environment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projects = [...new Set(secrets.map((s) => s.project.name))].length;

    return { total: secrets.length, active, byEnvironment, projects };
  }, [secrets]);

  const filteredSecrets = useMemo(() => {
    return secrets
      .filter(
        (secret) =>
          secret.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          secret.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          secret.project.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [secrets, searchQuery]);

  const getEnvironmentColor = (env: string) => {
    const colors = {
      development: "bg-env-development",
      production: "bg-env-production",
      testing: "bg-env-testing",
      staging: "bg-env-staging",
    };
    return colors[env as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your secrets and environment variables
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Secrets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-12 bg-muted animate-pulse rounded" />
                <div className="h-3 w-28 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.projects}</div>
                <p className="text-xs text-muted-foreground">
                  Across all environments
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-10 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.byEnvironment.production || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Production secrets
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-10 bg-muted animate-pulse rounded" />
                <div className="h-3 w-28 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.byEnvironment.development || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Development secrets
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Search & Recent Secrets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Search */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Search</CardTitle>
            <CardDescription>
              Search across all your secrets and projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search secrets, identifiers, or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery && (
              <div className="space-y-2">
                {filteredSecrets.length > 0 ? (
                  filteredSecrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm truncate">
                            {secret.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-white text-xs ${getEnvironmentColor(
                              secret.environment
                            )}`}
                          >
                            {secret.environment}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {secret.project.name} • {secret.identifier}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/secrets/${secret.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No secrets found matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Accessed */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Accessed</CardTitle>
            <CardDescription>Your most recently viewed secrets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-full bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : recentlyAccessed.length > 0 ? (
              recentlyAccessed.map((secret) => (
                <div
                  key={secret.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getEnvironmentColor(
                        secret.environment
                      )}`}
                    />
                    <span className="text-sm truncate">{secret.name}</span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/secrets/${secret.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recently accessed secrets
              </p>
            )}
          </CardContent>
        </Card>
        {/* Env distribution stub */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Environment Distribution</CardTitle>
            <CardDescription>Secrets per environment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-24 w-full bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-end gap-4 h-28">
                {Object.entries(stats.byEnvironment).map(([env, count]) => (
                  <div key={env} className="flex flex-col items-center">
                    <div
                      className={`w-8 ${getEnvironmentColor(env)} rounded-t`}
                      style={{
                        height: Math.max(6, Math.min(24, Number(count))) * 4,
                      }}
                    />
                    <span className="text-xs mt-1 capitalize">{env}</span>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
