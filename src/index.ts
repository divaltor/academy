import { Agent, Model, Plugin } from "@opencode/plugin/effect";
import { Config, Effect, Option, Redacted, Schema } from "effect";

import { agents } from "./agents";
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

const AcademyOptions = Schema.Struct({
  agnes: Schema.optionalKey(AgentOptions),
  bellno: Schema.optionalKey(AgentOptions),
  cafe: Schema.optionalKey(AgentOptions),
  communication: Schema.optionalKey(SessionCommunication.Options),
  dantsu: Schema.optionalKey(AgentOptions),
  rudolf: Schema.optionalKey(AgentOptions),
});

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
  const githubToken = yield* Config.option(
    Config.redacted("GITHUB_TOKEN")
  ).pipe(Effect.orDie);
  const options = yield* Schema.decodeUnknownEffect(AcademyOptions, {
    onExcessProperty: "error",
  })(ctx.options).pipe(Effect.orDie);
  const agentNames = new Map(
    agents.map((agent) => [agent.name, options[agent.id]?.name ?? agent.name])
  );
  const agentID = (id: (typeof agents)[number]["id"]) =>
    Agent.ID.make(options[id]?.name ?? id);
  const configuredAgentIDs = agents.map((agent) => agentID(agent.id));

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

  yield* ctx.agent.transform((editor) => {
    for (const id of ["build", "plan", "explore", "general"]) {
      editor.remove(id);
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
          options[definition.id]?.color ?? agent.color ?? definition.color;
        agent.system = definition.system.replaceAll(
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
          options[definition.id]?.model ?? definition.model
        );
      });
    }

    editor.default(agentID("rudolf"));
  });

  yield* SessionCommunication.register(
    ctx,
    options.communication ?? {},
    agentID("rudolf")
  );
});

export default Plugin.define({
  effect: setup,
  id: "academy",
});
