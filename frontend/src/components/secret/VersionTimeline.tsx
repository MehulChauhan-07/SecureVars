import { Secret } from "@/types/secret";
import { useSecrets } from "@/contexts/SecretsContext";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface VersionTimelineProps {
  secret: Secret;
}

export function VersionTimeline({ secret }: VersionTimelineProps) {
  const { rollbackSecret } = useSecrets();
  const history = secret.history || [];
  const maxVersion = history.reduce((m, h) => Math.max(m, h.version), 1);
  const [previewVersion, setPreviewVersion] = useState<number>(
    secret.meta.version || 1
  );

  const previewValue = useMemo(() => {
    const entry = history.find((h) => h.version === previewVersion);
    return entry?.value ?? secret.value;
  }, [history, previewVersion, secret.value]);

  const currentVersion = secret.meta.version || 1;
  const isCurrent = previewVersion === currentVersion;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Version {previewVersion} {isCurrent ? "(current)" : "(preview)"}
        </span>
        {!isCurrent && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => rollbackSecret(secret.id, previewVersion)}
          >
            Rollback to {previewVersion}
          </Button>
        )}
      </div>
      <input
        type="range"
        min={1}
        max={maxVersion}
        value={previewVersion}
        onChange={(e) => setPreviewVersion(Number(e.target.value))}
        className="w-full"
      />
      {!isCurrent && (
        <div className="p-2 border rounded bg-muted text-xs break-all">
          Preview Value: {previewValue}
        </div>
      )}
    </div>
  );
}
