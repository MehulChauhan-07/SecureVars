import { useParams, useNavigate, Link } from "react-router-dom";
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
import {
  ArrowLeft,
  Copy,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  Star,
  RotateCcw,
  Shield,
  Activity,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SecretFormDialog } from "@/components/secret/SecretFormDialog";
import { useToast } from "@/hooks/use-toast";

const SecretDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    secrets,
    deleteSecret,
    toggleSecretStatus,
    toggleFavorite,
    fetchSecretValue,
  } = useSecrets();
  const { toast } = useToast();
  const [showValue, setShowValue] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loadedValue, setLoadedValue] = useState<string | null>(null);

  const secret = secrets.find((s) => s.id === id);

  const rotationStatus = useMemo(() => {
    const rr = secret?.meta.rotationReminder;
    if (!rr?.enabled || !rr.nextDue)
      return { label: "OK", cls: "bg-green-600 text-white" };
    const now = Date.now();
    const next = new Date(rr.nextDue).getTime();
    const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Overdue", cls: "bg-red-600 text-white" };
    if (diffDays <= 7)
      return { label: "Due Soon", cls: "bg-amber-600 text-white" };
    return { label: "OK", cls: "bg-green-600 text-white" };
  }, [secret?.meta.rotationReminder]);

  const isLongNotes = (secret?.meta.personalNotes?.length || 0) > 500;
  const [showNotes, setShowNotes] = useState(!isLongNotes);

  if (!secret) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Secret Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The secret you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link to="/secrets">Back to Secrets</Link>
        </Button>
      </div>
    );
  }

  const getEnvironmentColor = (env: string) => {
    const colors = {
      development: "bg-env-development",
      production: "bg-env-production",
      testing: "bg-env-testing",
      staging: "bg-env-staging",
    };
    return colors[env as keyof typeof colors] || "bg-gray-500";
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${secret.name}"?`)) {
      deleteSecret(secret.id);
      toast({
        title: "Secret deleted",
        description: `${secret.name} has been permanently deleted.`,
      });
      navigate("/secrets");
    }
  };

  const handleToggleStatus = () => {
    toggleSecretStatus(secret.id);
    toast({
      title: secret.meta.isActive ? "Secret deactivated" : "Secret activated",
      description: `${secret.name} is now ${
        secret.meta.isActive ? "inactive" : "active"
      }.`,
    });
  };

  const handleToggleFavorite = () => {
    toggleFavorite(secret.id);
    toast({
      title: secret.meta.isFavorite ? "Removed favorite" : "Marked favorite",
      description: `${secret.name} ${
        secret.meta.isFavorite ? "removed from" : "added to"
      } favorites.`,
    });
  };

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-amber-500 text-white";
      case "low":
        return "bg-green-600 text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const computeQuickCopy = () => {
    const fmt = secret.meta.quickCopyFormat;
    switch (fmt) {
      case "env":
        return `${secret.identifier}=${secret.value}`;
      case "json":
        return JSON.stringify({ [secret.identifier]: secret.value }, null, 2);
      case "identifier":
        return secret.identifier;
      default:
        return secret.value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/secrets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Secrets
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {secret.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {secret.project.name}
              {secret.project.module && ` • ${secret.project.module}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={secret.meta.isFavorite ? "default" : "outline"}
            size="icon"
            onClick={handleToggleFavorite}
            title={secret.meta.isFavorite ? "Unfavorite" : "Favorite"}
          >
            <Star
              className={`h-4 w-4 ${
                secret.meta.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleToggleStatus}>
            {secret.meta.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secret Value */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Secret Value</CardTitle>
            <CardDescription>
              The actual secret value - handle with care
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Identifier</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {secret.identifier}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(secret.identifier, "Identifier")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {showValue
                    ? loadedValue ?? secret.value ?? ""
                    : "••••••••••••••••••••••••••••••••"}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!showValue && !secret.value && !loadedValue) {
                      const v = await fetchSecretValue(secret.id);
                      setLoadedValue(v);
                    }
                    setShowValue(!showValue);
                  }}
                >
                  {showValue ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secret.value, "Secret value")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {secret.meta.quickCopyFormat && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        computeQuickCopy(),
                        `Quick copy (${secret.meta.quickCopyFormat})`
                      )
                    }
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {secret.meta.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <p className="p-3 bg-muted rounded-lg text-sm">
                  {secret.meta.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Secret information and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <Badge
                variant="secondary"
                className={`text-white ${getEnvironmentColor(
                  secret.environment
                )}`}
              >
                {secret.environment}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Badge
                variant={secret.meta.isActive ? "default" : "secondary"}
                className={
                  secret.meta.isActive
                    ? "bg-status-active text-white"
                    : "bg-status-inactive text-white"
                }
              >
                {secret.meta.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {secret.meta.category && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Badge variant="outline" className="text-xs">
                  {secret.meta.category}
                </Badge>
              </div>
            )}

            {secret.meta.priority && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${getPriorityStyles(
                      secret.meta.priority
                    )}`}
                  >
                    {secret.meta.priority}
                  </Badge>
                </div>
              </div>
            )}

            {secret.meta.strength && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Strength <Shield className="h-3 w-3" />
                </label>
                <p className="text-sm capitalize">{secret.meta.strength}</p>
              </div>
            )}

            {secret.meta.rotationReminder?.enabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  Rotation <RotateCcw className="h-3 w-3" />
                </label>
                <div className="text-xs space-y-1">
                  <p>
                    Interval: {secret.meta.rotationReminder.intervalDays} days
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Status:</span>
                    <Badge className={`text-xs ${rotationStatus.cls}`}>
                      {rotationStatus.label}
                    </Badge>
                  </div>
                  {secret.meta.rotationReminder.lastRotated && (
                    <p>
                      Last:{" "}
                      {new Date(
                        secret.meta.rotationReminder.lastRotated
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {secret.meta.rotationReminder.nextDue && (
                    <p>
                      Next Due:{" "}
                      {new Date(
                        secret.meta.rotationReminder.nextDue
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {secret.meta.usagePattern && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Usage Pattern</label>
                <div className="text-xs space-y-1">
                  <p>Frequency: {secret.meta.usagePattern.frequency}</p>
                  {secret.meta.usagePattern.lastUsedInProject && (
                    <p>
                      Last Used In: {secret.meta.usagePattern.lastUsedInProject}
                    </p>
                  )}
                </div>
              </div>
            )}

            {secret.meta.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {secret.meta.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground">
                {secret.meta.createdAt.toLocaleDateString()} at{" "}
                {secret.meta.createdAt.toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Updated</label>
              <p className="text-sm text-muted-foreground">
                {secret.meta.lastUpdated.toLocaleDateString()} at{" "}
                {secret.meta.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {secret.meta.personalNotes &&
        (showNotes ? (
          <Card>
            <CardHeader>
              <CardTitle>Personal Notes</CardTitle>
              <CardDescription>
                Private notes about handling this secret
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap break-words">
                {secret.meta.personalNotes}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(true)}
            >
              Show personal notes
            </Button>
          </div>
        ))}

      {/* Edit Dialog */}
      <SecretFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        secret={secret}
      />
    </div>
  );
};

export default SecretDetail;
