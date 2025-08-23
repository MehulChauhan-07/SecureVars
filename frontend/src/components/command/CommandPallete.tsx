import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSecrets } from "@/contexts/SecretsContext";
import { Secret } from "@/types/secret";
import { Dialog } from "@/components/ui/dialog"; // assuming shadcn dialog present
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaletteItem {
  type: "secret" | "action" | "environment";
  id: string;
  label: string;
  action?: () => void;
  meta?: string;
}

const ENVIRONMENTS = ["development", "staging", "testing", "production"];

export function CommandPalette() {
  const { secrets } = useSecrets();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [envFilter, setEnvFilter] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  // Global shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const items: PaletteItem[] = useMemo(() => {
    const base: PaletteItem[] = [];

    // actions
    base.push({
      type: "action",
      id: "create-secret",
      label: "Create New Secret",
      action: () => {
        navigate("/secrets"); // open list; trigger add dialog could be via event bus
      },
    });
    base.push({
      type: "action",
      id: "compare-envs",
      label: "Compare Environments",
      action: () => navigate("/compare"),
    });

    // environment filters
    ENVIRONMENTS.forEach((env) => {
      base.push({
        type: "environment",
        id: `env-${env}`,
        label: `Filter: ${env}`,
        action: () => setEnvFilter(envFilter === env ? null : env),
      });
    });

    // secrets
    let filtered = secrets;
    if (envFilter)
      filtered = filtered.filter((s) => s.environment === envFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.identifier.toLowerCase().includes(q) ||
          s.project.name.toLowerCase().includes(q)
      );
    }
    filtered.slice(0, 30).forEach((s: Secret) => {
      base.push({
        type: "secret",
        id: s.id,
        label: s.identifier,
        meta: `${s.project.name} • ${s.environment}`,
        action: () => navigate(`/secrets/${s.id}`),
      });
    });
    return base;
  }, [secrets, query, envFilter, navigate]);

  useEffect(() => {
    setHighlight((h) => {
      if (h >= items.length) return 0;
      return h;
    });
  }, [items]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      const it = items[highlight];
      if (it?.action) {
        it.action();
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-background border rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <Input
            autoFocus
            placeholder="Search secrets or type an action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {envFilter && (
            <div className="mt-2 text-xs text-muted-foreground">
              Environment filter: {envFilter} (select again to clear)
            </div>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto text-sm">
          {items.map((it, i) => (
            <li
              key={it.id}
              className={`px-3 py-2 cursor-pointer flex justify-between ${
                i === highlight ? "bg-accent text-accent-foreground" : ""
              }`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                it.action?.();
                setOpen(false);
              }}
            >
              <span>
                {it.label}
                {it.type === "environment" &&
                  envFilter === it.label.replace("Filter: ", "") &&
                  " (active)"}
              </span>
              {it.meta && (
                <span className="text-muted-foreground">{it.meta}</span>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">No results</li>
          )}
        </ul>
        <div className="p-2 border-t text-[11px] flex justify-between text-muted-foreground">
          <span>↑ ↓ to navigate • Enter to select • Esc to close</span>
          <span>Filter env via entries “Filter: ...”</span>
        </div>
      </div>
    </div>
  );
}
