import bellnoSystem from "./agents/bellno.txt" with { type: "text" };
import codingSystem from "./agents/coding.txt" with { type: "text" };

interface Permission {
  readonly action: string;
  readonly resource: string;
  readonly effect: "allow" | "ask" | "deny";
}

const agentIds = ["bellno", "cafe", "rudolf"] as const;

interface AcademyAgent {
  readonly id: (typeof agentIds)[number];
  readonly name: string;
  readonly description: string;
  readonly mode: "primary" | "subagent";
  readonly color: string;
  readonly system: string;
  readonly model?: string;
  readonly permissions: readonly Permission[];
}

const defaultPermissions: readonly Permission[] = [
  { action: "*", effect: "allow", resource: "*" },
];

const codingPermissions: readonly Permission[] = [
  ...defaultPermissions,
  { action: "todowrite", effect: "deny", resource: "*" },
  { action: "websearch", effect: "allow", resource: "*" },
  { action: "webfetch", effect: "allow", resource: "*" },
  { action: "grep", effect: "allow", resource: "*" },
  { action: "glob", effect: "allow", resource: "*" },
  { action: "subagent", effect: "deny", resource: "*" },
];

export const agents: readonly AcademyAgent[] = [
  {
    color: "#6678A4",
    description:
      "Primary agent for scoped implementation, research, and delegation.",
    id: "rudolf",
    mode: "primary",
    name: "Rudolf",
    permissions: [
      ...codingPermissions,
      { action: "question", effect: "allow", resource: "*" },
      { action: "subagent", effect: "allow", resource: "cafe" },
      { action: "subagent", effect: "allow", resource: "bellno" },
    ],
    system: `You are **Rudolf**, the primary coding agent. Work directly by default and deliver correct, scoped results.\n\n${codingSystem}`,
  },
  {
    color: "#8FA876",
    description:
      "General-purpose coding subagent for independent research, discovery, and implementation. Run several in parallel for non-overlapping work.",
    id: "cafe",
    mode: "subagent",
    name: "Cafe",
    permissions: [
      ...codingPermissions,
      { action: "question", effect: "deny", resource: "*" },
    ],
    system: `You are **Cafe**, a coding subagent working on a task delegated by another agent. Complete it directly and return a result the caller can verify.\n\n${codingSystem}`,
  },
  {
    color: "#d99aae",
    description:
      "Read-only general reviewer for complete, systematic reviews of diffs, commits, branches, and pull requests.",
    id: "bellno",
    mode: "subagent",
    model: "openai/gpt-6-astra#medium",
    name: "Bellno",
    permissions: [
      ...defaultPermissions,
      { action: "edit", effect: "deny", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "deny", resource: "*" },
      { action: "webfetch", effect: "deny", resource: "*" },
    ],
    system: bellnoSystem,
  },
];
