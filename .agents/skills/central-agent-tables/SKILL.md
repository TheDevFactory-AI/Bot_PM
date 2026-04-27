---
name: central-agent-tables
description: Reference data for Central Agent Phase 1 Notion tables, database IDs, table ownership, lifecycle flow, and which fields humans versus the bot may update. Use when any Central Agent Notion workflow needs schema context, table relationships, routing conventions, or safe-editing rules.
---

# Central Agent Tables

Use this as context before listing, summarizing, or updating Central Agent Notion data.

## Database IDs

- Customers: `dd2c10be14a64dd1bea6c5eebe0a2a9f`
- Conversations: `6a67285427dc4512b507a99ca410bcd6`
- Signals: `fb4bd47e3739428f9b12102e117fd265`
- Work Items: `2cad1025e43b80e0a0bbc8e83d5ed2f2`
- Priority Cycles: `643a78e769624943b6fe43ac82826dd7`
- Readiness Gates: `fb75c992ecee4793a88590b431b53362`
- Briefs: `71dd073c619841a5ab041ad0bb09b93c`
- Bot Runs: `079b575d5098491786bbbd1f0b262549`
- People Directory: `34ed1025e43b8059ac12ed949c5c5c1f`

## Table Roles

`Priority Cycles`
: Active sprint/week. The bot expects exactly one active cycle.

`Work Items`
: Human-owned sprint work. Contains status, owner, due dates, blocker state, priority inputs, QA/test evidence, and demo scope.

`Conversations`
: Meeting or customer notes. The bot reads recent transcripts/summaries and creates derived `Signals`.

`Signals`
: Bot/human evidence rows: pain points, objections, feature requests, next steps, soft blockers, readiness risks, status nudge candidates.

`Readiness Gates`
: Bot-owned demo readiness evaluation for the active cycle.

`Briefs`
: Bot-owned notification records for daily briefs, nudges, sprint completion reminders, and escalations. Used for dedupe and delivery history.

`Bot Runs`
: Bot-owned audit records for non-dry-run batches.

`People Directory`
: Human-maintained routing table. Active people with Slack IDs can receive DMs; active people with email addresses receive escalation email.

## Human-Owned Work Item Fields

- `Status`: use exact Notion option names such as `New`, `In Progress`, `Testing`, `Resolved`, or the options visible in Notion.
- `Owner`
- `Due Date`
- `Completed At`
- `Blocked State`
- `Depends On`
- `QA Present`
- `Tests Present`
- `Confirmed Priority` / `Priority`
- `Customer Impact`
- `Revenue Impact`
- `Demo Impact`
- `Criticality`
- `Effort`
- `Demo Scope`

## Bot-Owned Work Item Fields

Do not update these during normal team workflow:

- `Last Activity Source`
- `Latest Bot Note`
- `Bot History URL`
- `Computed Hard Blocked`
- `Priority Score`
- `Priority Recommendation`
- `Priority Needs Review`
- `Priority Missing Inputs`
- `Status Nudge Eligible`

## Lifecycle

1. Load exactly one active `Priority Cycle`.
2. Load related `Work Items`, `Signals`, `Readiness Gates`, `Briefs`, `Bot Runs`, `People Directory`, and recent `Conversations`.
3. Extract new `Signals` from recent conversation text.
4. Score Work Items and compute hard-blocked state.
5. Create or update the active cycle's demo `Readiness Gate`.
6. Create `Briefs` for daily briefs, nudges, sprint completion reminders, and escalations.
7. Send Slack/email only in live mode.
8. Write a `Bot Runs` audit row for non-dry-run batches.

