import type { Phase1NotionConfig } from "./config.js";
import { NotionClient } from "./client.js";
import type {
  NotionDatabase,
  NotionDatabasePropertySchema,
  NotionDatabasePropertyType,
  NotionDatabasePropertyWriteSchema,
  NotionDatabasePropertyWriteSchemas,
} from "./types.js";

export type { NotionDatabase as NotionDatabaseSchema, NotionDatabasePropertySchema };

export type NotionSchemaMode = "dry-run" | "apply";

export interface NotionSchemaPropertySpec {
  type: NotionDatabasePropertyType;
  schema: NotionDatabasePropertyWriteSchema;
  compatibleTypes?: readonly NotionDatabasePropertyType[];
  options?: readonly string[];
}

export interface NotionSchemaDiff {
  missing: string[];
  typeMismatches: Array<{ property: string; expected: string; actual: string }>;
  patch: NotionDatabasePropertyWriteSchemas;
}

export interface EnsureWorkItemsSchemaResult extends NotionSchemaDiff {
  applied: string[];
}

export interface NotionDatabasePropertySpec {
  name: string;
  expectedTypes: readonly NotionDatabasePropertyType[];
  create: NotionDatabasePropertyWriteSchema;
  expectedOptions?: readonly string[];
}

export interface NotionDatabaseSchemaDiff {
  missing: Array<{ name: string; expected: string }>;
  typeMismatches: Array<{ name: string; expected: string; actual: string }>;
}

export interface ApplyNotionDatabaseSchemaResult extends NotionDatabaseSchemaDiff {
  applied: string[];
}

export type Phase1NotionDatabaseName = keyof Phase1NotionConfig["databases"];

export interface Phase1NotionDatabaseSchemaSpec {
  database: Phase1NotionDatabaseName;
  databaseId: string;
  specs: readonly NotionDatabasePropertySpec[];
}

export interface Phase1NotionSchemaDatabaseResult extends ApplyNotionDatabaseSchemaResult {
  database: Phase1NotionDatabaseName;
  databaseId: string;
}

export interface EnsurePhase1NotionSchemaResult {
  mode: NotionSchemaMode;
  mutationAllowed: boolean;
  databases: Phase1NotionSchemaDatabaseResult[];
}

export class NotionSchemaClient extends NotionClient {
  async updateDatabaseProperties(
    databaseId: string,
    properties: NotionDatabasePropertyWriteSchemas,
  ): Promise<NotionDatabase> {
    return this.updateDatabase({ databaseId, properties });
  }
}

export const workItemsBotPropertySchema: readonly NotionDatabasePropertySpec[] = [
  propertySpec("Last Activity Source", ["select"], selectSpec(["Human", "Bot"]), ["Human", "Bot"]),
  propertySpec("Latest Bot Note", ["rich_text"], { rich_text: {} }),
  propertySpec("Bot History URL", ["url"], { url: {} }),
  propertySpec("Computed Hard Blocked", ["checkbox", "formula"], { checkbox: {} }),
  propertySpec("Priority Score", ["number"], numberSchema()),
  propertySpec("Priority Recommendation", ["select"], selectSpec(["P0", "P1", "P2", "P3"]), [
    "P0",
    "P1",
    "P2",
    "P3",
  ]),
  propertySpec("Priority Needs Review", ["checkbox"], { checkbox: {} }),
  propertySpec("Priority Missing Inputs", ["rich_text"], { rich_text: {} }),
  propertySpec("Status Nudge Eligible", ["checkbox", "formula"], { checkbox: {} }),
];

export function buildWorkItemsSchema(config: Phase1NotionConfig): Record<string, NotionSchemaPropertySpec> {
  return {
    "Work Item ID": { type: "rich_text", schema: { rich_text: {} } },
    Owner: relationSpec(config.databases.peopleDirectory),
    "Priority Cycle": relationSpec(config.databases.priorityCycles),
    Customers: relationSpec(config.databases.customers),
    Conversations: relationSpec(config.databases.conversations),
    Signals: relationSpec(config.databases.signals),
    Briefs: relationSpec(config.databases.briefs),
    "Depends On": relationSpec(config.databases.workItems),
    "Due Date": { type: "date", schema: { date: {} } },
    "Completed At": { type: "date", schema: { date: {} } },
    "Demo Scope": { type: "checkbox", schema: { checkbox: {} } },
    "Customer Impact": numberSpec(),
    "Revenue Impact": numberSpec(),
    "Demo Impact": numberSpec(),
    Criticality: numberSpec(),
    Effort: numberSpec(),
    "Priority Score": numberSpec(),
    "Blocked State": {
      type: "select",
      schema: selectSpec(["Not Blocked", "Blocked - Dependency", "Blocked - External"]),
      options: ["Not Blocked", "Blocked - Dependency", "Blocked - External"],
    },
    "QA Present": { type: "checkbox", schema: { checkbox: {} } },
    "Tests Present": { type: "checkbox", schema: { checkbox: {} } },
    "Computed Hard Blocked": {
      type: "checkbox",
      compatibleTypes: ["checkbox", "formula"],
      schema: { checkbox: {} },
    },
    "Last Activity Source": {
      type: "select",
      schema: selectSpec(["Human", "Bot"]),
      options: ["Human", "Bot"],
    },
    "Latest Bot Note": { type: "rich_text", schema: { rich_text: {} } },
    "Bot History URL": { type: "url", schema: { url: {} } },
    "Priority Recommendation": {
      type: "select",
      schema: selectSpec(["P0", "P1", "P2", "P3"]),
      options: ["P0", "P1", "P2", "P3"],
    },
    "Priority Needs Review": { type: "checkbox", schema: { checkbox: {} } },
    "Priority Missing Inputs": { type: "rich_text", schema: { rich_text: {} } },
    "Status Nudge Eligible": {
      type: "checkbox",
      compatibleTypes: ["checkbox", "formula"],
      schema: { checkbox: {} },
    },
    "Updated At": { type: "date", schema: { date: {} } },
  };
}

export function buildPhase1NotionSchemaSpecs(
  config: Phase1NotionConfig,
): Phase1NotionDatabaseSchemaSpec[] {
  const { databases } = config;

  return [
    {
      database: "peopleDirectory",
      databaseId: databases.peopleDirectory,
      specs: [
        propertySpec("Active", ["checkbox"], { checkbox: {} }),
        propertySpec("Slack ID", ["rich_text"], { rich_text: {} }),
        propertySpec("Team", ["select"], selectSpec(TEAM_OPTIONS), TEAM_OPTIONS),
      ],
    },
    {
      database: "conversations",
      databaseId: databases.conversations,
      specs: [
        propertySpec("Needs Review", ["checkbox", "formula"], { checkbox: {} }),
      ],
    },
    {
      database: "signals",
      databaseId: databases.signals,
      specs: [
        relationPropertySpec("Work Item", databases.workItems),
        relationPropertySpec("Priority Cycle", databases.priorityCycles),
        relationPropertySpec("Briefs", databases.briefs),
        relationPropertySpec("Bot Runs", databases.botRuns),
        propertySpec("Is Open", ["checkbox", "formula"], { checkbox: {} }),
        propertySpec("Needs Review", ["checkbox", "formula"], { checkbox: {} }),
        propertySpec("Is Soft Blocker", ["checkbox", "formula"], { checkbox: {} }),
      ],
    },
    {
      database: "workItems",
      databaseId: databases.workItems,
      specs: schemaRecordToSpecs(buildWorkItemsSchema(config)),
    },
    {
      database: "readinessGates",
      databaseId: databases.readinessGates,
      specs: [
        relationPropertySpec("Work Items", databases.workItems),
        relationPropertySpec("Signals", databases.signals),
        relationPropertySpec("Briefs", databases.briefs),
        relationPropertySpec("Bot Runs", databases.botRuns),
      ],
    },
    {
      database: "briefs",
      databaseId: databases.briefs,
      specs: [
        propertySpec("Bot History URL", ["url"], { url: {} }),
        relationPropertySpec("Readiness Gate", databases.readinessGates),
        relationPropertySpec("Related Work Items", databases.workItems),
        relationPropertySpec("Related Signals", databases.signals),
        relationPropertySpec("Bot Runs", databases.botRuns),
      ],
    },
    {
      database: "botRuns",
      databaseId: databases.botRuns,
      specs: [
        propertySpec("Target Row IDs", ["rich_text"], { rich_text: {} }),
        propertySpec("Delivery Target", ["rich_text"], { rich_text: {} }),
        propertySpec("Suppression Reason", ["rich_text"], { rich_text: {} }),
        propertySpec("Error Message", ["rich_text"], { rich_text: {} }),
        relationPropertySpec("Conversation", databases.conversations),
        relationPropertySpec("Customer", databases.customers),
        relationPropertySpec("Signal", databases.signals),
        relationPropertySpec("Work Item", databases.workItems),
        relationPropertySpec("Priority Cycle", databases.priorityCycles),
        relationPropertySpec("Readiness Gate", databases.readinessGates),
        relationPropertySpec("Brief", databases.briefs),
      ],
    },
  ];
}

export function diffDatabaseSchema(
  database: NotionDatabase,
  expected: Record<string, NotionSchemaPropertySpec>,
): NotionSchemaDiff {
  const missing: string[] = [];
  const typeMismatches: Array<{ property: string; expected: string; actual: string }> = [];
  const patch: NotionDatabasePropertyWriteSchemas = {};

  for (const [name, spec] of Object.entries(expected)) {
    const current = database.properties[name];

    if (!current) {
      missing.push(name);
      patch[name] = spec.schema;
      continue;
    }

    if (!isSchemaPropertyCompatible(current, spec)) {
      typeMismatches.push({
        property: name,
        expected: describeExpected(spec.compatibleTypes ?? [spec.type], spec.options),
        actual: describeActual(current, spec.options),
      });
    }
  }

  return { missing, typeMismatches, patch };
}

export function diffNotionDatabaseSchema(
  database: NotionDatabase,
  specs: readonly NotionDatabasePropertySpec[],
): NotionDatabaseSchemaDiff {
  const missing: NotionDatabaseSchemaDiff["missing"] = [];
  const typeMismatches: NotionDatabaseSchemaDiff["typeMismatches"] = [];
  const properties = database.properties;

  for (const spec of specs) {
    const current = properties[spec.name];
    if (!current) {
      missing.push({ name: spec.name, expected: describeExpected(spec.expectedTypes, spec.expectedOptions) });
      continue;
    }

    if (!isPropertyCompatible(current, spec)) {
      typeMismatches.push({
        name: spec.name,
        expected: describeExpected(spec.expectedTypes, spec.expectedOptions),
        actual: describeActual(current, spec.expectedOptions),
      });
    }
  }

  return { missing, typeMismatches };
}

export async function ensureNotionDatabaseSchema(input: {
  client: NotionClient;
  databaseId: string;
  specs: readonly NotionDatabasePropertySpec[];
  apply?: boolean;
  mode?: NotionSchemaMode;
  allowMutation?: boolean;
}): Promise<ApplyNotionDatabaseSchemaResult> {
  const mode = input.mode ?? (input.apply ? "apply" : "dry-run");
  const allowMutation = input.allowMutation ?? input.apply === true;
  const database = await input.client.retrieveDatabase(input.databaseId);
  const diff = diffNotionDatabaseSchema(database, input.specs);
  const patch = Object.fromEntries(
    diff.missing.map(({ name }) => {
      const spec = input.specs.find((candidate) => candidate.name === name);
      if (!spec) {
        throw new Error(`Missing schema spec for ${name}`);
      }
      return [name, spec.create];
    }),
  );

  if (mode === "apply" && diff.missing.length > 0 && diff.typeMismatches.length === 0) {
    if (!allowMutation) {
      return { ...diff, applied: [] };
    }

    await input.client.updateDatabase({ databaseId: input.databaseId, properties: patch });
    return { ...diff, applied: Object.keys(patch) };
  }

  return { ...diff, applied: [] };
}

export async function ensurePhase1NotionSchema(input: {
  client: NotionClient;
  config: Phase1NotionConfig;
  mode?: NotionSchemaMode;
  allowMutation?: boolean;
}): Promise<EnsurePhase1NotionSchemaResult> {
  const mode = input.mode ?? "dry-run";
  const mutationAllowed = input.allowMutation === true;
  const databases: Phase1NotionSchemaDatabaseResult[] = [];

  for (const spec of buildPhase1NotionSchemaSpecs(input.config)) {
    const result = await ensureNotionDatabaseSchema({
      client: input.client,
      databaseId: spec.databaseId,
      specs: spec.specs,
      mode,
      allowMutation: mutationAllowed,
    });

    databases.push({
      database: spec.database,
      databaseId: spec.databaseId,
      ...result,
    });
  }

  return {
    mode,
    mutationAllowed,
    databases,
  };
}

export async function ensureWorkItemsSchema(input: {
  client: NotionClient;
  config: Phase1NotionConfig;
  mode?: NotionSchemaMode;
  allowMutation?: boolean;
}): Promise<EnsureWorkItemsSchemaResult> {
  const mode = input.mode ?? "dry-run";
  const database = await input.client.retrieveDatabase(input.config.databases.workItems);
  const diff = diffDatabaseSchema(database, buildWorkItemsSchema(input.config));
  const applied: string[] = [];

  if (
    mode === "apply" &&
    input.allowMutation === true &&
    diff.missing.length > 0 &&
    diff.typeMismatches.length === 0
  ) {
    await input.client.updateDatabase({
      databaseId: input.config.databases.workItems,
      properties: diff.patch,
    });
    applied.push(...diff.missing);
  }

  return { ...diff, applied };
}

const TEAM_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Customer Success",
  "Operations",
  "Finance",
  "HR",
] as const;

function propertySpec(
  name: string,
  expectedTypes: readonly NotionDatabasePropertyType[],
  create: NotionDatabasePropertyWriteSchema,
  expectedOptions?: readonly string[],
): NotionDatabasePropertySpec {
  return { name, expectedTypes, create, expectedOptions };
}

function relationPropertySpec(name: string, databaseId: string): NotionDatabasePropertySpec {
  return propertySpec(name, ["relation"], relationSpec(databaseId).schema);
}

function schemaRecordToSpecs(
  schema: Record<string, NotionSchemaPropertySpec>,
): NotionDatabasePropertySpec[] {
  return Object.entries(schema).map(([name, spec]) =>
    propertySpec(name, spec.compatibleTypes ?? [spec.type], spec.schema, spec.options),
  );
}

function numberSpec(): NotionSchemaPropertySpec {
  return {
    type: "number",
    schema: numberSchema(),
  };
}

function numberSchema(): NotionDatabasePropertyWriteSchema {
  return {
    number: {
      format: "number",
    },
  };
}

function relationSpec(databaseId: string): NotionSchemaPropertySpec {
  return {
    type: "relation",
    schema: {
      relation: {
        database_id: databaseId,
        type: "single_property",
        single_property: {},
      },
    },
  };
}

function selectSpec(options: readonly string[]): NotionDatabasePropertyWriteSchema {
  return {
    select: {
      options: options.map((name) => ({ name })),
    },
  };
}

function isSchemaPropertyCompatible(
  current: NotionDatabasePropertySchema,
  spec: NotionSchemaPropertySpec,
): boolean {
  const compatibleTypes = spec.compatibleTypes ?? [spec.type];
  if (!compatibleTypes.includes(current.type)) {
    return false;
  }

  return areExpectedOptionsPresent(current, spec.options);
}

function isPropertyCompatible(
  current: NotionDatabasePropertySchema,
  spec: NotionDatabasePropertySpec,
): boolean {
  if (!spec.expectedTypes.includes(current.type)) {
    return false;
  }

  return areExpectedOptionsPresent(current, spec.expectedOptions);
}

function areExpectedOptionsPresent(
  current: NotionDatabasePropertySchema,
  expectedOptions: readonly string[] | undefined,
): boolean {
  if (!expectedOptions || (current.type !== "select" && current.type !== "status")) {
    return true;
  }

  const currentOptions = getOptionNames(current);
  return expectedOptions.every((name) => currentOptions.includes(name));
}

function describeExpected(
  types: readonly NotionDatabasePropertyType[],
  options: readonly string[] | undefined,
): string {
  const typeLabel = types.join(" or ");
  return options ? `${typeLabel} with options ${options.join(", ")}` : typeLabel;
}

function describeActual(
  current: NotionDatabasePropertySchema,
  expectedOptions: readonly string[] | undefined,
): string {
  if (expectedOptions && (current.type === "select" || current.type === "status")) {
    const currentOptions = getOptionNames(current);
    const missingOptions = expectedOptions.filter((name) => !currentOptions.includes(name));
    return missingOptions.length > 0
      ? `${current.type} missing options ${missingOptions.join(", ")}`
      : current.type;
  }

  return current.type;
}

function getOptionNames(property: NotionDatabasePropertySchema): string[] {
  if (property.type === "select") {
    return property.select?.options?.map((option) => option.name) ?? [];
  }

  if (property.type === "status") {
    return property.status?.options?.map((option) => option.name) ?? [];
  }

  return [];
}
