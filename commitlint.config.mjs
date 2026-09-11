/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Scope should match module names
    "scope-enum": [
      1,
      "always",
      [
        "product",
        "po",
        "receipt",
        "invoice",
        "putaway",
        "map",
        "picking",
        "packing",
        "shipping",
        "transfer",
        "move",
        "inventory",
        "dashboard",
        "auth",
        "shell",
        "shared",
        "ui",
        "rules",
        "config",
        "deps",
        "ci",
      ],
    ],
  },
};
