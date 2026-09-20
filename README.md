![Academy — Eclipse first, the rest nowhere](.github/assets/academy-banner.png)

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

Colors accept six-digit hex values or OpenCode theme colors: `primary`, `secondary`, `accent`, `success`, `warning`, `error`, and `info`. You can alternatively set a color with OpenCode's native `agents.<id>.color` configuration. Custom names also become the agents' IDs and update persona and permission references. Without custom names, agent IDs are `rudolf`, `bourbon`, `agnes`, `cafe`, `dantsu`, and `bellno`.

> [!WARNING] Choose custom names when first setting up Academy and avoid changing them later. OpenCode stores the selected agent ID in each session, so renaming an agent removes the ID referenced by existing sessions and can prevent those sessions from continuing.

Academy also registers session communication tools for creating, finding, reading, messaging, waiting for, and interrupting independent OpenCode sessions. `read_thread` can answer a focused question about another session with a small reader model. It defaults to OpenCode Zen's GLM 5.3 Flash and can be changed in plugin options:

```jsonc
{
  "plugins": [
    {
      "package": "@divaltor/academy",
      "options": {
        "communication": {
          "readerModel": "opencode/glm-5.3-flash",
        },
      },
    },
  ],
}
```

`find_thread` searches Academy's persistent registry, so sessions created by these tools remain discoverable after the creating session or plugin scope ends. OpenCode currently does not let plugins enumerate arbitrary sessions, so sessions created outside Academy are not included.

See the [plugin docs](https://opencode.ai/v2/docs/build/plugins) to learn more.

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
