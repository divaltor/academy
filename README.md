![Academy — Eclipse first, the rest nowhere](.github/assets/academy-banner.png)

# Academy

An OpenCode plugin that turns coding agents into a Tracen Academy roster: specialist teammates trained to research, build, review, and win by a nose.

> "Eclipse first, the rest nowhere."

- **Rudolf** — default primary coding agent, replacing OpenCode's Build agent
- **Agnes** — Oracle-style technical advisor
- **Cafe** — Librarian-style external researcher
- **Dantsu** — Finder-style codebase search specialist
- **Bellno** — general code reviewer

## Configuration

Add Academy to `opencode.jsonc`. All options are optional:

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
          "model": "anthropic/claude-opus-4-1#max",
        },
        "communication": {
          "thread_summary": "opencode-go/glm-5.3-flash",
        },
        "use_fff": true,
      },
    },
  ],
}
```

Each agent accepts `name`, `color`, and `model`. Colors may be six-digit hex values or OpenCode theme colors. Model references use `provider/model` or `provider/model#variant`.

Set `use_fff` to `true` to replace OpenCode's built-in `glob` and `grep` tools globally with [FFF](https://github.com/d-kimuson/fff.nvim) for every agent. This requires a platform supported by `@ff-labs/fff-bun`.

| Agent  | Default model                 |
| ------ | ----------------------------- |
| Rudolf | OpenCode's configured default |
| Agnes  | `openai/gpt-6-astra#xhigh`    |
| Cafe   | `openai/gpt-5.6-sol#none`     |
| Dantsu | `openai/gpt-5.6-terra#low`    |
| Bellno | `openai/gpt-5.6-sol#high`     |

> [!WARNING]
>
> An agent's name is also its session ID. Renaming it can prevent existing sessions from continuing.

Session tools are available under Code Mode's `academy` namespace. Only the root primary session can create threads; omit `agent` for a general coding session.

> [!NOTE]
>
> `find_thread` currently searches Academy-created sessions only. OpenCode's HTTP client can list persisted sessions, but the plugin context does not yet expose `ctx.session.list`, so Academy cannot safely discover sessions created before the plugin was installed. We are waiting for upstream support rather than reading OpenCode's private SQLite database or connecting back to the server through a separate client.
>
> Tracking: [#43517](https://github.com/anomalyco/opencode/issues/43517), [#44155](https://github.com/anomalyco/opencode/issues/44155), [#43556](https://github.com/anomalyco/opencode/pull/43556), and [#46690](https://github.com/anomalyco/opencode/pull/46690).

### Private GitHub access

Set `GITHUB_TOKEN` to give Rudolf, Cafe, and Bellno read-only access to private repositories. Use a fine-grained token with read-only Contents, Issues, and Pull requests permissions:

```bash
export GITHUB_TOKEN="github_pat_..."
opencode
```

Keep the token out of `opencode.jsonc` and repository files.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, pull requests, and publishing releases.

## License

MIT
