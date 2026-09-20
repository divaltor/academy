import { Plugin } from "@opencode/plugin";

export default Plugin.define({
  id: "academy",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        description: "Create a greeting",
        execute: (input) =>
          Promise.resolve({
            content: `Hello ${(input as { name: string }).name}!`,
          }),
        input: {
          additionalProperties: false,
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
          type: "object",
        },
        name: "greeting",
      });
    });
  },
});
