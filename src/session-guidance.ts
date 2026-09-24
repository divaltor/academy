import type { Plugin } from "@opencode/plugin/effect";
import { Effect } from "effect";

export namespace SessionGuidance {
  const anthropicRule = [
    "Search and edit rules: never run shell `grep` or `sed`, including piped segments (`| grep`, `| sed`).",
    '- Search: use the `grep` tool first; in shell use only `rg` (`rg -n "pattern" path`, `-F` literal, `-i` case-insensitive, `-v` invert, `-l`/`-c` files/count, `-A`/`-B`/`-C` context, `--replace` for substitutions).',
    "- Edit/view: use Edit (or Write for new files) and Read with offset/limit instead of `sed -i`, `sed -n 'A,Bp'`, or `/pat/d`.",
    "- `rg` is not `grep`-compatible: it recurses, respects .gitignore, and skips hidden files; add `--hidden --no-ignore` only when hidden or ignored files are explicitly required.",
  ].join("\n");

  export const register = Effect.fn("SessionGuidance.register")(
    function* register(ctx: Plugin.Context) {
      yield* ctx.session.hook(
        "context",
        (input) =>
          Effect.sync(() => {
            input.system.push({ text: anthropicRule, type: "text" as const });
          }),
        { providerID: "anthropic" }
      );
    }
  );
}
