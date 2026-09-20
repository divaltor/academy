# Academy

An OpenCode plugin that turns coding agents into a Tracen Academy roster: specialist teammates trained to research, build, review, and win by a nose.

> "Eclipse first, the rest nowhere."

Inspired by _Umamusume: Pretty Derby_, Academy gives OpenCode a focused team of agents with distinct roles, personalities, and permissions.

Academy registers a focused roster of Umamusume agents:

- **Diana** — default primary coding agent, replacing OpenCode's Build agent
- **Agnes** — Oracle-style technical advisor
- **Cafe** — Librarian-style external researcher
- **Dantsu** — Finder-style codebase search specialist
- **Bellno** — general code reviewer

## Configuration

Add Academy to `opencode.jsonc`. Agent names are optional; omit `agentNames` or any entry to keep the Umamusume defaults:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "@divaltor/academy",
      "options": {
        "agentNames": {
          "diana": "Diana",
          "agnes": "Agnes",
          "cafe": "Cafe",
          "dantsu": "Dantsu",
          "bellno": "Bellno",
        },
      },
    },
  ],
}
```

Custom names change the agents' displayed names and persona references. Their stable IDs (`diana`, `agnes`, `cafe`, `dantsu`, and `bellno`) remain unchanged for permissions and invocation. Local paths resolve relative to the config file. See the [plugin docs](https://opencode.ai/v2/docs/build/plugins) to learn more.

### Private GitHub repositories

Academy connects Cafe, Diana, and Bellno to GitHub's official MCP server in read-only mode when `GITHUB_TOKEN` is set. Use a dedicated fine-grained personal access token limited to the required repositories, with read-only Contents, Issues, and Pull requests permissions:

```bash
export GITHUB_TOKEN="github_pat_..."
opencode
```

Keep the token out of `opencode.jsonc` and repository files. Agnes and Dantsu cannot access the GitHub MCP tools; Cafe also has no shell access.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, pull requests, and publishing releases.

## License

MIT
