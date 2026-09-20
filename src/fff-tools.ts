import { realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import { FileFinder } from "@ff-labs/fff-bun";
import type {
  FileFinderApi,
  GrepCursor,
  GrepMatch,
  GrepMode,
} from "@ff-labs/fff-bun";
import type { Plugin } from "@opencode/plugin/effect";
import type { Session } from "@opencode/schema/session";
import { Tool } from "@opencode/schema/tool";
import { Effect, Schema } from "effect";

export namespace FffTools {
  type Finder = FileFinderApi;
  interface FinderEntry {
    readonly root: string;
    readonly finder: Finder;
    active: number;
    lastUsed: number;
    readonly retained: boolean;
    timer?: ReturnType<typeof setTimeout>;
  }
  interface Target {
    readonly root: string;
    readonly constraint?: string;
    readonly kind: "file" | "directory";
  }

  const resultLimit = 100;
  const grepTimeoutMs = 1500;
  const indexTimeoutMs = 10_000;
  const auxiliaryLimit = 3;
  const auxiliaryIdleMs = 5 * 60_000;

  const GlobInput = Schema.Struct({
    path: Schema.optionalKey(Schema.String),
    pattern: Schema.String,
  });

  const GrepInput = Schema.Struct({
    additionalPatterns: Schema.optionalKey(Schema.Array(Schema.String)),
    include: Schema.optionalKey(Schema.String),
    mode: Schema.optionalKey(
      Schema.Literals(["regex", "plain", "fuzzy", "multi"])
    ),
    path: Schema.optionalKey(Schema.String),
    pattern: Schema.String,
  });

  const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

  const toolError = (error: unknown) =>
    new Tool.Error({ message: errorMessage(error) });

  const attempt = <Value>(operation: () => Promise<Value>) =>
    Effect.tryPromise({ catch: toolError, try: operation });

  const posix = (value: string) => value.replaceAll(path.sep, "/");

  const displayPath = (target: Target) =>
    target.constraint ? path.join(target.root, target.constraint) : target.root;

  const normalizeFileConstraint = (value: string | undefined) => {
    if (!value) {
      return;
    }

    const normalized = posix(value.trim()).replace(/^\/+/u, "");
    if (!normalized) {
      return;
    }
    if (/\s/u.test(normalized)) {
      throw new Error(
        `FFF file constraints cannot contain whitespace: ${value}`
      );
    }
    if (
      normalized.includes("/") ||
      normalized.includes("{") ||
      normalized.startsWith("*.")
    ) {
      return normalized;
    }
    return `**/${normalized}`;
  };

  const normalizeSearchInput = (value: string | undefined) => {
    if (value === undefined) {
      return ".";
    }

    const trimmed = value.trim();
    return !trimmed || trimmed === "." || trimmed === "./" || trimmed === "/"
      ? "."
      : trimmed;
  };

  const normalizeGlobPattern = (pattern: string) =>
    pattern.trim().replace(/^\/+/u, "");

  const makeFinder = (root: string) => {
    if (root === path.parse(root).root) {
      throw new Error("FFF will not index the filesystem root");
    }

    const result = FileFinder.create({
      aiMode: true,
      basePath: root,
      enableHomeDirScanning: root === homedir(),
    });
    if (!result.ok) {
      throw new Error(`Failed to initialize FFF for ${root}: ${result.error}`);
    }
    return result.value;
  };

  const formatMatches = (
    root: string,
    items: readonly GrepMatch[],
    more: boolean
  ) => {
    if (items.length === 0) {
      return "No files found";
    }

    const output = [
      `Found ${items.length} matches${more ? " (more files available)" : ""}`,
    ];
    let current = "";
    for (const match of items) {
      const file = path.resolve(root, match.relativePath);
      if (file !== current) {
        if (current) {
          output.push("");
        }
        current = file;
        output.push(`${file}:`);
      }
      const text =
        match.lineContent.length > 2000
          ? `${match.lineContent.slice(0, 2000)}...`
          : match.lineContent;
      output.push(`  Line ${match.lineNumber}: ${text}`);
    }
    if (more) {
      output.push(
        "",
        "(Results truncated. Use a more specific path, include pattern, or search expression.)"
      );
    }
    return output.join("\n");
  };

  export const register = Effect.fn("FffTools.register")(function* register(
    ctx: Plugin.Context
  ) {
    if (!FileFinder.isAvailable()) {
      return yield* Effect.die(
        new Error("The native FFF library is unavailable")
      );
    }

    const finders = new Map<string, FinderEntry>();
    const scopes = new Map<string, string>();

    const destroyEntry = (entry: FinderEntry) => {
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
      entry.finder.destroy();
      finders.delete(entry.root);
    };

    const evictOne = () => {
      const [idle] = [...finders.values()]
        .filter((entry) => entry.active === 0)
        .toSorted((left, right) => left.lastUsed - right.lastUsed);
      if (idle) {
        destroyEntry(idle);
      }
      return Boolean(idle);
    };

    const acquire = (root: string) => {
      if (root === homedir() || root === path.parse(root).root) {
        throw new Error(
          `FFF cannot index the home directory or filesystem root; use a smaller directory: ${root}`
        );
      }

      let entry = finders.get(root);
      if (!entry) {
        entry = {
          active: 0,
          finder: makeFinder(root),
          lastUsed: Date.now(),
          retained: finders.size < auxiliaryLimit || evictOne(),
          root,
        };
        finders.set(root, entry);
      }
      if (entry.timer) {
        clearTimeout(entry.timer);
      }
      entry.active += 1;
      entry.lastUsed = Date.now();

      return {
        finder: entry.finder,
        release: () => {
          entry.active -= 1;
          entry.lastUsed = Date.now();
          if (!entry.retained) {
            if (entry.active === 0) {
              destroyEntry(entry);
            }
            return;
          }
          entry.timer = setTimeout(() => {
            if (
              entry.active === 0 &&
              Date.now() - entry.lastUsed >= auxiliaryIdleMs
            ) {
              destroyEntry(entry);
            }
          }, auxiliaryIdleMs);
        },
      };
    };

    const scopeFor = Effect.fn("FffTools.scopeFor")(function* scopeFor(
      sessionID: Session.ID
    ) {
      const cached = scopes.get(sessionID);
      if (cached) {
        return cached;
      }

      const session = yield* ctx.session
        .get({ sessionID })
        .pipe(Effect.mapError(toolError));
      const scope = yield* attempt(() => realpath(session.location.directory));
      scopes.set(sessionID, scope);
      return scope;
    });

    const resolveTarget = Effect.fn("FffTools.resolveTarget")(
      function* resolveTarget(rawPath: string | undefined, directory: string) {
        const normalized = normalizeSearchInput(rawPath);
        let requested = path.resolve(directory, normalized);
        let info = yield* attempt(() => stat(requested).catch(() => null));
        if (
          !info &&
          typeof rawPath === "string" &&
          rawPath.trim().startsWith("/")
        ) {
          const stripped = rawPath.trim().replace(/^\/+/u, "");
          if (stripped && stripped !== normalized) {
            const retry = path.resolve(directory, stripped);
            const retryInfo = yield* attempt(() =>
              stat(retry).catch(() => null)
            );
            if (retryInfo) {
              requested = retry;
              info = retryInfo;
            }
          }
        }
        if (!info) {
          return yield* Effect.fail(
            toolError(
              new Error(
                `Search path does not exist: ${requested} (received: ${JSON.stringify(rawPath ?? null)}). Use a workspace-relative path like 'apps/web', '.' for the workspace root, or an absolute directory outside the workspace.`
              )
            )
          );
        }
        if (!info.isDirectory() && !info.isFile()) {
          return yield* Effect.fail(
            toolError(
              new Error(`Search path must be a file or directory: ${requested}`)
            )
          );
        }

        const target = yield* attempt(() => realpath(requested));
        if (target === homedir() || target === path.parse(target).root) {
          return yield* Effect.fail(
            toolError(
              new Error(
                `FFF cannot index the home directory or filesystem root; use a smaller directory: ${target}`
              )
            )
          );
        }

        return info.isDirectory()
          ? ({ kind: "directory", root: target } satisfies Target)
          : ({
              constraint: path.basename(target),
              kind: "file",
              root: path.dirname(target),
            } satisfies Target);
      }
    );

    const withFinder = <Value>(
      target: Target,
      run: (finder: Finder) => Value
    ) =>
      Effect.acquireUseRelease(
        Effect.try({ catch: toolError, try: () => acquire(target.root) }),
        (lease) =>
          Effect.gen(function* useFinder() {
            const ready = yield* attempt(() =>
              lease.finder.waitForScan(indexTimeoutMs)
            );
            if (!ready.ok) {
              return yield* Effect.fail(toolError(new Error(ready.error)));
            }
            if (!ready.value) {
              return yield* Effect.fail(
                toolError(
                  new Error(
                    `FFF did not finish indexing ${target.root} within ${indexTimeoutMs}ms`
                  )
                )
              );
            }
            return yield* Effect.try({
              catch: toolError,
              try: () => run(lease.finder),
            });
          }),
        (lease) => Effect.sync(lease.release)
      );

    yield* ctx.tool.transform((editor) => {
      editor.add({
        description:
          "Use this tool to find workspace files by name or path when the exact path is unknown. Give pattern a glob such as '**/*.ts' or '**/config.*'; use path to limit the search to a directory. Prefer this to shell find or ls for file discovery. Returns absolute paths ordered by relevance.",
        execute: Effect.fn("FffTools.glob")(
          function* executeGlob(input, context) {
            const pattern = normalizeGlobPattern(input.pattern);
            if (!pattern) {
              return yield* Effect.fail(
                toolError(new Error("A glob pattern is required"))
              );
            }

            const scope = yield* scopeFor(context.sessionID);
            const target = yield* resolveTarget(input.path, scope);
            if (target.kind !== "directory") {
              return yield* Effect.fail(
                toolError(
                  new Error(`Glob path must be a directory: ${input.path}`)
                )
              );
            }
            yield* context.progress({ title: displayPath(target) });

            const result = yield* withFinder(target, (finder) =>
              finder.glob(pattern, {
                pageIndex: 0,
                pageSize: resultLimit + 1,
              })
            );
            if (!result.ok) {
              return yield* Effect.fail(toolError(new Error(result.error)));
            }

            const items = result.value.items.slice(0, resultLimit);
            const truncated = result.value.totalMatched > items.length;
            const output = items.map((item) =>
              path.resolve(target.root, item.relativePath)
            );
            if (output.length === 0) {
              output.push("No files found");
            }
            if (truncated) {
              output.push(
                "",
                `(Results are truncated: showing first ${resultLimit} results. Use a more specific path or pattern.)`
              );
            }
            return {
              content: output.join("\n"),
              metadata: { count: items.length, more: truncated },
            };
          }
        ),
        input: GlobInput,
        name: "glob",
        options: { codemode: false, permission: "glob" },
      });

      editor.add({
        description:
          "Use this tool to search workspace file contents for symbols, imports, error text, or other code. Prefer this to shell grep or rg. Use regex mode for regular expressions, plain for exact literal text, fuzzy for approximate text, and multi for literal OR searches with additionalPatterns. Narrow with path or include when possible.",
        execute: Effect.fn("FffTools.grep")(
          function* executeGrep(input, context) {
            if (!input.pattern.trim()) {
              return yield* Effect.fail(
                toolError(new Error("A search pattern is required"))
              );
            }
            if (
              (input.additionalPatterns ?? []).some(
                (candidate) => !candidate.trim()
              )
            ) {
              return yield* Effect.fail(
                toolError(new Error("additionalPatterns must be non-empty"))
              );
            }
            if (
              input.mode !== "multi" &&
              (input.additionalPatterns?.length ?? 0) > 0
            ) {
              return yield* Effect.fail(
                toolError(
                  new Error("additionalPatterns can only be used in multi mode")
                )
              );
            }

            const scope = yield* scopeFor(context.sessionID);
            const target = yield* resolveTarget(input.path, scope);
            yield* context.progress({ title: displayPath(target) });
            const constraints = yield* Effect.try({
              catch: toolError,
              try: () =>
                [
                  target.kind === "file"
                    ? normalizeFileConstraint(target.constraint)
                    : undefined,
                  normalizeFileConstraint(input.include),
                ].filter((value): value is string => Boolean(value)),
            });
            const mode = input.mode ?? "regex";

            const result = yield* withFinder(target, (finder) => {
              const runPage = (cursor: GrepCursor | null) => {
                const page = {
                  cursor,
                  maxMatchesPerFile: resultLimit + 1,
                  pageSize: resultLimit,
                  timeBudgetMs: grepTimeoutMs,
                };
                if (mode === "multi") {
                  return finder.multiGrep({
                    ...page,
                    constraints: constraints.join(" ") || undefined,
                    patterns: [
                      input.pattern,
                      ...(input.additionalPatterns ?? []),
                    ],
                  });
                }
                return finder.grep([...constraints, input.pattern].join(" "), {
                  ...page,
                  mode: mode as GrepMode,
                });
              };

              const first = runPage(null);
              if (!first.ok || target.kind !== "file") {
                return first;
              }

              const items = first.value.items.filter(
                (match) => match.relativePath === target.constraint
              );
              let searched = first.value.totalFilesSearched;
              let cursor = first.value.nextCursor;
              while (cursor && items.length === 0) {
                const next = runPage(cursor);
                if (!next.ok) {
                  return next;
                }
                items.push(
                  ...next.value.items.filter(
                    (match) => match.relativePath === target.constraint
                  )
                );
                searched += next.value.totalFilesSearched;
                cursor = next.value.nextCursor;
              }
              return {
                ok: true as const,
                value: {
                  ...first.value,
                  filteredFileCount: first.value.filteredFileCount,
                  items,
                  nextCursor: null,
                  totalFilesSearched: searched,
                  totalMatched: items.length,
                },
              };
            });
            if (!result.ok) {
              return yield* Effect.fail(toolError(new Error(result.error)));
            }
            if (result.value.regexFallbackError && mode === "regex") {
              return yield* Effect.fail(
                toolError(
                  new Error(
                    `Invalid regular expression: ${result.value.regexFallbackError}`
                  )
                )
              );
            }

            const items = result.value.items.slice(0, resultLimit);
            const more =
              result.value.items.length > items.length ||
              result.value.nextCursor !== null;
            return {
              content: formatMatches(target.root, items, more),
              metadata: {
                filteredFileCount: result.value.filteredFileCount,
                matches: items.length,
                mode,
                more,
                totalFilesSearched: result.value.totalFilesSearched,
              },
            };
          }
        ),
        input: GrepInput,
        name: "grep",
        options: { codemode: false, permission: "grep" },
      });
    });

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        for (const entry of finders.values()) {
          destroyEntry(entry);
        }
        finders.clear();
      })
    );
  });
}
