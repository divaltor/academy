# Academy

An OpenCode plugin inspired by Tracen Academy from _Umamusume: Pretty Derby_.

> "Eclipse first, the rest nowhere."

Tracen Academy is a boarding school that trains horse girls to debut in the Twinkle Series. Academy does the same for your agents — small, disciplined tools, commands, and hooks that train OpenCode to win by a nose.

Academy registers a focused roster of Umamusume agents:

- **Diana** — default primary coding agent, replacing OpenCode's Build agent
- **Agnes** — Oracle-style technical advisor
- **Cafe** — Librarian-style external researcher
- **Dantsu** — Finder-style codebase search specialist
- **Bellno** — general code reviewer

## Highlights

- One Effect-native entry point: `src/index.ts` exporting `Plugin.define({ id: "academy", effect })`
- Agent registration through `ctx.agent.transform`, with Diana selected by default
- Synchronous transforms: load data before registering, `reload()` when inputs change
- Bun + Effect + TypeScript, with `lint` and `typecheck` gates

## Getting started

Add the plugin to `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["academy", "./plugins/academy"],
}
```

Local paths resolve relative to the config file. See the [plugin docs](https://opencode.ai/v2/docs/build/plugins) to learn more.

### Private GitHub repositories

Academy connects Cafe, Diana, and Bellno to GitHub's official MCP server in read-only mode when `GITHUB_TOKEN` is set. Use a dedicated fine-grained personal access token limited to the required repositories, with read-only Contents, Issues, and Pull requests permissions:

```bash
export GITHUB_TOKEN="github_pat_..."
opencode
```

Keep the token out of `opencode.jsonc` and repository files. Agnes and Dantsu cannot access the GitHub MCP tools; Cafe also has no shell access.

## Develop

```bash
bun install
bun run lint       # oxlint via Ultracite
bun run typecheck  # tsc --noEmit
```

Install git hooks once with `bunx lefthook install`.

## License

MIT
