## Critical Rules

1. MUST use `bun` for package management and running scripts.
2. Run `bun run lint` for lint errors, then `bun run typecheck` for type errors. Don't run `format` — formatting is applied via `bun run fix` and the pre-commit hook.
3. Plugin entry is `src/index.ts`: default-export `Plugin.define({ id: "academy", setup })` from `@opencode/plugin` (Promise API). `setup` may return a cleanup function that runs on unload.
4. Transforms are synchronous edits of domain state: load external data before registering, then call `reload()` when captured inputs change. Later transforms see earlier ones; a read value is never mutated by later rebuilds.
5. Don't use `git stash` mid-session; other agents or the user can edit files at the same time.
6. Follow conventional commits: `type(scope): summary` with types `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

## Communication

- Human-facing output (replies, commit messages, PR text): fewest words that carry the point.
- No superlatives, praise, or agreement padding. State disagreements and risks plainly.

## Design Principles

Optimize the design for the normal flow. If the happy path is 95% of behavior, it should be ~95% of what a reader sees.

- Make top-level code read like a use case: `setup` registers well-named tools, commands, and hooks; push protocol details and state surgery into the lowest module that owns them.
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

## Maintenance & Tasks

- MUST use `bun` for package management.
- Run `lint` command to check for linting errors, then run `typecheck` for type errors. DON'T use bare `tsc` from the repo root and DON'T run `format` — it's triggered automatically by other pipelines.
- Follow conventional commits: `type(scope): summary` with types `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
