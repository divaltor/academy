import { Agent, Model, Plugin } from "@opencode/plugin/effect";
import { Config, Effect, Option, Redacted, Schema } from "effect";

import { agents, rudolfCommunicationPrompt } from "./agents";
import { FffTools } from "./fff-tools";
import { SessionCommunication } from "./session-communication";

const ModelReference = Schema.NonEmptyString.check(
  Schema.isPattern(/^[^/#]+\/[^#]+(?:#[^#]+)?$/u)
);

const parseModel = (reference: string | undefined) =>
  reference ? Model.Ref.parse(reference) : undefined;

const AgentOptions = Schema.Struct({
  color: Schema.optionalKey(Agent.Color),
  model: Schema.optionalKey(ModelReference),
  name: Schema.optionalKey(Schema.NonEmptyString),
});

const AgentsOptions = Schema.Struct({
  agnes: Schema.optionalKey(AgentOptions),
  bellno: Schema.optionalKey(AgentOptions),
  cafe: Schema.optionalKey(AgentOptions),
  dantsu: Schema.optionalKey(AgentOptions),
  rudolf: Schema.optionalKey(AgentOptions),
});

const ExperimentalOptions = Schema.Struct({
  communication: Schema.optionalKey(SessionCommunication.Options),
});

const AcademyOptions = Schema.Struct({
  agents: Schema.optionalKey(AgentsOptions),
  experimental: Schema.optionalKey(ExperimentalOptions),
  use_fff: Schema.optionalKey(Schema.Boolean),
});

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
  const githubToken = yield* Config.option(
    Config.redacted("GITHUB_TOKEN")
  ).pipe(Effect.orDie);
  const options = yield* Schema.decodeUnknownEffect(AcademyOptions, {
    onExcessProperty: "error",
  })(ctx.options).pipe(Effect.orDie);
  const agentOptions = options.agents ?? {};
  const agentNames = new Map(
    agents.map((agent) => [
      agent.name,
      agentOptions[agent.id]?.name ?? agent.name,
    ])
  );
  const agentID = (id: (typeof agents)[number]["id"]) =>
    Agent.ID.make(agentOptions[id]?.name ?? id);
  const configuredAgentIDs = agents.map((agent) => agentID(agent.id));
  const communication = options.experimental?.communication;
  const communicationEnabled = communication?.enabled === true;

  if (new Set(configuredAgentIDs).size !== configuredAgentIDs.length) {
    return yield* Effect.die(
      new Error("Academy agent names must produce unique agent IDs")
    );
  }

  yield* ctx.mcp.transform((editor) => {
    if (Option.isNone(githubToken)) {
      return;
    }

    editor.set("academy_github", {
      headers: {
        Authorization: `Bearer ${Redacted.value(githubToken.value)}`,
        "X-MCP-Toolsets": "repos,issues,pull_requests",
      },
      oauth: false,
      type: "remote",
      url: "https://api.githubcopilot.com/mcp/readonly",
    });
  });

  if (options.use_fff ?? true) {
    yield* FffTools.register(ctx);
  }

  yield* ctx.agent.transform((editor) => {
    for (const id of ["build", "plan", "explore", "general"]) {
      editor.update(id, (agent) => {
        agent.hidden = true;
      });
    }

    for (const definition of agents) {
      if (agentID(definition.id) !== definition.id) {
        editor.remove(definition.id);
      }
    }

    for (const definition of agents) {
      editor.update(agentID(definition.id), (agent) => {
        agent.name = Agent.Name.make(
          agentNames.get(definition.name) ?? definition.name
        );
        agent.description = definition.description;
        agent.mode = definition.mode;
        agent.color =
          agentOptions[definition.id]?.color ?? agent.color ?? definition.color;
        const base =
          definition.id === "rudolf" && communicationEnabled
            ? definition.system.replace(
                "# Communication",
                `${rudolfCommunicationPrompt}\n\n# Communication`
              )
            : definition.system;
        agent.system = base.replaceAll(
          /\b(?:Rudolf|Agnes|Cafe|Dantsu|Bellno)\b/gu,
          (name) => agentNames.get(name) ?? name
        );
        agent.permissions = definition.permissions.map((permission) => {
          const referencedAgent = agents.find(
            (candidate) => candidate.id === permission.resource
          );

          return {
            ...permission,
            resource: referencedAgent
              ? agentID(referencedAgent.id)
              : permission.resource,
          };
        });
        agent.model = parseModel(
          agentOptions[definition.id]?.model ?? definition.model
        );
      });
    }

    editor.default(agentID("rudolf"));
  });

  if (communication !== undefined && communicationEnabled) {
    yield* SessionCommunication.register(ctx, communication, agentID("rudolf"));
  }
});

export default Plugin.define({
  effect: setup,
  id: "academy",
});
