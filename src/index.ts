import { Agent, Model, Plugin } from "@opencode/plugin/effect";
import { Effect, Schema } from "effect";

import { agents } from "./agents";
import { FffTools } from "./fff-tools";
import { SessionGuidance } from "./session-guidance";

const ModelReference = Schema.NonEmptyString.check(
  Schema.isPattern(/^[^/#]+\/[^#]+(?:#[^#]+)?$/u)
);

const parseModel = (reference: string | undefined) =>
  reference ? Model.Ref.parse(reference) : undefined;

const AgentOptions = Schema.Struct({
  color: Schema.optionalKey(Agent.Color),
  disabled: Schema.optionalKey(Schema.Boolean),
  model: Schema.optionalKey(ModelReference),
  name: Schema.optionalKey(Schema.NonEmptyString),
});

const AgentsOptions = Schema.Struct({
  bellno: Schema.optionalKey(AgentOptions),
  cafe: Schema.optionalKey(AgentOptions),
  rudolf: Schema.optionalKey(AgentOptions),
});

const AcademyOptions = Schema.Struct({
  agents: Schema.optionalKey(AgentsOptions),
  use_fff: Schema.optionalKey(Schema.Boolean),
});

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
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
  const disabledAgentIDs = new Set(
    agents
      .filter((agent) => agentOptions[agent.id]?.disabled === true)
      .map((agent) => agentID(agent.id))
  );
  const rudolfDisabled = disabledAgentIDs.has(agentID("rudolf"));

  if (new Set(configuredAgentIDs).size !== configuredAgentIDs.length) {
    return yield* Effect.die(
      new Error("Academy agent names must produce unique agent IDs")
    );
  }

  if (options.use_fff ?? true) {
    yield* FffTools.register(ctx);
  }

  yield* SessionGuidance.register(ctx);

  yield* ctx.agent.transform((editor) => {
    for (const id of ["build", "plan", "explore", "general"]) {
      editor.update(id, (agent) => {
        agent.hidden = !(id === "build" && rudolfDisabled);
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
        agent.hidden = disabledAgentIDs.has(agentID(definition.id));
        agent.color =
          agentOptions[definition.id]?.color ?? agent.color ?? definition.color;
        agent.system = definition.system.replaceAll(
          /\b(?:Rudolf|Cafe|Bellno)\b/gu,
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

    for (const agent of editor.list()) {
      editor.update(agent.id, (editable) => {
        editable.permissions.push(
          ...disabledAgentIDs.values().map((id) => ({
            action: "subagent",
            effect: "deny" as const,
            resource: id,
          }))
        );
      });
    }

    if (rudolfDisabled) {
      editor.default(
        editor.list().find((agent) => agent.mode === "primary" && !agent.hidden)
          ?.id
      );
      return;
    }

    editor.default(agentID("rudolf"));
  });
});

export default Plugin.define({
  effect: setup,
  id: "academy",
});
