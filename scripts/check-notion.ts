import { getPhase1NotionConfig, NotionClient } from "../src/integrations/notion/index.js";

const config = getPhase1NotionConfig();
const client = NotionClient.fromConfig(config);

for (const [label, databaseId] of Object.entries(config.databases)) {
  const result = await client.queryDatabase({
    databaseId,
    pageSize: 1,
  });

  console.log(`${label}: ok [${databaseId}] rows=${result.results.length}${result.has_more ? "+" : ""}`);
}
