## Critical Rules

1. MUST use `bun` for package management and running scripts.
2. Run `bun run lint` for lint errors, then `bun run typecheck` for type errors. Don't run `format` — formatting is applied via `bun run fix` and the pre-commit hook.
3. Plugin entry is `src/index.ts`: default-export `Plugin.define({ id: "academy", effect })` from `@opencode/plugin/effect`. The effect runs in a managed scope; scoped registrations are disposed when the plugin unloads.
4. Transforms are synchronous edits of domain state: load external data before registering, then call `reload()` when captured inputs change. Later transforms see earlier ones; a read value is never mutated by later rebuilds.
5. Academy owns the Umamusume agent roster: Rudolf is the default primary agent; Agnes, Cafe, Dantsu, and Bellno are specialist subagents. Register them through `ctx.agent.transform`, not project or user configuration.
6. Don't use `git stash` mid-session; other agents or the user can edit files at the same time.
7. Follow conventional commits: `type(scope): summary` with types `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
8. Do not preserve backward compatibility; remove legacy names, aliases, and configuration when replacing behavior.

## Communication

- Human-facing output (replies, commit messages, PR text): fewest words that carry the point.
- No superlatives, praise, or agreement padding. State disagreements and risks plainly.

## Design Principles

Optimize the design for the normal flow. If the happy path is 95% of behavior, it should be ~95% of what a reader sees.

- Make top-level code read like a use case: the plugin effect registers well-named agents, tools, commands, and hooks; push protocol details and state surgery into the lowest module that owns them.
- Patterns, layers, interfaces, and files are costs. Add one only when it owns a real invariant, hides real complexity, has multiple real implementations, removes stable duplication, or creates a proven boundary.
- Prefer deletion and the smallest correct diff. Do not add a dependency, abstraction, configuration, or flexibility without a proven present need.
- Never reduce validation at trust boundaries or explicitly requested behavior to make a change smaller.
- Before adding code, confirm that a change is needed. Reuse the plugin context API (`ctx.tool`, `ctx.command`, `ctx.session`, `ctx.storage`) before writing custom plumbing; search for a maintained third-party library before building one.
- For non-trivial behavior owned by this repository, add the smallest focused check that proves it.

## TypeScript Style

- Use guard clauses and early returns; avoid `else`.
- Avoid `try`/`catch` where possible.
- Access properties with dot notation (`obj.a`) instead of destructuring.
- Inline single-use variables and intermediate bindings.
- Type-guard `filter` callbacks to preserve inference.
- Rely on type inference; annotate only at exports and boundaries.
- Avoid the `any` type.
- Prefer `const`; use ternaries or early returns instead of reassignment.
- Never alias imports (`import { x as y }`) and never use star imports.
- Prefer functional array methods (`map`, `filter`, `flatMap`) over `for` loops.
- Comments are rare and explain why, not what.
- Name recurring or spec-defined values as consts or enums; inline self-explanatory one-off literals.
- Prefer options objects or enums over positional boolean parameters.
- Enforcement: `bun run lint`.

## Effect TS

- Use the Effect-native OpenCode API from `@opencode/plugin/effect`; do not bridge Promise plugin methods with `Effect.promise`.
- Name workflows with `Effect.fn("Module.method")`.
- Yield scoped registrations directly so OpenCode disposes them with the plugin scope.
- Put expected failures in the error channel. Do not use `try`/`catch` around Effect workflows or turn failures into defects.
- Keep pure parsing, validation, and definition building synchronous; do not return `Effect` from helpers that perform no effectful work.
- Decode untrusted data with `Schema` at the boundary rather than asserting types or wrapping `JSON.parse` in `Effect.try`.
- Bind services before calling their methods. Do not nest calls on a yielded service.
- Use one `ManagedRuntime` per process only when code must cross from Promise callbacks into Effect. Plugin entrypoints do not need one.

## Maintenance & Tasks

- MUST use `bun` for package management.
- Run `lint` command to check for linting errors, then run `typecheck` for type errors. DON'T use bare `tsc` from the repo root and DON'T run `format` — it's triggered automatically by other pipelines.
- Follow conventional commits: `type(scope): summary` with types `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
