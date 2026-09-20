import { Agent, Model, Plugin, Provider } from "@opencode/plugin/effect";
import { Config, Effect, Option, Redacted, Schema } from "effect";

import { agents } from "./agents";

const AgentOptions = Schema.Struct({
  color: Schema.optionalKey(Agent.Color),
  name: Schema.optionalKey(Schema.NonEmptyString),
});

const AcademyOptions = Schema.Struct({
  agentNames: Schema.optionalKey(
    Schema.Struct({
      agnes: Schema.optionalKey(Schema.NonEmptyString),
      bellno: Schema.optionalKey(Schema.NonEmptyString),
      bourbon: Schema.optionalKey(Schema.NonEmptyString),
      cafe: Schema.optionalKey(Schema.NonEmptyString),
      dantsu: Schema.optionalKey(Schema.NonEmptyString),
      diana: Schema.optionalKey(Schema.NonEmptyString),
      rudolf: Schema.optionalKey(Schema.NonEmptyString),
    })
  ),
  agnes: Schema.optionalKey(AgentOptions),
  bellno: Schema.optionalKey(AgentOptions),
  bourbon: Schema.optionalKey(AgentOptions),
  cafe: Schema.optionalKey(AgentOptions),
  dantsu: Schema.optionalKey(AgentOptions),
  diana: Schema.optionalKey(AgentOptions),
  rudolf: Schema.optionalKey(AgentOptions),
});

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
  const githubToken = yield* Config.option(
    Config.redacted("GITHUB_TOKEN")
  ).pipe(Effect.orDie);
  const options = yield* Schema.decodeUnknownEffect(AcademyOptions, {
    onExcessProperty: "error",
  })(ctx.options).pipe(Effect.orDie);
  const legacyNames = options.agentNames ?? {};
  const agentNames = new Map(
    agents.map((agent) => [
      agent.name,
      options[agent.id]?.name ??
        (agent.id === "rudolf" ? options.diana?.name : undefined) ??
        legacyNames[agent.id] ??
        (agent.id === "rudolf" ? legacyNames.diana : undefined) ??
        agent.name,
    ])
  );

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
    for (const id of ["build", "plan", "explore", "general", "diana"]) {
      editor.remove(id);
    }

    for (const definition of agents) {
      editor.update(definition.id, (agent) => {
        agent.name = Agent.Name.make(
          agentNames.get(definition.name) ?? definition.name
        );
        agent.description = definition.description;
        agent.mode = definition.mode;
        agent.color =
          options[definition.id]?.color ??
          (definition.id === "rudolf" ? options.diana?.color : undefined) ??
          agent.color ??
          definition.color;
        agent.system = definition.system.replaceAll(
          /\b(?:Rudolf|Agnes|Bourbon|Cafe|Dantsu|Bellno)\b/gu,
          (name) => agentNames.get(name) ?? name
        );
        agent.permissions = definition.permissions.map((permission) => ({
          ...permission,
        }));
        agent.model = definition.model
          ? {
              id: Model.ID.make(definition.model.id),
              providerID: Provider.ID.make(definition.model.providerID),
              variant: Model.VariantID.make(definition.model.variant),
            }
          : undefined;
      });
    }

    editor.default("rudolf");
  });
});

export default Plugin.define({
  effect: setup,
  id: "academy",
});
