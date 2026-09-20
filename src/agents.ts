import agnesSystem from "./agents/agnes.txt" with { type: "text" };
import bellnoSystem from "./agents/bellno.txt" with { type: "text" };
import cafeSystem from "./agents/cafe.txt" with { type: "text" };
import dantsuSystem from "./agents/dantsu.txt" with { type: "text" };
import rudolfSystem from "./agents/rudolf.txt" with { type: "text" };

interface Permission {
  readonly action: string;
  readonly resource: string;
  readonly effect: "allow" | "ask" | "deny";
}

const agentIds = ["agnes", "bellno", "cafe", "dantsu", "rudolf"] as const;

interface AcademyAgent {
  readonly id: (typeof agentIds)[number];
  readonly name: string;
  readonly description: string;
  readonly mode: "primary" | "subagent";
  readonly color: string;
  readonly system: string;
  readonly model?: {
    readonly providerID: string;
    readonly id: string;
    readonly variant: string;
  };
  readonly permissions: readonly Permission[];
}

const defaultPermissions: readonly Permission[] = [
  { action: "*", effect: "allow", resource: "*" },
];

const specialistSessionPermissions: readonly Permission[] = [
  { action: "academy_session_create", effect: "deny", resource: "*" },
  { action: "academy_session_control", effect: "deny", resource: "*" },
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
      ...defaultPermissions,
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "allow", resource: "*" },
      { action: "webfetch", effect: "allow", resource: "*" },
      { action: "grep", effect: "allow", resource: "*" },
      { action: "glob", effect: "allow", resource: "*" },
      { action: "question", effect: "allow", resource: "*" },
      { action: "academy_github_*", effect: "allow", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "subagent", effect: "allow", resource: "agnes" },
      { action: "subagent", effect: "allow", resource: "cafe" },
      { action: "subagent", effect: "allow", resource: "dantsu" },
      { action: "subagent", effect: "allow", resource: "bellno" },
    ],
    system: rudolfSystem,
  },
  {
    color: "#db696b",
    description:
      "Oracle-style read-only advisor for architecture decisions, debugging, alternatives, and high-impact plans.",
    id: "agnes",
    mode: "subagent",
    model: { id: "gpt-6-astra", providerID: "openai", variant: "xhigh" },
    name: "Agnes",
    permissions: [
      ...defaultPermissions,
      ...specialistSessionPermissions,
      { action: "edit", effect: "deny", resource: "*" },
      { action: "shell", effect: "deny", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "subagent", effect: "allow", resource: "dantsu" },
      { action: "subagent", effect: "allow", resource: "cafe" },
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "deny", resource: "*" },
      { action: "webfetch", effect: "deny", resource: "*" },
      { action: "grep", effect: "allow", resource: "*" },
      { action: "glob", effect: "allow", resource: "*" },
      { action: "academy_github_*", effect: "deny", resource: "*" },
    ],
    system: agnesSystem,
  },
  {
    color: "#484951",
    description:
      "Librarian-style external research for official docs, API behavior, dependency internals, and remote repositories.",
    id: "cafe",
    mode: "subagent",
    model: { id: "gpt-5.6-sol", providerID: "openai", variant: "none" },
    name: "Cafe",
    permissions: [
      ...defaultPermissions,
      ...specialistSessionPermissions,
      { action: "edit", effect: "deny", resource: "*" },
      { action: "shell", effect: "deny", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "allow", resource: "*" },
      { action: "webfetch", effect: "allow", resource: "*" },
      { action: "grep", effect: "allow", resource: "*" },
      { action: "glob", effect: "allow", resource: "*" },
      { action: "academy_github_*", effect: "allow", resource: "*" },
    ],
    system: cafeSystem,
  },
  {
    color: "#eb6f92",
    description:
      "Finder-style local codebase discovery by behavior, ownership boundary, and call or data flow.",
    id: "dantsu",
    mode: "subagent",
    model: { id: "gpt-5.6-terra", providerID: "openai", variant: "low" },
    name: "Dantsu",
    permissions: [
      ...defaultPermissions,
      ...specialistSessionPermissions,
      { action: "edit", effect: "deny", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "deny", resource: "*" },
      { action: "webfetch", effect: "deny", resource: "*" },
      { action: "grep", effect: "allow", resource: "*" },
      { action: "glob", effect: "allow", resource: "*" },
      { action: "academy_github_*", effect: "deny", resource: "*" },
    ],
    system: dantsuSystem,
  },
  {
    color: "#d99aae",
    description:
      "Read-only general reviewer for complete, systematic reviews of diffs, commits, branches, and pull requests.",
    id: "bellno",
    mode: "subagent",
    model: { id: "gpt-5.6-sol", providerID: "openai", variant: "high" },
    name: "Bellno",
    permissions: [
      ...defaultPermissions,
      ...specialistSessionPermissions,
      { action: "edit", effect: "deny", resource: "*" },
      { action: "subagent", effect: "deny", resource: "*" },
      { action: "todowrite", effect: "deny", resource: "*" },
      { action: "websearch", effect: "deny", resource: "*" },
      { action: "webfetch", effect: "deny", resource: "*" },
      { action: "academy_github_*", effect: "allow", resource: "*" },
    ],
    system: bellnoSystem,
  },
];
