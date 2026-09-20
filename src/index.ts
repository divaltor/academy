import { Agent, Model, Plugin, Provider } from "@opencode/plugin/effect";
import { Config, Effect, Option, Redacted, Schema } from "effect";

import { agents } from "./agents";

const AcademyOptions = Schema.Struct({
  agentNames: Schema.optionalKey(
    Schema.Struct({
      agnes: Schema.optionalKey(Schema.NonEmptyString),
      bellno: Schema.optionalKey(Schema.NonEmptyString),
      bourbon: Schema.optionalKey(Schema.NonEmptyString),
      cafe: Schema.optionalKey(Schema.NonEmptyString),
      dantsu: Schema.optionalKey(Schema.NonEmptyString),
      diana: Schema.optionalKey(Schema.NonEmptyString),
    })
  ),
});

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
  const githubToken = yield* Config.option(
    Config.redacted("GITHUB_TOKEN")
  ).pipe(Effect.orDie);
  const options = yield* Schema.decodeUnknownEffect(AcademyOptions, {
    onExcessProperty: "error",
  })(ctx.options).pipe(Effect.orDie);
  const configuredNames: Readonly<Record<string, string | undefined>> =
    options.agentNames ?? {};
  const agentNames = new Map(
    agents.map((agent) => [agent.name, configuredNames[agent.id] ?? agent.name])
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
    for (const id of ["build", "plan", "explore", "general"]) {
      editor.remove(id);
    }

    for (const definition of agents) {
      editor.update(definition.id, (agent) => {
        agent.name = Agent.Name.make(
          agentNames.get(definition.name) ?? definition.name
        );
        agent.description = definition.description;
        agent.mode = definition.mode;
        agent.color = definition.color;
        agent.system = definition.system.replaceAll(
          /\b(?:Diana|Agnes|Bourbon|Cafe|Dantsu|Bellno)\b/gu,
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

    editor.default("diana");
  });
});

export default Plugin.define({
  effect: setup,
  id: "academy",
});
