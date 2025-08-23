import { useState } from "react";
import { useSecrets } from "@/contexts/SecretsContext";
import { diffEnvironments, EnvDiffEntry } from "@/lib/secretUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ENVIRONMENTS = ["development", "staging", "testing", "production"];

export default function EnvCompare() {
  const { secrets } = useSecrets();
  const [leftEnv, setLeftEnv] = useState("development");
  const [rightEnv, setRightEnv] = useState("production");
  const [query, setQuery] = useState("");

  const diff = diffEnvironments(secrets, leftEnv, rightEnv).filter((d) =>
    d.identifier.toLowerCase().includes(query.toLowerCase())
  );

  const color = (entry: EnvDiffEntry) => {
    switch (entry.status) {
      case "same":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "different":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "missing-left":
      case "missing-right":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-medium">Left Environment</label>
              <Select value={leftEnv} onValueChange={setLeftEnv}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.filter((e) => e !== rightEnv).map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Right Environment</label>
              <Select value={rightEnv} onValueChange={setRightEnv}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.filter((e) => e !== leftEnv).map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Filter</label>
              <Input
                placeholder="Identifier search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <div className="border rounded-md divide-y">
            <div className="grid grid-cols-5 text-xs font-medium px-3 py-2 bg-muted">
              <div>Identifier</div>
              <div>{leftEnv} Value</div>
              <div>{rightEnv} Value</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {diff.map((entry) => (
              <div
                key={entry.identifier}
                className="grid grid-cols-5 text-xs px-3 py-2 gap-2"
              >
                <div className="font-mono break-all">{entry.identifier}</div>
                <div className="break-all">
                  {entry.left ? (
                    entry.left.value
                  ) : (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </div>
                <div className="break-all">
                  {entry.right ? (
                    entry.right.value
                  ) : (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </div>
                <div>
                  <Badge className={`text-[10px] ${color(entry)}`}>
                    {entry.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {entry.left &&
                    entry.right &&
                    entry.status === "different" && (
                      <button className="underline text-blue-600 dark:text-blue-400">
                        Sync →
                      </button>
                    )}
                </div>
              </div>
            ))}
            {diff.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground">
                No differences / entries.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
