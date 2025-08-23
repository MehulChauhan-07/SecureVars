// Utility helpers for secret status & comparisons.

import { Secret } from "@/types/secret";

export interface SecretStatus {
  rotated: boolean;
  stale: boolean;
  inactive: boolean;
}

export function getSecretStatus(secret: Secret, staleDays = 30): SecretStatus {
  const rotated = (secret.meta.version || 1) > 1;
  const inactive = !secret.meta.isActive;
  const lastAccess = secret.meta.lastAccessed?.getTime() || 0;
  const ageMs = Date.now() - lastAccess;
  const stale =
    !inactive && lastAccess > 0 && ageMs > staleDays * 24 * 60 * 60 * 1000;
  return { rotated, stale, inactive };
}

export interface EnvDiffEntry {
  identifier: string;
  left?: Secret;
  right?: Secret;
  status: "missing-left" | "missing-right" | "different" | "same";
}

export function diffEnvironments(
  secrets: Secret[],
  envA: string,
  envB: string
): EnvDiffEntry[] {
  const byEnvA = secrets.filter((s) => s.environment === envA);
  const byEnvB = secrets.filter((s) => s.environment === envB);
  const mapA = new Map(byEnvA.map((s) => [s.identifier, s]));
  const mapB = new Map(byEnvB.map((s) => [s.identifier, s]));
  const identifiers = new Set([...mapA.keys(), ...mapB.keys()]);
  const result: EnvDiffEntry[] = [];
  identifiers.forEach((id) => {
    const a = mapA.get(id);
    const b = mapB.get(id);
    let status: EnvDiffEntry["status"];
    if (a && b) {
      status = a.value === b.value ? "same" : "different";
    } else if (a && !b) {
      status = "missing-right";
    } else {
      status = "missing-left";
    }
    result.push({ identifier: id, left: a, right: b, status });
  });
  return result.sort((x, y) => x.identifier.localeCompare(y.identifier));
}

export function collectAllTags(secrets: Secret[]): string[] {
  const set = new Set<string>();
  secrets.forEach((s) => s.meta.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
