import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSecrets } from "@/hooks/use-secrets";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Upload,
  Download,
  Heart,
  Copy,
  History,
  Star,
  AlertTriangle,
  ArrowDownUp,
} from "lucide-react";
// import { QuickActionsSidebar } from "@/components/QuickActionsSidebar";
import { SecretTemplates } from "@/components/secret/SecretTemplates";
import { Link } from "react-router-dom";
import { Secret } from "@/types/secret";
import { SecretFormDialog } from "@/components/secret/SecretFormDialog";
import { ImportExportDialog } from "@/components/secret/ImportExportDialog";
import { BulkActionsBar } from "@/components/secret/BulkActionsBar";
import { SecretHistoryDialog } from "@/components/secret/SecretHistoryDialog";
import { CopyFormatsDialog } from "@/components/secret/CopyFormatsDialog";
import { useToast } from "@/hooks/use-toast";

const ENV_COLORS: Record<string, string> = {
  development: "bg-env-development",
  production: "bg-env-production",
  testing: "bg-env-testing",
  staging: "bg-env-staging",
};

const SecretsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    secrets,
    deleteSecret,
    toggleSecretStatus,
    toggleFavorite,
    accessSecret,
    selectedSecrets,
    toggleSelectedSecret,
    clearSelectedSecrets,
    checkDuplicateIdentifier,
  } = useSecrets();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<string>("all");
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCopyFormats, setShowCopyFormats] = useState(false);
  const [historySecret, setHistorySecret] = useState<Secret | null>(null);
  const [copySecret, setCopySecret] = useState<Secret | null>(null);

  // Optimistic UI overrides
  const [favoriteOverride, setFavoriteOverride] = useState<
    Record<string, boolean | undefined>
  >({});
  const [activeOverride, setActiveOverride] = useState<
    Record<string, boolean | undefined>
  >({});

  const getIsFavorite = (s: Secret) =>
    favoriteOverride[s.id] ?? s.meta.isFavorite ?? false;
  const getIsActive = (s: Secret) =>
    activeOverride[s.id] ?? s.meta.isActive ?? false;

  // Initialize filters from URL params on mount
  useEffect(() => {
    const q = searchParams.get("q");
    const env = searchParams.get("env");
    const proj = searchParams.get("project");
    const status = searchParams.get("status");
    const fav = searchParams.get("fav");
    if (q !== null) setSearchQuery(q);
    if (env) setEnvironmentFilter(env);
    if (proj) setProjectFilter(proj);
    if (status) setStatusFilter(status);
    if (fav) setFavoriteFilter(fav);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (environmentFilter !== "all") params.env = environmentFilter;
    if (projectFilter !== "all") params.project = projectFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    if (favoriteFilter !== "all") params.fav = favoriteFilter;
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    environmentFilter,
    projectFilter,
    statusFilter,
    favoriteFilter,
    setSearchParams,
  ]);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "a":
            event.preventDefault();
            // Select all visible secrets
            break;
          case "i":
            event.preventDefault();
            setShowImportExport(true);
            break;
          case "f":
            event.preventDefault();
            // Focus search
            (
              document.querySelector(
                'input[placeholder*="Search"]'
              ) as HTMLInputElement
            )?.focus();
            break;
        }
      }
      if (event.key === "Escape") {
        clearSelectedSecrets();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelectedSecrets]);

  const projects = useMemo(() => {
    return [...new Set(secrets.map((s) => s.project.name))];
  }, [secrets]);

  const filteredSecrets = useMemo(() => {
    return secrets
      .filter((secret) => {
        const matchesSearch =
          secret.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          secret.identifier
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) ||
          secret.project.name
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) ||
          secret.meta.description
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) ||
          secret.meta.tags.some((tag) =>
            tag.toLowerCase().includes(debouncedQuery.toLowerCase())
          );

        const matchesEnvironment =
          environmentFilter === "all" ||
          secret.environment === environmentFilter;
        const matchesProject =
          projectFilter === "all" || secret.project.name === projectFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && getIsActive(secret)) ||
          (statusFilter === "inactive" && !getIsActive(secret));
        const matchesFavorite =
          favoriteFilter === "all" ||
          (favoriteFilter === "favorites" && getIsFavorite(secret)) ||
          (favoriteFilter === "non-favorites" && !getIsFavorite(secret));

        return (
          matchesSearch &&
          matchesEnvironment &&
          matchesProject &&
          matchesStatus &&
          matchesFavorite
        );
      })
      .sort((a, b) => {
        // Sort by favorites first, then by last updated
        const aFav = getIsFavorite(a);
        const bFav = getIsFavorite(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return b.meta.lastUpdated.getTime() - a.meta.lastUpdated.getTime();
      });
  }, [
    secrets,
    debouncedQuery,
    environmentFilter,
    projectFilter,
    statusFilter,
    favoriteFilter,
    favoriteOverride,
    activeOverride,
  ]);

  const getEnvironmentColor = (env: string) => ENV_COLORS[env] || "bg-gray-500";

  const handleDelete = (secret: Secret) => {
    if (window.confirm(`Are you sure you want to delete "${secret.name}"?`)) {
      deleteSecret(secret.id);
      toast({
        title: "Secret deleted",
        description: `${secret.name} has been permanently deleted.`,
      });
    }
  };

  const handleToggleStatus = async (secret: Secret) => {
    const prev = getIsActive(secret);
    setActiveOverride((m) => ({ ...m, [secret.id]: !prev }));
    try {
      await toggleSecretStatus(secret.id);
      setActiveOverride((m) => ({ ...m, [secret.id]: undefined }));
      toast({
        title: prev ? "Secret deactivated" : "Secret activated",
        description: `${secret.name} is now ${prev ? "inactive" : "active"}.`,
      });
    } catch (err) {
      setActiveOverride((m) => ({ ...m, [secret.id]: prev }));
      toast({
        title: "Failed to update status",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (secret: Secret) => {
    const prev = getIsFavorite(secret);
    setFavoriteOverride((m) => ({ ...m, [secret.id]: !prev }));
    try {
      await toggleFavorite(secret.id);
      setFavoriteOverride((m) => ({ ...m, [secret.id]: undefined }));
      toast({
        title: prev ? "Removed from favorites" : "Added to favorites",
        description: `${secret.name} has been ${
          prev ? "removed from" : "added to"
        } favorites.`,
      });
    } catch (err) {
      setFavoriteOverride((m) => ({ ...m, [secret.id]: prev }));
      toast({
        title: "Failed to update favorites",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleViewSecret = (secret: Secret) => {
    accessSecret(secret.id);
  };

  const handleShowHistory = (secret: Secret) => {
    setHistorySecret(secret);
    setShowHistory(true);
  };

  const handleShowCopyFormats = (secret: Secret) => {
    setCopySecret(secret);
    setShowCopyFormats(true);
  };

  const hasSelections = selectedSecrets.length > 0;
  const allVisibleSelected =
    filteredSecrets.length > 0 &&
    filteredSecrets.every((s) => selectedSecrets.includes(s.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      clearSelectedSecrets();
    } else {
      filteredSecrets.forEach((secret) => {
        if (!selectedSecrets.includes(secret.id)) {
          toggleSelectedSecret(secret.id);
        }
      });
    }
  };

  const getDuplicateWarning = (identifier: string, id: string) => {
    return checkDuplicateIdentifier(identifier, id);
  };

  return (
    <div className="flex gap-6">
      {/* <QuickActionsSidebar /> */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Secrets</h1>
            <p className="text-muted-foreground mt-2">
              Manage and search through all your environment variables and
              secrets
            </p>
          </div>
          <div className="flex space-x-2">
            {/* <SecretTemplates /> */}
            <Button
              onClick={() => setShowImportExport(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowDownUp className="h-4 w-4" />
              <span>Import/Export</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
            <CardDescription>
              Filter and search through your secrets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search secrets, tags, projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={environmentFilter}
                onValueChange={setEnvironmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Favorites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Secrets</SelectItem>
                  <SelectItem value="favorites">Favorites Only</SelectItem>
                  <SelectItem value="non-favorites">Non-favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSecrets.length} of {secrets.length} secrets
              </p>
              <div className="flex space-x-2">
                {(searchQuery ||
                  environmentFilter !== "all" ||
                  projectFilter !== "all" ||
                  statusFilter !== "all" ||
                  favoriteFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setEnvironmentFilter("all");
                      setProjectFilter("all");
                      setStatusFilter("all");
                      setFavoriteFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                {hasSelections && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportExport(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secrets Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all secrets"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecrets.map((secret) => (
                  <TableRow
                    key={secret.id}
                    className={
                      selectedSecrets.includes(secret.id) ? "bg-muted/50" : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedSecrets.includes(secret.id)}
                        onCheckedChange={() => toggleSelectedSecret(secret.id)}
                        aria-label={`Select ${secret.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{secret.name}</span>
                        {secret.meta.isFavorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {getDuplicateWarning(secret.identifier, secret.id) && (
                          <div title="Duplicate identifier detected">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {secret.identifier}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{secret.project.name}</div>
                        {secret.project.module && (
                          <div className="text-xs text-muted-foreground">
                            {secret.project.module}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-white text-xs ${getEnvironmentColor(
                          secret.environment
                        )}`}
                      >
                        {secret.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getIsActive(secret) ? "default" : "secondary"}
                        className={
                          getIsActive(secret)
                            ? "bg-status-active text-white"
                            : "bg-status-inactive text-white"
                        }
                      >
                        {getIsActive(secret) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {secret.meta.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {secret.meta.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{secret.meta.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {secret.meta.lastUpdated.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/secrets/${secret.id}`}
                              className="flex items-center"
                              onClick={() => handleViewSecret(secret)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingSecret(secret)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleShowCopyFormats(secret)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Formats
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleFavorite(secret)}
                          >
                            <Heart
                              className={`h-4 w-4 mr-2 ${
                                secret.meta.isFavorite
                                  ? "text-red-500 fill-current"
                                  : ""
                              }`}
                            />
                            {secret.meta.isFavorite
                              ? "Remove from Favorites"
                              : "Add to Favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(secret)}
                          >
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
                          </DropdownMenuItem>
                          {secret.history && secret.history.length > 1 && (
                            <DropdownMenuItem
                              onClick={() => handleShowHistory(secret)}
                            >
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(secret)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredSecrets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No secrets found matching your criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        {editingSecret && (
          <SecretFormDialog
            open={!!editingSecret}
            onOpenChange={(open) => !open && setEditingSecret(null)}
            secret={editingSecret}
          />
        )}

        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          selectedSecrets={selectedSecrets}
        />

        <SecretHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          secret={historySecret}
        />

        <CopyFormatsDialog
          open={showCopyFormats}
          onOpenChange={setShowCopyFormats}
          secret={copySecret}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar visible={hasSelections} />
      </div>
    </div>
  );
};

export default SecretsList;
