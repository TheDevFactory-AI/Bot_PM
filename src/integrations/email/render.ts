export interface EscalationEmailItem {
  workItemName: string;
  ownerName?: string;
  status: string;
  dueDate?: string;
  priorityCycleName?: string;
  escalatedReason: string;
  latestBotNote?: string;
  notionUrl?: string;
}

export interface EscalationEmailRenderInput {
  generatedAt: string | Date;
  timezone?: string;
  items: EscalationEmailItem[];
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderEscalationEmail(input: EscalationEmailRenderInput): RenderedEmail {
  if (input.items.length === 0) {
    throw new Error("Escalation email requires at least one item.");
  }

  const subject =
    input.items.length === 1
      ? `[Sprint Escalation] ${input.items[0].workItemName} needs update`
      : `[Sprint Escalation] ${input.items.length} work items need updates`;

  const text = renderPlainTextEscalation(input);
  const html = renderHtmlEscalation(input);

  return {
    subject,
    text,
    html,
  };
}

function renderPlainTextEscalation(input: EscalationEmailRenderInput): string {
  const lines = [
    "Sprint escalation requires updates in Notion.",
    `Generated: ${formatTimestamp(input.generatedAt, input.timezone)}`,
    "",
  ];

  input.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.workItemName}`);
    lines.push(`   Owner: ${item.ownerName ?? "Unassigned"}`);
    lines.push(`   Current status: ${item.status}`);
    lines.push(`   Due date: ${item.dueDate ?? "Not set"}`);
    lines.push(`   Priority cycle: ${item.priorityCycleName ?? "Not linked"}`);
    lines.push(`   Why it escalated: ${item.escalatedReason}`);
    lines.push(`   Latest bot note: ${item.latestBotNote ?? "None"}`);
    lines.push(`   Notion URL: ${item.notionUrl ?? "Not available"}`);
    lines.push("");
  });

  lines.push("Please update or unblock each item in Notion.");

  return lines.join("\n").trim();
}

function renderHtmlEscalation(input: EscalationEmailRenderInput): string {
  const items = input.items
    .map(
      (item) => `
        <li style="margin-bottom:16px;">
          <div><strong>${escapeHtml(item.workItemName)}</strong></div>
          <div>Owner: ${escapeHtml(item.ownerName ?? "Unassigned")}</div>
          <div>Current status: ${escapeHtml(item.status)}</div>
          <div>Due date: ${escapeHtml(item.dueDate ?? "Not set")}</div>
          <div>Priority cycle: ${escapeHtml(item.priorityCycleName ?? "Not linked")}</div>
          <div>Why it escalated: ${escapeHtml(item.escalatedReason)}</div>
          <div>Latest bot note: ${escapeHtml(item.latestBotNote ?? "None")}</div>
          <div>Notion URL: ${
            item.notionUrl
              ? `<a href="${escapeHtml(item.notionUrl)}">${escapeHtml(item.notionUrl)}</a>`
              : "Not available"
          }</div>
        </li>`,
    )
    .join("");

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <p>Sprint escalation requires updates in Notion.</p>
        <p>Generated: ${escapeHtml(formatTimestamp(input.generatedAt, input.timezone))}</p>
        <ol>
          ${items}
        </ol>
        <p>Please update or unblock each item in Notion.</p>
      </body>
    </html>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(value: string | Date, timeZone = "America/Toronto"): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
