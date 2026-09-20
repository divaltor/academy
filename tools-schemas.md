# Tool Schemas

Source of truth: workspace tool definitions plus `tool_search` for MCP integrations.

## default.bellno_review

Delegate a complete, read-only code review to Bellno.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["request"],
  "properties": {
    "request": {
      "type": "string",
      "description": "Review scope or instructions, such as “current changes”, a commit SHA, “branch main”, “pr 123”, a GitHub PR URL, or a focused review question."
    }
  }
}
```

## default.code_exec

Run JavaScript that calls deferred MCP functions. Bare imports, top-level await, output via `text()`.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["code"],
  "properties": {
    "code": {
      "type": "string",
      "description": "JavaScript source. Bare module imports, top-level await, output via text()."
    }
  }
}
```

## default.content_search

Search workspace file contents via indexed FFF.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["pattern"],
  "properties": {
    "pattern": {
      "type": "string",
      "description": "Text to find. In default regex mode escape ( ) [ ] { } . * + ? ^ $ | \\ or use mode \"plain\"."
    },
    "path": {
      "type": "string",
      "description": "Workspace-relative file or directory like 'apps/web'; omit or use '.' for the workspace root. Never pass '/' for the workspace root."
    },
    "include": {
      "type": "string",
      "description": "Optional file glob such as '*.{ts,tsx}'."
    },
    "mode": {
      "type": "string",
      "enum": ["regex", "plain", "fuzzy", "multi"],
      "description": "\"regex\" (default) | \"plain\" (literal, use for code with brackets) | \"fuzzy\" | \"multi\" (literal OR)."
    },
    "additionalPatterns": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "description": "Literal alternatives used only with mode 'multi'."
    }
  }
}
```

## default.create_file

Create or overwrite a file. Absolute path. Prefer `edit_file` for existing files.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["path", "content"],
  "properties": {
    "path": {
      "type": "string",
      "description": "The absolute path of the file to be created (must be absolute, not relative). If the file exists, it will be overwritten. ALWAYS generate this argument first."
    },
    "content": {
      "type": "string",
      "description": "The content for the file."
    }
  }
}
```

## default.create_thread

Create a new Amp thread and send its first prompt. Orb by default.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["prompt", "intent"],
  "properties": {
    "prompt": {
      "type": "string",
      "description": "The initial prompt. Complete, directly owned task with goal, scope, verification, constraints."
    },
    "intent": {
      "type": "string",
      "enum": [
        "delegation",
        "environment-access",
        "independent-review",
        "other",
        "parallel-work"
      ],
      "description": "Why this must be a separate thread."
    },
    "executor": {
      "type": "string",
      "enum": ["orb", "runner"],
      "description": "Where the thread executes. Defaults to orb."
    },
    "runner_id": {
      "type": "string",
      "description": "Runner ID from list_runners. Required when executor is \"runner\"."
    },
    "working_directory": {
      "type": "string",
      "description": "Absolute path on the runner. Only valid when executor is \"runner\"."
    },
    "project": {
      "type": "string",
      "description": "Amp namespace/name project ref, repo, URL, or \"no-project\". Defaults to current project for orbs."
    },
    "agent_mode": {
      "type": "string",
      "description": "Optional agent mode key. Omit to inherit current mode. Never set ultra unless explicitly requested."
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 256,
      "description": "Optional concise title for the new thread."
    },
    "labels": {
      "type": "array",
      "description": "Optional labels explicitly specified by the user. Maximum 20 labels."
    },
    "orb_size": {
      "type": "string",
      "enum": [
        "a1.tiny",
        "a1.small",
        "a1.medium",
        "a1.large",
        "a1.xxlarge",
        "a1.3xlarge"
      ],
      "description": "Orb size override. Usually omit."
    },
    "features": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Thread features. Omit to inherit; empty array clears."
    },
    "image_paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Exact attached_image paths from current conversation to forward."
    },
    "multiplayer_ttl_seconds": {
      "type": "number",
      "minimum": 300,
      "maximum": 604800,
      "description": "Multiplayer duration in seconds, 5 minutes through 7 days. Orb workspace threads only."
    },
    "archive_when_done": {
      "type": "boolean",
      "description": "Archive itself once complete. Only for disposable one-off tasks."
    },
    "skip_setup": {
      "type": "boolean",
      "description": "Orb-only diagnostic: skip .agents/setup, start from base template."
    }
  }
}
```

## default.edit_file

Replace `old_str` with `new_str`. Path must exist and be absolute.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["path", "old_str", "new_str"],
  "properties": {
    "path": {
      "type": "string",
      "description": "The absolute path to the file (MUST be absolute, not relative). File must exist."
    },
    "old_str": {
      "type": "string",
      "description": "Text to search for. Must match exactly."
    },
    "new_str": {
      "type": "string",
      "description": "Text to replace old_str with."
    },
    "replace_all": {
      "type": "boolean",
      "default": false,
      "description": "Set to true to replace all matches of old_str."
    }
  }
}
```

## default.file_search

Find workspace files by glob. Max 100 paths, FFF-ranked.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["pattern"],
  "properties": {
    "pattern": {
      "type": "string",
      "minLength": 1,
      "description": "Glob such as '**/*.ts' or '**/package.json'."
    },
    "path": {
      "type": "string",
      "description": "Workspace-relative directory like 'apps/web'; omit or use '.' for root. Never '/'."
    }
  }
}
```

## default.find_thread

Find Amp threads (conversations), not git commits. DSL query.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "DSL: keywords, id:, parent:, file:, project:, repo:, ref:, pinned:, commit:, pr:, author:, visibility:, label:, after:/before:, updated_after:/updated_before:, archived:, puck:, snoozed:. Implicit AND."
    },
    "limit": {
      "type": "number",
      "description": "Maximum threads to return. Defaults to 20, maximum 100."
    },
    "offset": {
      "type": "number",
      "description": "Number of matching threads to skip. Pass nextOffset for next page."
    }
  }
}
```

## default.finder

Conceptual multi-step codebase search. One cohesive discovery question per call.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "Precise engineering request with artifacts, patterns, APIs, and success criteria."
    }
  }
}
```

## default.get_thread_status

Agent state, metadata, recent-message preview for a viewable Amp thread.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["thread"],
  "properties": {
    "thread": {
      "type": "string",
      "description": "Thread URL or ID."
    }
  }
}
```

## default.librarian

Codebase understanding for repos outside local workspace, incl. public and connected private GitHub repos.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "Specific question about the codebase, feature, or codepath."
    },
    "context": {
      "type": "string",
      "description": "Optional context about goal or background."
    }
  }
}
```

## default.oracle

Read-only expert advisor for user-requested reviews and unresolved high-impact judgment calls.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["task"],
  "properties": {
    "task": {
      "type": "string",
      "description": "Focused review/decision/debugging task with intended outcome, constraints, @-mentioned files, scope."
    }
  }
}
```

## default.Read

Read a file or list a directory. Absolute path. Default first 500 lines.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["path"],
  "properties": {
    "path": {
      "type": "string",
      "description": "The absolute path to the file or directory (MUST be absolute, not relative)."
    },
    "read_range": {
      "type": "array",
      "minItems": 2,
      "maxItems": 2,
      "description": "Start and end line numbers, 1-indexed. Defaults to [1, 1000]."
    }
  }
}
```

## default.read_thread

Extract content from another Amp thread by URL or ID.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["threadID", "question"],
  "properties": {
    "threadID": {
      "type": "string",
      "description": "Amp thread URL or T-{uuid} ID. Preserve full URL for message/selection links."
    },
    "question": {
      "type": "string",
      "description": "Clear specific question to ask the thread."
    }
  }
}
```

## default.read_web_page

Read a web page as Markdown. No localhost. Use `forceRefetch` for fresh/time-sensitive data, `fullContent:true` for verification.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["url"],
  "properties": {
    "url": {
      "type": "string",
      "description": "The URL of the web page to read"
    },
    "objective": {
      "type": "string",
      "description": "Self-contained description of what is sought, incl. task context."
    },
    "searchQueries": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional 2-3 short keyword queries (3-6 words each) to emphasize terms."
    },
    "forceRefetch": {
      "type": "boolean",
      "description": "Force live fetch instead of cached version."
    },
    "fullContent": {
      "type": "boolean",
      "description": "Return full page as Markdown even when objective is set."
    }
  }
}
```

## default.render_mermaid

Render Mermaid (flowchart, sequence, state, class, er, xychart-beta) to image, ascii, svg, or both.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["diagram"],
  "properties": {
    "diagram": {
      "type": "string",
      "description": "Mermaid diagram source code"
    },
    "format": {
      "type": "string",
      "default": "image",
      "enum": ["image", "ascii", "svg", "both"],
      "description": "Output format."
    },
    "theme": {
      "type": "string",
      "default": "github-light",
      "enum": [
        "zinc-light",
        "zinc-dark",
        "tokyo-night",
        "tokyo-night-storm",
        "tokyo-night-light",
        "catppuccin-mocha",
        "catppuccin-latte",
        "nord",
        "nord-light",
        "dracula",
        "github-light",
        "github-dark",
        "solarized-light",
        "solarized-dark",
        "one-dark"
      ],
      "description": "Built-in theme name."
    },
    "useAscii": {
      "type": "boolean",
      "default": false,
      "description": "Strict 7-bit ASCII instead of Unicode box drawing."
    }
  }
}
```

## default.send_thread_message

Send a message to another existing Amp thread. Returns immediately.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["thread", "message"],
  "properties": {
    "thread": {
      "type": "string",
      "description": "Target thread URL or ID, copied exactly. Do not reconstruct from memory."
    },
    "message": {
      "type": "string",
      "description": "The actual message to deliver, never a probe or placeholder."
    },
    "image_paths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Exact attached_image path values already attached in current conversation."
    },
    "multiplayer_ttl_seconds": {
      "type": "number",
      "minimum": 300,
      "maximum": 604800,
      "description": "Owner-only. Start/extend multiplayer on target orb thread."
    }
  }
}
```

## default.shell_command

Run a shell command. Set `workdir`. Long-running returns `running:true` + `pid`.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["command"],
  "properties": {
    "command": { "type": "string", "description": "Shell command to execute." },
    "workdir": {
      "type": "string",
      "description": "Optional working directory; defaults to turn cwd. Must already exist."
    },
    "timeout_ms": {
      "type": "number",
      "description": "Milliseconds to wait, 0-60000. Defaults to 10000. Never stops the command."
    }
  }
}
```

## default.shell_command_status

Poll a background process started by `shell_command`.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["pid"],
  "properties": {
    "pid": {
      "type": "number",
      "description": "PID returned by shell_command."
    },
    "timeout_ms": {
      "type": "number",
      "description": "Milliseconds to wait for new output/completion, 0-60000. Defaults to 10000."
    }
  }
}
```

## default.shell_command_kill

Stop a hung background process. SIGTERM then SIGKILL. Not routine.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["pid"],
  "properties": {
    "pid": {
      "type": "number",
      "description": "PID returned by shell_command."
    }
  }
}
```

## default.skill

Load a specialized skill. Usually once per context window.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the skill to load."
    },
    "arguments": {
      "type": "string",
      "description": "Optional arguments to pass to the skill."
    }
  }
}
```

Available skills: `agent-browser`, `building-plugins`, `building-schedules`, `building-skills`, `drawing-ascii-diagrams`, `explaining`, `explaining-code`, `orb-setup`, `setup-tmux`, `writing-commit-messages`.

## default.Task

Delegate a bounded sub-task to a sub-agent. Blocks until done.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["prompt", "description"],
  "properties": {
    "prompt": {
      "type": "string",
      "description": "Task for the agent: goal, scope, context, files/evidence first, constraints, non-goals, validation, expected return shape."
    },
    "description": {
      "type": "string",
      "description": "Very short display description of the task."
    }
  }
}
```

Sub-agent tools: finder, shell_command, shell_command_status, shell_command_kill, web_search, read_web_page, skill, view_media, file editing.

## default.tool_search

Search deferred MCP functions. Results are importable JS modules, callable only via `code_exec`.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "Capability keywords, exact \"module.function\" name, or empty to list all modules."
    }
  }
}
```

## default.update_thread

Update one owned thread. Incremental labels. Only change explicitly requested fields.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": [],
  "properties": {
    "thread": {
      "type": "string",
      "description": "Target thread URL or ID. Omit to target current thread."
    },
    "title": { "type": "string", "description": "New non-empty thread title." },
    "visibility": {
      "type": "string",
      "enum": ["private", "workspace", "unlisted"],
      "description": "New visibility. Unlisted only when explicitly asked."
    },
    "color": {
      "type": "string",
      "enum": [
        "blue",
        "purple",
        "pink",
        "red",
        "orange",
        "yellow",
        "green",
        "cyan",
        null
      ],
      "description": "Thread color. Null clears."
    },
    "labels": {
      "type": "object",
      "properties": {
        "add": { "type": "array", "items": { "type": "string" } },
        "remove": { "type": "array", "items": { "type": "string" } }
      },
      "description": "Incremental label changes."
    },
    "pinned": {
      "type": "boolean",
      "description": "True to pin, false to unpin."
    },
    "archived": {
      "type": "boolean",
      "description": "True to archive, false to restore."
    },
    "snooze": {
      "description": "Snooze preset, off, or {\"until\": ISO-8601 future date-time}.",
      "anyOf": [
        {
          "enum": [
            "one_hour",
            "one_day",
            "one_week",
            "next_message",
            "indefinite",
            "off"
          ]
        },
        {
          "type": "object",
          "required": ["until"],
          "properties": { "until": { "type": "string" } }
        }
      ]
    }
  }
}
```

## default.view_media

View image/PDF/audio/video. Absolute path, attachment URL, or public HTTPS URL.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["path"],
  "properties": {
    "path": {
      "type": "string",
      "description": "Absolute local path, Amp image attachment URL, or public HTTP(S) media URL."
    },
    "objective": {
      "type": "string",
      "description": "Optional objective to answer. With objective (or non-image) returns text-only. State expected result for verification."
    },
    "resolution": {
      "type": "string",
      "enum": ["high", "original"],
      "description": "Image resolution preference."
    }
  }
}
```

## default.wait_for_threads

Join on child threads. Settled = idle, awaiting approval, or error. Never combine with reply-back.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["threads"],
  "properties": {
    "threads": {
      "type": "array",
      "maxItems": 10,
      "items": { "type": "string" },
      "description": "Array of thread URLs or IDs, max 10."
    },
    "timeout_seconds": {
      "type": "number",
      "default": 300,
      "minimum": 1,
      "maximum": 600,
      "description": "Maximum seconds to wait."
    },
    "poll_interval_seconds": {
      "type": "number",
      "default": 15,
      "minimum": 5,
      "description": "Seconds between status checks, at least 5."
    }
  }
}
```

## default.web_search

Web search for up-to-date external facts. One call with 2-3 queries; inspect before follow-up.

```json
{
  "type": "object",
  "additionalProperties": true,
  "required": ["objective"],
  "properties": {
    "objective": {
      "type": "string",
      "description": "Natural-language research goal, incl. source/freshness guidance."
    },
    "search_queries": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional 2-3 short keyword queries."
    },
    "max_results": {
      "type": "number",
      "description": "Maximum results to return (default 5)."
    }
  }
}
```

## MCP integrations via code_exec

### amp.get_settings

```typescript
import { get_settings } from "amp";
export function get_settings(input?: {
  scope?: "user" | "workspace" | "all";
  keys?: string[];
}): Promise<unknown>;
```

Reads editable Amp settings: personal (Puck instructions, Global AGENTS.md, dictation vocabulary, activity calendar, mention notifications, bonus emails, experimental features, project defaults, keyboard shortcuts, mode dial) and workspace (visibility, sharing, member permissions). Returns value, allowed values, editability.

### amp.update_setting

```typescript
import { update_setting } from "amp";
export function update_setting(input: {
  key:
    | "puck_instructions"
    | "global_agent_guidance"
    | "dictation_vocabulary"
    | "activity_calendar_enabled"
    | "mention_email_opt_in"
    | "mention_slack_opt_in"
    | "message_send_behavior"
    | "dictation_enabled"
    | "thread_color_mode"
    | "keyboard_shortcuts"
    | "bonus_email_opt_in"
    | "dial_modes"
    | "experimental_feature.ai-routers"
    | "experimental_feature.claude-sub"
    | "experimental_feature.desktop-fun-games"
    | "experimental_feature.external-agent"
    | "experimental_feature.puck-in-threads"
    | "experimental_feature.mcp-apps"
    | "experimental_feature.mcp-server"
    | "experimental_feature.puck-conversations"
    | "experimental_feature.thread-recap"
    | "experimental_feature.short-sidebar-titles"
    | "experimental_feature.exhausted-connection-switch"
    | "experimental_feature.synced-drafts"
    | "project_defaults.changes_workflow"
    | "project_defaults.custom_ship_prompt"
    | "project_defaults.orb_commit_author"
    | "default_thread_visibility"
    | "allow_groups_default_to_group_visibility"
    | "hide_thread_costs_while_working"
    | "allow_members_view_member_list"
    | "allow_members_invite"
    | "allow_members_personal_model_provider_keys"
    | "disable_public_profiles"
    | "install_page_markdown"
    | "disable_public_sharing"
    | "disable_sandbox_thread_creation";
  value: boolean | string | Record<string, string | unknown[] | null> | null;
  workspace?: string;
  confirm?: boolean;
}): Promise<unknown>;
```

Risky workspace policy/privacy changes require prior explicit user agreement with `confirm: true`.
