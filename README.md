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

Add Academy to `opencode.jsonc`. All options are optional. Omit the version to track `latest`; append `@x.y.z` to pin a release:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "@divaltor/academy",
      "options": {
        "agents": {
          "rudolf": {
            "name": "Emperor",
            "color": "#8994B8",
            "model": "opencode/claude-opus-5#max",
          },
        },
        "experimental": {
          "communication": {
            "enabled": true,
            "thread_summary": "opencode-go/glm-5.3-flash",
          },
        },
        "use_fff": true,
      },
    },
  ],
}
```

Each agent under `agents` accepts `name`, `color`, and `model`. Colors may be six-digit hex values or OpenCode theme colors. Model references use `provider/model` or `provider/model#variant`.

Without a version suffix OpenCode resolves `latest` on install; run `opencode plugin update` to pull newer releases.

`use_fff` replaces OpenCode's built-in `glob` and `grep` tools globally with [FFF](https://github.com/dmtrKovalenko/fff) for every agent. Enabled by default; set to `false` to keep the built-in tools. This requires a platform supported by `@ff-labs/fff-bun`.

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

Session tools are experimental and off by default; set `experimental.communication.enabled` to `true` to enable them. They are available under Code Mode's `academy` namespace. Only the root primary session can create threads; omit `agent` for a general coding session.

> [!NOTE]
>
> `read_thread` with a question summarizes via the `experimental.communication.thread_summary` model, or the calling session's model when unset. Models on `opencode-go` cannot use stateless generation (the provider requires session routing headers that only a session request carries), so Academy answers through a dedicated `Academy summary <model>` session via transient `session.generate` — no transcript writes, but the session stays visible in the session list because the plugin API exposes neither archive nor delete for it.

> [!NOTE]
>
> `find_thread` currently searches Academy-created sessions only and is part of the experimental communication tools. OpenCode's HTTP client can list persisted sessions, but the plugin context does not yet expose `ctx.session.list`, so Academy cannot safely discover sessions created before the plugin was installed. We are waiting for upstream support rather than reading OpenCode's private SQLite database or connecting back to the server through a separate client.
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
