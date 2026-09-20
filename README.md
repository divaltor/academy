# Academy

An OpenCode plugin inspired by Tracen Academy from _Umamusume: Pretty Derby_.

> "Eclipse first, the rest nowhere."

Tracen Academy is a boarding school that trains horse girls to debut in the Twinkle Series. Academy does the same for your agents — small, disciplined tools, commands, and hooks that train OpenCode to win by a nose.

Academy is currently in early training.

## Highlights

- One entry point: `src/index.ts` exporting `Plugin.define({ id: "academy", setup })`
- Synchronous transforms: load data before registering, `reload()` when inputs change
- Bun + TypeScript, with `lint` and `typecheck` gates

## Getting started

Add the plugin to `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["academy", "./plugins/academy"],
}
```

Local paths resolve relative to the config file. See the [plugin docs](https://opencode.ai/v2/docs/build/plugins) to learn more.

## Develop

```bash
bun install
bun run lint       # oxlint via Ultracite
bun run typecheck  # tsc --noEmit
```

Install git hooks once with `bunx lefthook install`.

## License

MIT
