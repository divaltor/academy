# Academy

An OpenCode plugin that turns coding agents into a Tracen Academy roster: specialist teammates trained to research, build, review, and win by a nose.

> "Eclipse first, the rest nowhere."

Inspired by _Umamusume: Pretty Derby_, Academy gives OpenCode a focused team of agents with distinct roles, personalities, and permissions.

Academy registers a focused roster of Umamusume agents:

- **Rudolf** — default primary coding agent, replacing OpenCode's Build agent
- **Bourbon** — general-purpose implementation and validation subagent
- **Agnes** — Oracle-style technical advisor
- **Cafe** — Librarian-style external researcher
- **Dantsu** — Finder-style codebase search specialist
- **Bellno** — general code reviewer

## Configuration

Add Academy to `opencode.jsonc`. Each agent can override its display name and color; omit an agent or field to keep the Academy default:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "@divaltor/academy",
      "options": {
        "rudolf": {
          "name": "Emperor",
          "color": "#8994B8",
        },
      },
    },
  ],
}
```

Colors accept six-digit hex values or OpenCode theme colors: `primary`, `secondary`, `accent`, `success`, `warning`, `error`, and `info`. You can alternatively set a color with OpenCode's native `agents.<id>.color` configuration. Custom names also update persona references. Agent IDs are `rudolf`, `bourbon`, `agnes`, `cafe`, `dantsu`, and `bellno`. The previous `agentNames` option and `diana` plugin option remain supported for compatibility. See the [plugin docs](https://opencode.ai/v2/docs/build/plugins) to learn more.

### Private GitHub repositories

Academy connects Cafe, Rudolf, and Bellno to GitHub's official MCP server in read-only mode when `GITHUB_TOKEN` is set. Use a dedicated fine-grained personal access token limited to the required repositories, with read-only Contents, Issues, and Pull requests permissions:

```bash
export GITHUB_TOKEN="github_pat_..."
opencode
```

Keep the token out of `opencode.jsonc` and repository files. Agnes and Dantsu cannot access the GitHub MCP tools; Cafe also has no shell access.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, pull requests, and publishing releases.

## License

MIT
