import {
  ensureWorkItemsSchema,
  getPhase1NotionConfig,
  NotionClient,
  type NotionSchemaMode,
} from "../src/integrations/notion/index.js";

const mode = parseMode(process.argv.slice(2));
const mutationAllowed = process.env.NOTION_ALLOW_SCHEMA_MUTATION === "true";
const config = getPhase1NotionConfig();
const client = NotionClient.fromConfig(config);

const result = await ensureWorkItemsSchema({
  client,
  config,
  mode,
  allowMutation: mutationAllowed,
});

console.log(
  JSON.stringify(
    {
      database: "workItems",
      databaseId: config.databases.workItems,
      mode,
      mutationAllowed,
      missing: result.missing,
      typeMismatches: result.typeMismatches,
      applied: result.applied,
    },
    null,
    2,
  ),
);

if (mode === "apply" && !mutationAllowed) {
  console.error(
    "Refusing to mutate Notion schema: set NOTION_ALLOW_SCHEMA_MUTATION=true with --mode=apply.",
  );
  process.exitCode = 1;
} else if (mode === "apply" && result.typeMismatches.length > 0) {
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
