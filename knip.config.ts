import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["lint/*.ts", "tests/*.test.ts"],
  project: ["**/*.ts"],
};

export default config;
