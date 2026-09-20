# Academy

OpenCode V2 plugin (Bun + TypeScript).

## Use it

Add the published package or a local path to `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["academy", "./plugins/academy"],
}
```

Local paths resolve relative to the config file. A `plugins/` directory beside a project-root `opencode.jsonc` is not auto-discovered — put it under `.opencode/` or reference it explicitly.

## Develop

```bash
bun install
bun run lint       # oxlint via Ultracite
bun run typecheck  # tsc --noEmit
bun run check      # ultracite check (lint, no fixes)
bun run fix        # ultracite fix (lint + format)
```

Install git hooks once with `bunx lefthook install`.

## Structure

```text
src/index.ts      # plugin entry: default-exported Plugin.define({ id: "academy", setup })
oxlint.config.ts  # Ultracite core rules
oxfmt.config.ts   # Ultracite formatting
lefthook.yml      # pre-commit: oxlint --fix + oxfmt
AGENTS.md         # repo rules for agents
```

`setup` registers tools, commands, and hooks through the plugin context (`ctx.tool`, `ctx.command`, `ctx.session`, `ctx.storage`). Transforms are synchronous; load external data before registering and call `reload()` when captured inputs change. See the [OpenCode plugin docs](https://opencode.ai/v2/docs/build/plugins) for the full API.

## License

MIT
