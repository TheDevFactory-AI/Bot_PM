const SECTION_CAPS = {
  topPriorities: 5,
  explicitBlockers: 10,
  dueSoon: 10,
  staleItems: 10,
  softBlockers: 5,
} as const;

export interface SlackDailyBriefInput {
  sprintName?: string;
  generatedAt: string | Date;
  timezone?: string;
  sprintSnapshot: string[];
  topPriorities: string[];
  explicitBlockers: string[];
  dueSoon: string[];
  staleItems: string[];
  softBlockers: string[];
  demoReadiness: string[];
}

export interface SlackStatusNudgeInput {
  workItemName: string;
  ownerName?: string;
  status: string;
  dueDate?: string;
  priorityCycleName?: string;
  reason: string;
  latestBotNote?: string;
  notionUrl?: string;
  cadenceLabel?: string;
}

export interface SlackEscalationItem {
  workItemName: string;
  ownerName?: string;
  status: string;
  dueDate?: string;
  priorityCycleName?: string;
  escalatedReason: string;
  latestBotNote?: string;
  notionUrl?: string;
}

export interface SlackEscalationSummaryInput {
  generatedAt: string | Date;
  timezone?: string;
  items: SlackEscalationItem[];
}

export function renderSlackDailyBrief(input: SlackDailyBriefInput): string {
  const title = input.sprintName ? `*Daily Brief* - ${input.sprintName}` : "*Daily Brief*";
  const lines = [
    title,
    `_Generated ${formatTimestamp(input.generatedAt, input.timezone)}_`,
    "",
    ...renderSection("Sprint snapshot", input.sprintSnapshot),
    "",
    ...renderCappedSection("Top priorities", input.topPriorities, SECTION_CAPS.topPriorities),
    "",
    ...renderCappedSection("Explicit blockers", input.explicitBlockers, SECTION_CAPS.explicitBlockers),
    "",
    ...renderCappedSection("Due soon", input.dueSoon, SECTION_CAPS.dueSoon),
    "",
    ...renderCappedSection("Stale items", input.staleItems, SECTION_CAPS.staleItems),
    "",
    ...renderCappedSection("Soft blockers", input.softBlockers, SECTION_CAPS.softBlockers),
    "",
    ...renderSection("Demo readiness", input.demoReadiness),
  ];

  return lines.join("\n").trim();
}

export function renderSlackStatusNudge(input: SlackStatusNudgeInput): string {
  const lines = [
    `*${input.cadenceLabel ?? "Status Update Nudge"}*`,
    `*${input.workItemName}* needs an update in Notion.`,
    `Status: ${input.status}`,
  ];

  if (input.ownerName) {
    lines.push(`Owner: ${input.ownerName}`);
  }

  if (input.dueDate) {
    lines.push(`Due: ${input.dueDate}`);
  }

  if (input.priorityCycleName) {
    lines.push(`Priority cycle: ${input.priorityCycleName}`);
  }

  lines.push(`Reason: ${input.reason}`);

  if (input.latestBotNote) {
    lines.push(`Latest bot note: ${input.latestBotNote}`);
  }

  if (input.notionUrl) {
    lines.push(`Notion: ${input.notionUrl}`);
  }

  lines.push("Please update or unblock the item in Notion.");

  return lines.join("\n");
}

export function renderSlackEscalationSummary(input: SlackEscalationSummaryInput): string {
  const lines = [
    "*Sprint Escalation*",
    `${input.items.length} work item${input.items.length === 1 ? "" : "s"} still need update${
      input.items.length === 1 ? "" : "s"
    } in Notion.`,
    `_Generated ${formatTimestamp(input.generatedAt, input.timezone)}_`,
    "",
  ];

  for (const item of input.items) {
    lines.push(`• *${item.workItemName}*`);
    lines.push(`  Status: ${item.status}`);
    lines.push(`  Owner: ${item.ownerName ?? "Unassigned"}`);

    if (item.dueDate) {
      lines.push(`  Due: ${item.dueDate}`);
    }

    if (item.priorityCycleName) {
      lines.push(`  Priority cycle: ${item.priorityCycleName}`);
    }

    lines.push(`  Why it escalated: ${item.escalatedReason}`);

    if (item.latestBotNote) {
      lines.push(`  Latest bot note: ${item.latestBotNote}`);
    }

    if (item.notionUrl) {
      lines.push(`  Notion: ${item.notionUrl}`);
    }

    lines.push("");
  }

  lines.push("Please update or unblock these items in Notion.");

  return lines.join("\n").trim();
}

function renderSection(title: string, items: string[]): string[] {
  if (items.length === 0) {
    return [`*${title}*`, "• None"];
  }

  return [`*${title}*`, ...items.map((item) => `• ${item}`)];
}

function renderCappedSection(title: string, items: string[], cap: number): string[] {
  const visibleItems = items.slice(0, cap);
  const overflow = Math.max(items.length - visibleItems.length, 0);
  const lines = renderSection(title, visibleItems);

  if (overflow > 0) {
    lines.push(`• +${overflow} more`);
  }

  return lines;
}

function formatTimestamp(value: string | Date, timeZone = "America/Toronto"): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
