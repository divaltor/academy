![Academy — Eclipse first, the rest nowhere](.github/assets/academy-banner.png)

# Academy

An OpenCode plugin that turns coding agents into a Tracen Academy roster: specialist teammates trained to research, build, review, and win by a nose.

> "Eclipse first, the rest nowhere."

- **Rudolf** — default primary coding agent, replacing OpenCode's Build agent
- **Cafe** — general-purpose coding subagent sharing Rudolf's guidance, for parallel or context-heavy subtasks
- **Bellno** — code reviewer

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
          "bellno": {
            "disabled": true,
          },
        },
        "use_fff": true,
      },
    },
  ],
}
```

Each agent under `agents` accepts `name`, `color`, `model`, and `disabled`. Colors may be six-digit hex values or OpenCode theme colors. Model references use `provider/model` or `provider/model#variant`. Set `disabled` to `true` to hide an agent and prevent new subagent creation while retaining its definition so existing sessions can continue. Disabling Rudolf restores OpenCode's Build agent as the default.

Without a version suffix OpenCode resolves `latest` on install; run `opencode plugin update` to pull newer releases.

`use_fff` replaces OpenCode's built-in `glob` and `grep` tools globally with [FFF](https://github.com/dmtrKovalenko/fff) for every agent. Enabled by default; set to `false` to keep the built-in tools. This requires a platform supported by `@ff-labs/fff-bun`.

| Agent  | Default model                 |
| ------ | ----------------------------- |
| Rudolf | OpenCode's configured default |
| Cafe   | The calling session's model   |
| Bellno | `openai/gpt-6-astra#medium`   |

> [!WARNING]
>
> An agent's name is also its session ID. Renaming it can prevent existing sessions from continuing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development, pull requests, and publishing releases.

## License

MIT
