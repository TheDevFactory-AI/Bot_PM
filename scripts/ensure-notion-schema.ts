import {
  ensurePhase1NotionSchema,
  getPhase1NotionConfig,
  NotionClient,
  type NotionSchemaMode,
} from "../src/integrations/notion/index.js";

const mode = parseMode(process.argv.slice(2));
const mutationAllowed = process.env.NOTION_ALLOW_SCHEMA_MUTATION === "true";
const config = getPhase1NotionConfig();
const client = NotionClient.fromConfig(config);

const result = await ensurePhase1NotionSchema({
  client,
  config,
  mode,
  allowMutation: mutationAllowed,
});

console.log(JSON.stringify(result, null, 2));

const hasTypeMismatches = result.databases.some(
  (database) => database.typeMismatches.length > 0,
);
const hasMissing = result.databases.some((database) => database.missing.length > 0);

if (mode === "apply" && !mutationAllowed) {
  console.error(
    "Refusing to mutate Notion schema: set NOTION_ALLOW_SCHEMA_MUTATION=true with --mode=apply.",
  );
  process.exitCode = 1;
} else if (hasTypeMismatches || (mode === "dry-run" && hasMissing)) {
  process.exitCode = 1;
}

function parseMode(args: string[]): NotionSchemaMode {
  const modeFlag = args.find((argument) => argument.startsWith("--mode="));
  const value = modeFlag?.split("=")[1];

  if (value === undefined || value === "dry-run") {
    return "dry-run";
  }

  if (value === "apply") {
    return "apply";
  }

  throw new Error(`Unsupported schema mode: ${value}`);
}
