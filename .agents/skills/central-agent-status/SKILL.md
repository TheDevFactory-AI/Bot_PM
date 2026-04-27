---
name: central-agent-status
description: Read-only workflow for summarizing Central Agent Notion tables. Use when the user asks to list or summarize Work Items, current sprint status, blocked work, due work, People Directory routing health, Briefs, Bot Runs, Signals, or overall Central Agent table counts.
---

# Central Agent Status

Summarize Central Agent Notion data without mutating anything.

## Reference

Use `$central-agent-tables` context for database IDs, ownership, and lifecycle rules.

## Common Requests

### Current Work Items

Use Notion database query/search against Work Items:

- Data source/database ID: `2cad1025e43b80e0a0bbc8e83d5ed2f2`
- Show `Name`, `Status`, `Owner`, `Due Date`, `Blocked State`, `Priority`, `QA Present`, `Tests Present`, `Demo Scope`, and URL when available.
- Group by `Status` when the user asks for sprint/project status.
- Use exact Notion status names. This workspace includes options such as `New`, `In Progress`, `Testing`, `Resolved`, `Won't Fix`, and `lingeringBugs`.

### Blocked Or Due Work

Filter or summarize Work Items by:

- `Status = Blocked` or `Blocked State` not empty.
- `Due Date` before/today/within the requested range.
- `Demo Scope = true` when the user asks about demo readiness.

### People Directory Routing

Use People Directory:

- Database ID: `34ed1025e43b8059ac12ed949c5c5c1f`
- Show active people missing `Slack ID` or missing `Email`.
- Do not guess Slack IDs. Use the repo backfill script or Slack lookup before updating.

### Briefs And Bot Runs

Use Briefs and Bot Runs for delivery/audit questions:

- Briefs database ID: `71dd073c619841a5ab041ad0bb09b93c`
- Bot Runs database ID: `079b575d5098491786bbbd1f0b262549`
- Summarize recent `Status`, `Route`, `Scheduled For`, `Resulting Change`, errors, and failed sends.

## Output Style

Keep summaries short and operational:

- Lead with counts.
- Group rows by status or urgency.
- Include page links for rows that need action.
- State when data is missing or ambiguous.

