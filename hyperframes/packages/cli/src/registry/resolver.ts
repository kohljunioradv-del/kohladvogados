/**
 * Registry resolver — loads the top-level manifest and per-item manifests,
 * and walks `registryDependencies` transitively for the `add` command.
 */

import type { ItemType, RegistryItem, RegistryManifestEntry } from "@hyperframes/core";
import { fetchItemManifest, fetchRegistryManifest, DEFAULT_REGISTRY_URL } from "./remote.js";

export interface ResolveOptions {
  baseUrl?: string;
  /**
   * Called once per item that fails to load inside `loadAllItems`. Defaults
   * to writing a diagnostic line to stderr. Pass a quieter implementation
   * when rendering structured output (clack prompts, JSON, etc.).
   */
  onWarn?: (message: string) => void;
}

function defaultWarn(message: string): void {
  process.stderr.write(`hyperframes:registry ${message}\n`);
}

/**
 * List all items in the registry, optionally filtered by type. Returns empty
 * if the registry is unreachable — callers should fall back to bundled items.
 */
export async function listRegistryItems(
  filter?: { type?: ItemType },
  options: ResolveOptions = {},
): Promise<RegistryManifestEntry[]> {
  const baseUrl = options.baseUrl ?? DEFAULT_REGISTRY_URL;
  const manifest = await fetchRegistryManifest(baseUrl);
  if (!manifest) return [];
  if (!filter?.type) return manifest.items;
  return manifest.items.filter((item) => item.type === filter.type);
}

/**
 * Load every item's full manifest in parallel. Used by the interactive init
 * picker to populate titles/descriptions for all examples at once. Items that
 * fail to load are skipped with a warning so one missing manifest doesn't
 * break the picker.
 */
export async function loadAllItems(
  entries: RegistryManifestEntry[],
  options: ResolveOptions = {},
): Promise<RegistryItem[]> {
  const baseUrl = options.baseUrl ?? DEFAULT_REGISTRY_URL;
  const warn = options.onWarn ?? defaultWarn;
  const results = await Promise.allSettled(
    entries.map((e) => fetchItemManifest(e.name, e.type, baseUrl)),
  );
  const items: RegistryItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items.push(r.value);
    } else {
      const name = entries[i]?.name ?? "<unknown>";
      warn(`skipped item "${name}": ${String(r.reason)}`);
    }
  });
  return items;
}

/**
 * Look up a manifest entry by name, throwing a message that lists what the
 * registry does offer. `requiredBy` names the item that pulled this one in,
 * so a broken `registryDependencies` entry points at its dependent rather
 * than looking like a bad user-supplied name.
 */
function findEntry(
  entries: RegistryManifestEntry[],
  name: string,
  requiredBy?: string,
): RegistryManifestEntry {
  const entry = entries.find((e) => e.name === name);
  if (entry) return entry;
  const subject = requiredBy ? `Dependency "${name}" of "${requiredBy}"` : `Item "${name}"`;
  const available = entries.map((e) => e.name).join(", ");
  throw new Error(
    available.length > 0
      ? `${subject} not found in registry. Available: ${available}`
      : `${subject} not found — registry unreachable or empty.`,
  );
}

/**
 * Resolve a single item by name, ignoring its dependencies. Throws if unknown
 * or unreachable. Use `resolveItemTree` when the dependencies must be
 * installed alongside it.
 */
export async function resolveItem(
  name: string,
  options: ResolveOptions = {},
): Promise<RegistryItem> {
  const entries = await listRegistryItems(undefined, options);
  const entry = findEntry(entries, name);
  return fetchItemManifest(entry.name, entry.type, options.baseUrl);
}

/**
 * Resolve an item and everything it depends on, transitively.
 *
 * Returns a topologically sorted list: every item appears after the items it
 * depends on, and the requested item is always last. Items reachable by more
 * than one path appear once. Throws if any item in the graph is unknown or
 * unreachable, or if `registryDependencies` contains a cycle.
 */
export async function resolveItemTree(
  name: string,
  options: ResolveOptions = {},
): Promise<RegistryItem[]> {
  const entries = await listRegistryItems(undefined, options);
  const sorted: RegistryItem[] = [];
  const done = new Set<string>();
  // Names on the current DFS path — an entry that reappears here is a cycle.
  const path: string[] = [];

  async function visit(itemName: string, requiredBy?: string): Promise<void> {
    if (done.has(itemName)) return;
    const cycleStart = path.indexOf(itemName);
    if (cycleStart !== -1) {
      const loop = [...path.slice(cycleStart), itemName].join(" → ");
      throw new Error(`Circular registryDependencies: ${loop}`);
    }

    const entry = findEntry(entries, itemName, requiredBy);
    const item = await fetchItemManifest(entry.name, entry.type, options.baseUrl);

    path.push(itemName);
    // Sequential so a cycle is reported along the path that found it, and so
    // the sort stays deterministic. Dependency lists are small; manifests are
    // cached by `fetchItemManifest`, so diamonds cost one fetch, not N.
    for (const dep of item.registryDependencies ?? []) {
      await visit(dep, itemName);
    }
    path.pop();

    done.add(itemName);
    sorted.push(item);
  }

  await visit(name);
  return sorted;
}
