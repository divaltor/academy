# Available Tools

27 direct tools + `code_exec` MCP integrations + 10 loadable skills.

## Amp ↔ Academy/OpenCode map

| Amp tool | Academy/OpenCode equivalent | Coverage now |
| --- | --- | --- |
| `bellno_review` | Bellno through `subagent`, or `create_thread` with `agent: "bellno"` | Equivalent review role; Academy has no dedicated wrapper. |
| `code_exec` | OpenCode Code Mode `execute` plus its `search` helper | Equivalent deferred-tool discovery and execution model. |
| `content_search` | `grep` / installed FFF tools | Equivalent local content search; exact ranking and API differ. |
| `create_file` | `write` | Equivalent filesystem write. |
| `create_thread` | Academy `create_thread` | Same asynchronous intent, but creates a local OpenCode session rather than an Amp orb or runner. Supports nested sub-threads, detached independent sessions, and per-thread model override. |
| `edit_file` | `edit` | Equivalent targeted file edit. |
| `file_search` | `glob` / installed FFF tools | Equivalent path discovery; exact ranking and API differ. |
| `find_thread` | Academy `find_thread` | Searches only Academy-created sessions in Academy storage, not every OpenCode session. |
| `finder` | Dantsu through `subagent`, or `create_thread` with `agent: "dantsu"` | Equivalent local code-discovery specialist. |
| `get_thread_status` | Academy `get_thread_status` | Equivalent session metadata/status lookup. |
| `librarian` | Cafe through `subagent`, or `create_thread` with `agent: "cafe"` | Equivalent external repository researcher. |
| `oracle` | Agnes through `subagent`, or `create_thread` with `agent: "agnes"` | Equivalent read-only technical advisor. |
| `Read` | `read` | Equivalent file and media read. |
| `read_thread` | Academy `read_thread` | Returns an OpenCode transcript; optional focused reading uses GLM 5.3 Flash by default. |
| `read_web_page` | `webfetch` | Equivalent URL retrieval; extraction controls differ. |
| `render_mermaid` | No direct equivalent | Mermaid source can be written, but Academy does not register a renderer. |
| `send_thread_message` | Academy `send_thread_message` | Equivalent follow-up delivery with OpenCode `queue` or `steer`. |
| `shell_command` | `shell` | Equivalent command execution. |
| `shell_command_status` | `shell` process handling | Partial: OpenCode has no separate Academy status tool. |
| `shell_command_kill` | `shell` process handling | Partial: OpenCode has no separate Academy kill tool. |
| `skill` | `skill` | Equivalent skill loading. |
| `Task` | Bourbon through `subagent`, or `create_thread` with `agent: "bourbon"` | Equivalent general delegated worker; `create_thread` supplies asynchronous parallelism. |
| `tool_search` | Code Mode `search` | Equivalent lazy tool discovery across built-ins, plugins, and MCP servers. |
| `update_thread` | No direct equivalent | OpenCode session metadata mutation is not exposed by Academy. |
| `view_media` | `read` with an image/media attachment | Partial: no matching objective-driven media-analysis wrapper. |
| `wait_for_threads` | Academy `wait_for_threads` | Equivalent concurrent join over known session IDs. |
| `web_search` | `websearch` | Equivalent web search; provider and result shape differ. |
| — | Academy `interrupt_thread` | Academy-only session interruption; preserves session history. |

Amp's `code_exec` integrations map to OpenCode's Code Mode tool catalog and MCP namespaces rather than to one Academy-specific integration API. Availability depends on the user's configured OpenCode plugins and MCP servers.

## default.bellno_review

Delegate a complete, read-only code review to Bellno. Use for tracked or untracked changes, a commit, a branch or ref, a GitHub pull request, or custom review instructions. Bellno returns actionable findings without editing or implementing fixes.

## default.code_exec

Run JavaScript that calls deferred Amp tools and functions from the user's connected MCP servers. Find functions with tool_search first.

Rules:

- Import functions with bare module specifiers: import { create_issue } from "linear"
- Every imported function returns a Promise; use top-level await.
- Normal calls return the server's structuredContent when present, otherwise parsed JSON text or plain text. If the server reports a tool failure (isError: true), await throws a JavaScript error with the server's error details. If a successful response is missing structuredContent required by outputSchema or does not match that schema, await throws with validation details and a bounded data preview. Use try/catch to handle these errors; uncaught errors fail code_exec.
- Use an imported function's .raw(input) instead to receive the complete MCP response even when the server reports a tool failure or the output schema is violated. Raw calls skip output-schema validation, not transport or authentication errors. When structured data and text are both present, one raw call gives you both: result.structuredContent and result.content (text blocks have type: "text" and a text field; resource links and other blocks are preserved too).
- Each normal or .raw(input) call invokes the tool anew; .raw does not retrieve a previous call's response. If you need both data and text, call .raw once and read both fields. After an error, inspect its preview before considering another call; do not repeat side-effecting operations merely to retrieve raw output.
- Output ONLY via text(value); there is no console and the completion value is discarded. Strings print as-is; arrays and objects render as readable Markdown.
- Use shapeOf(value) to inspect unfamiliar nested results. It returns a recursive schema describing the observed structure.
- tool_search(query) and tool_describe("module.function") also work as globals inside the code, for discovering more functions without another turn.
- This is NOT a general-purpose runtime: no filesystem, network, workspace access, Node APIs, or state between runs. The imported functions are the only capabilities. Use other tools for shell or file work.

Example: import { list_issues, create_issue } from "linear" const open = await list_issues({ state: "open" }) text(open)

## default.content_search

Search workspace file contents via indexed FFF. Prefer to shell grep/rg. Default mode is regex: escape metacharacters or use mode "plain" for literal code like foo(, "fuzzy" for approximate names, "multi" + additionalPatterns for literal OR.

## default.create_file

Create or overwrite a file in the workspace.

Use this tool to create a **new file** that does not yet exist.

For **existing files**, prefer `edit_file` instead—even for extensive changes. Only use `create_file` to overwrite an existing file when you are replacing nearly all of its content AND the file is small (under ~250 lines).

## default.create_thread

Create a new Amp thread and send its first prompt. Threads run in an orb by default. Use a live runner only when the task depends on that runner's local state. Preserve the user's request. Do not add instructions to push, merge, or open a pull request unless the user asked for that. Threads may have different workspaces and Git checkouts. Messages do not transfer files or commits. Name the repository, distinguish the source thread's local `main` from `origin/main`, and use file-transfer tools for unpushed work. Returns immediately. Choose one completion path: ask the new thread to reply, or use wait_for_threads. Do not use both. Never create a new thread only to access a runner and checkout that the current thread is already using. This thread already executes on the user's local client or runner in the working directory shown in the environment. Use the current executor tools for work in that environment; do not call list_runners or create another runner thread merely to access it.

## default.edit_file

Make edits to a text file.

Replaces `old_str` with `new_str` in the given file.

Returns a git-style diff showing the changes made as formatted markdown, along with the line range ([startLine, endLine]) of the changed content. The diff is also shown to the user.

The file specified by `path` MUST exist, and it MUST be an absolute path. If you need to create a new file, use `create_file` instead.

`old_str` MUST exist in the file. Use tools like `Read` to understand the files you are editing before changing them.

`old_str` and `new_str` MUST be different from each other.

Set `replace_all` to true to replace all occurrences of `old_str` in the file. Else, `old_str` MUST be unique within the file or the edit will fail. Additional lines of context can be added to make the string more unique.

If you need to replace the entire contents of a file, use `create_file` instead, since it requires less tokens for the same action (since you won't have to repeat the contents before replacing).

If you see `[REDACTED:_____]` in your inputs and edits fail, Amp's secret redaction may have changed the text; ask the user to manually make the edit.

## default.file_search

Find workspace files by glob when the exact path is unknown. Prefer this indexed FFF search to shell find, ls, or rg --files. Returns at most 100 absolute paths ranked by FFF.

## default.find_thread

Find Amp threads (conversation threads with the agent) using a query DSL.

What this tool finds: searches **Amp threads** (conversations with the agent), NOT git commits. Use when the user asks about threads, conversations, or Amp history.

Query syntax: keywords, `id:thread`, `parent:thread`, `file:path`, `project:name`, `repo:url`, `ref:name`, `pinned:true/false`, `commit:true/false/SHA`, `pr:true/false/number`, `author:name`, `visibility:private/workspace/group/unlisted`, `label:name`, `after:date` / `before:date`, `updated_after:date` / `updated_before:date`, `archived:true/false`, `puck:true`, `snoozed:true/false`. Combine with implicit AND. Case-insensitive. Date formats: ISO dates (`2024-01-15`), relative days (`7d`), weeks (`2w`).

Result fields: `executorType` (sandbox / local-client / virtual), `origin` (thread / puck / slack / x / email / webhook), `created` (epoch ms).

Pagination: ordered by relevance, then most recently updated. Max 100 per page. Use `offset` / `nextOffset` while `hasMore` is true.

When to use: "which thread touched this file", "what thread last changed X", "find threads about X", any Amp thread history question.

When NOT to use: git commits/history/blame (use git commands), WHO person made changes (use git log).

## default.finder

Intelligently search your codebase: Use it for complex, multi-step search tasks where you need to find code based on functionality or concepts rather than exact matches. Anytime you want to chain multiple code searches you should use this tool.

WHEN TO USE THIS TOOL:

- You must locate code by behavior or concept
- You need to run multiple searches in sequence
- You must correlate or look for connection between several areas of the codebase.
- You must filter broad terms ("config", "logger", "cache") by context.
- You need answers to questions such as "Where do we validate JWT authentication headers?" or "Which module handles file-watcher retry logic"

WHEN NOT TO USE THIS TOOL:

- When you know the exact file path - use shell_command with `cat` or `sed -n`
- When looking for specific symbols or exact strings - use shell_command with `rg`
- When you need to create or modify files, or run non-inspection commands

USAGE GUIDELINES:

1. Use one Finder call for one cohesive discovery question.
2. Formulate your query as a precise engineering request.
3. Name concrete artifacts, patterns, or APIs to narrow scope.
4. State explicit success criteria.
5. Never issue vague or exploratory commands.
6. Avoid broad root-level filename scans; scope to a directory.
7. Prefer scoped `rg` searches before repo-wide filename scans.

## default.get_thread_status

Get the agent state, user-managed metadata, and a short recent-message preview for an Amp thread the current user can view, including threads shared by workspace members. agentState.state reports whether the thread is currently working; a non-active state such as idle means the thread finished its last turn and is waiting for a new message, not that it failed or stopped early. Use for a quick progress check or before update_thread when current values matter; update_thread works only when the result has viewerOwnsThread true. Use read_thread for full content, decisions, errors, or history.

## default.librarian

The Librarian is a codebase-understanding subagent for repositories outside the local workspace. It can read public GitHub repositories and connected private GitHub repositories.

Use for: explaining architecture/flows/subsystem design, finding where a feature is implemented externally, comparing patterns across repos, understanding history, reading/diffing remote files, reading GitHub issues, describing dependency/external internals when authoritative source lives outside the workspace.

In an orb, the Librarian may clone a repository into a temp directory and report that path.

Do not use for: local workspace reads, code modifications, simple local lookups, questions unrelated to external repos.

Guidance: name the repo, ask a specific question, include context/goal, expect a thorough shareable answer, return the answer in full rather than summarizing.

## default.oracle

Consult the oracle - a read-only expert advisor powered by a stronger reasoning model for user-requested reviews and unresolved, high-impact judgment calls.

When the user explicitly asks for the oracle, use it for the requested task, including general or final code review. Preserve the requested scope; do not substitute another reviewer or require an unresolved question first.

Without an explicit request, do your own review, planning, and debugging first. Consult the oracle only when that work leaves a specific question whose answer would materially change a high-impact decision:

- Choosing between multiple plausible alternatives when the tradeoff remains unresolved
- Checking a concrete suspected invariant violation or failure sequence that you could not settle
- Debugging a difficult cross-file failure after direct investigation and focused attempts have not resolved it

Without an explicit request, do NOT consult the oracle for:

- Routine self-review, general reassurance, or a second pair of eyes
- Asking whether completed work is correct, safe to test, or ready to ship
- Broad requests to find anything you may have missed
- Work that is merely complex, cross-file, security-sensitive, or high impact without an unresolved question
- Codebase searches (use finder)
- Basic code modifications and when you need to execute code changes

Write the task well: state the unresolved question, what you checked, why the answer changes the decision. Keep it focused. Include context directly. @-mention relevant files. If asking about current changes, say so explicitly. State decision/outcome needed, intended behavior, settled constraints. For follow-up, name prior finding and exact change. Tell it what to ignore.

## default.Read

Read a file or list a directory from the file system. If the path is a directory, it returns a line-numbered list of entries. If the file or directory doesn't exist, an error is returned.

- The path parameter MUST be an absolute path.
- By default, returns the first 500 lines. To read more, call multiple times with different read_ranges.
- Use Grep to find specific content in large files.
- If unsure of path, use glob to look up filenames.
- Contents returned with line numbers. Directories: one entry per line with trailing "/" for subdirectories.
- Can read images (PNG, JPEG, GIF) visually.
- Call in parallel for all files you will want to read. Avoid tiny repeated slices.

## default.read_thread

Read and extract relevant content from another Amp thread by its ampcode.com URL or ID. For message or selection links, pass the full URL unchanged, including query and fragment.

When to use: user pastes/references an Amp thread URL or thread ID, asks to apply approach/plan from a thread, implement plan devised elsewhere, extract info from referenced thread.

When NOT to use: no thread ID mentioned; working within current thread (except message/selection links).

Parameters: threadID (ampcode.com URL ending in T-{uuid} or T-{uuid}), question (clear and specific).

## default.read_web_page

Read the contents of a web page at a given URL. When only url is set, returns contents converted to Markdown. When objective is provided, returns relevant excerpts. Excerpts are relevance-ranked, not reasoning: for verification, error-finding, cross-checking numbers/tables, or auditing, set fullContent:true (or omit objective) to read the whole page. If user asks for latest/recent contents, or page has time-sensitive data, pass forceRefetch:true. Do NOT use for localhost or non-Internet URLs; use curl via shell_command instead.

## default.render_mermaid

Render a Mermaid diagram (flowchart, sequenceDiagram, stateDiagram-v2, classDiagram, erDiagram, xychart-beta) to a rendered image (default), ASCII art, styled SVG, or both text forms. Prefer this over hand-drawn ASCII diagrams. Default returns image block. Request format 'ascii' only when user explicitly wants text; 'svg' only when SVG markup needed for .svg file (Amp chat cannot display embedded SVG, so convert to PNG first). Themes: zinc-light, zinc-dark, tokyo-night, tokyo-night-storm, tokyo-night-light, catppuccin-mocha, catppuccin-latte, nord, nord-light, dracula, github-light, github-dark, solarized-light, solarized-dark, one-dark. Tip: keep loop labels short and put Note lines between messages, not last inside a loop.

## default.send_thread_message

Send a message to another existing Amp thread the current user owns or can contribute to while multiplayer is active. Amp includes an authenticated reply route. Use instead of Amp CLI or automating thread composer. Returns immediately. Ask target thread to reply when result needed. If target not found, check reference or rediscover before sending again; do not guess another ID. Threads may have different workspaces and checkouts. Messages do not transfer files or commits. Name repository, distinguish source local main from origin/main, use file-transfer tools for unpushed work.

## default.shell_command

Runs a shell command.

- Always set workdir. Do not use cd unless necessary. For file edits, use file editing tool.
- workdir must already exist and remain present. Create it in a prior call from an existing parent; do not delete during command.
- Do not invoke Amp CLI or automate web UI to delegate work, launch another agent, or message/continue a thread (includes amp -x, amp --execute, amp threads continue). Use subagent/thread tool instead unless user explicitly requests it.
- When downloading Amp attachment URL, use amp files get instead of curl.
- Can run long-lived/background processes (dev servers, watchers, tests, tails).
- timeout_ms (0-60000, default 10000) controls wait; never stops command. Returns running:true + pid if still running; check with shell_command_status, do not rerun. Avoid pkill -f; stop tracked commands with shell_command_kill; never run kill <pid> through this tool.

## default.shell_command_status

Waits for and gets new output from a background process started by shell_command. Pass PID. Follows existing process; does not restart. Returns output since last read plus running flag. timeout_ms 0-60000 default 10000. Returning running:true is normal for slow/long-lived commands. Only if repeated checks show no new output and process is not expected long-running, stop with shell_command_kill.

## default.shell_command_kill

Stops a hung background process started by shell_command. Only use when process appears hung: repeated status checks returned running:true with no new output, and command is not expected long-running. Never routine just because wait ended. Signals process + children SIGTERM then SIGKILL after ~1s. Waits up to 2s then returns unread output and final status. If running still true, check with shell_command_status; do not rerun.

## default.skill

Load a specialized skill when the task matches one listed. Injects skill instructions and bundled resources. Use when user explicitly asks by name, or task clearly matches description. Usually load once per context window.

Available skills:

- agent-browser: Browser automation CLI. Navigate pages, fill forms, click, screenshot, extract data, test web apps, automate browser tasks. Also Electron apps, Slack, Vercel Sandbox microVMs, AWS Bedrock AgentCore cloud browsers.
- building-plugins: List, build, change, remove, or migrate Amp plugins.
- building-schedules: Set/manage thread schedule for reminders/recurring checks. Load FIRST before schedule tools.
- building-skills: Create/edit/install/move/push/delete any skill. Load FIRST before touching SKILL.md.
- drawing-ascii-diagrams: Text diagrams, timelines, flow, call trees, flamegraphs, XY plots, memory layouts, comparisons.
- explaining: Explain code/changes/architecture/concepts with concise prose and smallest useful visual.
- explaining-code: Explain code/systems/prose/prompts with annotated excerpts, diagrams, pseudocode, call trees, diffs.
- orb-setup: Prepare repo to run in Amp orbs (.agents/setup, .agents/resume, pre-setup).
- setup-tmux: Configure tmux for Amp CLI compatibility.
- writing-commit-messages: Write/review/improve commit messages, Jira descriptions, PRs, changelogs, release notes.

## default.Task

Perform a task (sub-task of user's overall task) using a sub-agent with tools: finder, shell_command, shell_command_status, shell_command_kill, web_search, read_web_page, skill, view_media, and file editing tool. Call blocks until subagent finishes; cannot continue alongside. Only parallelize via multiple calls issued together.

Do work yourself by default. Use Task only when delegation has concrete benefit: 2+ independent workstreams dispatched same turn without shared files/dependencies; one bounded unit massive enough to crowd parent context; user explicitly asks to delegate to agent/subagent.

Do NOT use for: one coherent implementation; serial handoff with no parallelism benefit; routine review/verification of own work; single-file read/search/edit; jobs covered by finder/librarian/oracle; when unsure what changes to make.

Brief worker like a smart colleague with no conversation context: goal, scope, learned/ruled-out context, where to look first, constraints/non-goals, validation, expected return shape (outcome, evidence, files changed/inspected, validation, concerns, next action).

## default.tool_search

Search deferred Amp tools and functions from the user's connected MCP servers, presented as importable JavaScript modules. Results are import statements plus TypeScript signatures. Functions are NOT directly callable — run them via code_exec. Query with capability keywords, exact "module.function" name for full types, or empty to list all modules.

Available modules: amp — Amp Platform tools for account/workspace settings (2 functions): get_settings, update_setting.

## default.update_thread

Update one owned Amp thread. Omit thread to update current thread. Only change fields user explicitly requested; never infer labels, visibility, color, archive state, or snooze. Visibility: private, workspace, unlisted (unlisted only when explicitly asked). Labels incremental: add preserves, remove deletes only named. Archive only when asked or created with archive_when_done. Restore only when asked/confirmed.

## default.view_media

View or analyze a media file. Use to inspect image, PDF, audio, video. Path may be absolute local path, Amp image attachment URL, or public HTTP(S) URL. With no objective for PNG/JPEG/GIF/WebP, returns image as visual input. With objective, or for PDF/audio/video, returns text-only answer. When verifying a change, state expected result for clear verdict.

## default.wait_for_threads

Wait for other Amp threads to finish before returning. Settled = idle, awaiting approval, or error. Use to join child threads from create_thread or send_thread_message ONLY when cannot progress without results; otherwise keep working and have child reply back. Never combine both: do not wait on a thread already asked to reply back. Settled idle may mean finished OR waiting on user input; check with read_thread or get_thread_status before treating as success. On timeout returns current state without failing; call again to keep waiting.

## default.web_search

Search the web for information relevant to a research objective. Use when task depends on up-to-date or precise external information unavailable in context/workspace/repos. Do not use for general background, definitions, examples, incidental terms, or to reinforce already-supported answer. For variants, make one call with 2-3 short queries in search_queries. Do not issue parallel rephrased calls. Inspect results before follow-up; follow-up must target specific unresolved fact. Parallel calls only for multiple independent external questions. Use read_web_page to fetch full URL content.

## code_exec integrations (via tool_search)

### amp.get_settings

Read the user's editable Amp settings: personal settings (Puck instructions, Global AGENTS.md guidance, dictation vocabulary, activity calendar, email and Slack mention notifications, bonus emails, experimental features, project defaults, keyboard shortcuts, custom mode dial) and workspace settings (thread visibility, sharing, member permissions). Returns current value, allowed values, whether editable. Settings not listed (profile, security, billing, training/data usage, integrations) only changeable by user on settings page.

### amp.update_setting

Update one user's Amp setting listed by get_settings. Workspace settings require workspace admin. For risky settings — especially workspace-wide policy/privacy like sharing, visibility, member permissions — MUST first tell user what will change and consequences, wait for explicit agreement, only then call with confirm:true. Never set confirm:true on own initiative.
