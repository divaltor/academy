import { Agent, Model, Plugin, Provider } from "@opencode/plugin/effect";
import { Effect } from "effect";

import { agents } from "./agents";

const setup = Effect.fn("Academy.setup")(function* setup(ctx: Plugin.Context) {
  yield* ctx.agent.transform((editor) => {
    for (const id of ["build", "plan", "explore", "general"]) {
      editor.remove(id);
    }

    for (const definition of agents) {
      editor.update(definition.id, (agent) => {
        agent.name = Agent.Name.make(definition.name);
        agent.description = definition.description;
        agent.mode = definition.mode;
        agent.color = definition.color;
        agent.system = definition.system;
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
