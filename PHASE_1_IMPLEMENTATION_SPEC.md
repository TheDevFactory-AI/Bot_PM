# Phase 1 Implementation Spec

## Scope

Phase 1 is the `Ops MVP`.

Goals:

- Read from Notion as the runtime source of truth
- Ingest transcript-derived signals that were already pushed into Notion by a third-party API
- Track sprint execution pressure
- Send daily briefs
- Send direct-message nudges for stale or late sprint work
- Escalate unresolved sprint work to a fixed Slack channel and email all active people
- Compute demo readiness for active sprint demo-scope work

Out of scope for Phase 1:

- Direct GitHub reads by the bot
- Direct Gmail inbox reads by the bot
- Automatic creation of `Work Items`
- Automatic mutation of human-owned workflow fields like canonical status or confirmed priority

## Global Principles

- Notion is the only runtime source of truth the bot reads in Phase 1.
- GitHub CI must be mirrored into Notion by another system or human process.
- `Conversation -> Customer` linking is allowed only through explicit `Customer ID`.
- The bot may auto-create bot-owned records and fields.
- The bot may not automatically change human-owned `Status`, `Confirmed Priority`, `Confirmed Status`, `Blocked State`, `Due Date`, `Owner`, `QA Present`, or `Tests Present`.
- `Signals`, `Briefs`, `Readiness Gates`, and `Bot Runs` are bot-owned operational surfaces.
- Full audit history lives in `Bot Runs`.

## Tables

Phase 1 tables:

- `Customers`
- `Conversations`
- `Signals`
- `Work Items`
- `Priority Cycles`
- `Readiness Gates`
- `Briefs`
- `Bot Runs`
- `People Directory`

## Shared Table Conventions

Every table should include:

- `Name` as the title property
- a stable external ID field
- `Created At`
- `Updated At`

Separate human-owned fields from bot-owned fields whenever both exist.

Examples:

- `Confirmed Priority` vs `Priority Score`
- `Confirmed Status` vs `Computed Status`
- `Blocked State` vs `Computed Hard Blocked`

## Notion Schema

### Customers

Purpose:
Canonical customer or account record used to group conversations, signals, work, and brief context.

Required fields:

- `Name` — Title
- `Customer ID` — Rich text, unique
- `Stage` — Select: `Lead`, `Active`, `Pilot`, `Paused`, `Churned`
- `Owner` — People
- `Active` — Checkbox

Relations:

- `Conversations` -> `Conversations`
- `Signals` -> `Signals`
- `Work Items` -> `Work Items`
- `Briefs` -> `Briefs`

Computed fields:

- `Latest Conversation At` — Rollup max
- `Open Work Items` — Rollup count
- `Soft Blocker Count` — Rollup count of open `soft_blocker` signals
- `Needs Follow-up` — Formula

Suggested views:

- `Active Customers`
- `Needs Follow-up`
- `Soft Blockers`
- `No Recent Conversation`

### Conversations

Purpose:
One row per transcript or notes payload pushed into Notion.

Required fields:

- `Name` — Title
- `Conversation ID` — Rich text, unique
- `Customer ID` — Rich text, required, authoritative
- `Customer` — Relation to `Customers`, convenience mirror only
- `Occurred At` — Date
- `Source Type` — Select: `Demo`, `Discovery`, `Support`, `Voice Memo`, `Other`
- `Transcript URL` — URL
- `Summary` — Rich text
- `Extraction Confidence` — Number `0..1`
- `Extraction Status` — Status: `New`, `Parsed`, `Review`, `Accepted`

Relations:

- `Signals` -> `Signals`
- `Work Items` -> `Work Items`

Computed fields:

- `Needs Review` — Formula: confidence below threshold or missing mirrored customer relation
- `Open Soft Blocker` — Rollup
- `Signal Count` — Rollup count

Suggested views:

- `New Transcripts`
- `Review Queue`
- `Customer Unresolved`
- `Soft Blocker Conversations`

### Signals

Purpose:
Normalized extracted facts and rule outputs. This unified table holds pains, objections, feature requests, next steps, and soft blockers.

Required fields:

- `Name` — Title
- `Signal ID` — Rich text, unique
- `Signal Type` — Select:
  - `pain_point`
  - `objection`
  - `feature_request`
  - `next_step`
  - `soft_blocker`
  - `readiness_risk`
  - `status_nudge_candidate`
- `Source Table` — Select
- `Source Row ID` — Rich text
- `Rule Name` — Rich text
- `Confidence` — Number `0..1`
- `Review Status` — Status: `New`, `Review`, `Accepted`, `Dismissed`, `Resolved`

Relations:

- `Conversation` -> `Conversations`
- `Customer` -> `Customers`
- `Work Item` -> `Work Items`
- `Priority Cycle` -> `Priority Cycles`
- `Briefs` -> `Briefs`
- `Bot Runs` -> `Bot Runs`

Computed fields:

- `Needs Review` — Formula: `Confidence < 0.85`
- `Is Soft Blocker` — Formula
- `Is Open` — Formula
- `Dedupe Key` — Formula or text

Suggested views:

- `Review Queue`
- `Open Soft Blockers`
- `Accepted Next Steps`
- `Dismissed`

### Work Items

Purpose:
Execution table for tasks, issues, features, and sprint work. This is the main operational table the bot observes and lightly annotates.

Human-owned required fields:

- `Name` — Title
- `Work Item ID` — Rich text, unique
- `Status` — Status: `Backlog`, `Ready`, `In Progress`, `Blocked`, `In Review`, `Done`, `Canceled`
- `Owner` — Relation to `People Directory`
- `Due Date` — Date
- `Priority Cycle` — Relation to `Priority Cycles`
- `Customer Impact` — Number `0..5`
- `Revenue Impact` — Number `0..5`
- `Demo Impact` — Number `0..5`
- `Criticality` — Number `0..5`
- `Effort` — Number `1..5`
- `Blocked State` — Select: `Not Blocked`, `Blocked - Dependency`, `Blocked - External`
- `Depends On` — Self relation
- `QA Present` — Checkbox
- `Tests Present` — Checkbox
- `Confirmed Priority` — Select: `P0`, `P1`, `P2`, `P3`
- `Demo Scope` — Checkbox

Bot-owned fields allowed on `Work Items`:

- `Last Activity Source` — Select: `Human`, `Bot`
- `Latest Bot Note` — Rich text
- `Bot History URL` — URL
- `Computed Hard Blocked` — Checkbox or formula-backed field
- `Priority Score` — Number
- `Priority Recommendation` — Select: `P0`, `P1`, `P2`, `P3`
- `Priority Needs Review` — Checkbox
- `Priority Missing Inputs` — Rich text
- `Status Nudge Eligible` — Checkbox or formula-backed field

Relations:

- `Customers` -> `Customers`
- `Conversations` -> `Conversations`
- `Signals` -> `Signals`
- `Briefs` -> `Briefs`
- `Depends On` -> `Work Items`

Computed fields:

- `Completed On Time` — Formula
- `Ready Evidence Present` — Formula: `QA Present and Tests Present`

Suggested views:

- `Current Sprint`
- `Blocked`
- `Overdue`
- `Priority Review`
- `Needs Status Update`
- `Ready for Demo`

### Priority Cycles

Purpose:
Explicit planning window, usually a sprint. This is the authoritative cycle boundary for reminders and KPI calculation.

Required fields:

- `Name` — Title
- `Cycle ID` — Rich text, unique
- `Cycle Type` — Select: `Sprint`, `Week`
- `Start Date` — Date
- `End Date` — Date
- `Cycle Status` — Status: `Planned`, `Active`, `Closed`

Relations:

- `Work Items` -> `Work Items`
- `Signals` -> `Signals`
- `Briefs` -> `Briefs`
- `Readiness Gates` -> `Readiness Gates`
- `Bot Runs` -> `Bot Runs`

Computed fields:

- `Total Due In Sprint` — Rollup count of KPI-eligible items
- `Completed By Due Date` — Rollup sum
- `Sprint Completion Rate` — Formula percent

Suggested views:

- `Active Cycle`
- `Closed Cycles with KPI`
- `Cycle Audit`

### Readiness Gates

Purpose:
Bot-owned readiness summary for an active sprint. Phase 1 uses one aggregate `Demo Readiness` gate per active `Priority Cycle`.

Rule:
Exactly one `Demo Readiness` row per active `Priority Cycle`.

Required fields:

- `Name` — Title
- `Gate ID` — Rich text, unique
- `Gate Type` — Select: `Demo Readiness`
- `Priority Cycle` — Relation to `Priority Cycles`
- `GitHub CI State` — Select: `Passing`, `Failing`, `Unknown`
- `GitHub CI Checked At` — Date
- `Confirmed Status` — Select: `Healthy`, `At Risk`, `Blocked`
- `Last Evaluated At` — Date

Relations:

- `Work Items` -> `Work Items`
- `Signals` -> `Signals`
- `Briefs` -> `Briefs`
- `Bot Runs` -> `Bot Runs`

Computed fields:

- `Blocked Work Item Count` — Rollup count where `Computed Hard Blocked`
- `Missing QA Count` — Rollup count
- `Missing Tests Count` — Rollup count
- `Demo Ready` — Formula
- `Computed Status` — Formula: `Healthy`, `At Risk`, `Blocked`

Suggested views:

- `Current Demo Gate`
- `Blocked / At Risk`
- `Gate History`

### Briefs

Purpose:
Queue and history for daily briefs, sprint reminders, and status-update nudges.

Required fields:

- `Name` — Title
- `Brief ID` — Rich text, unique
- `Brief Type` — Select: `Daily Brief`, `Sprint Completion Reminder`, `Status Update Nudge`
- `Route` — Select: `Notion`, `DM`, `Notion+DM`, `Slack+Email`
- `Route To` — Rich text
- `Scheduled For` — Date
- `Status` — Status: `Draft`, `Queued`, `Sent`, `Suppressed`, `Failed`, `Acknowledged`
- `Message Body` — Rich text
- `Dedupe Key` — Rich text
- `Cooldown Until` — Date
- `Source Snapshot` — Rich text
- `Bot History URL` — URL

Relations:

- `Priority Cycle` -> `Priority Cycles`
- `Readiness Gate` -> `Readiness Gates`
- `Related Work Items` -> `Work Items`
- `Related Signals` -> `Signals`
- `Bot Runs` -> `Bot Runs`

Suggested views:

- `Today Queue`
- `Sent Today`
- `Suppressed`
- `Failures`

### Bot Runs

Purpose:
Append-only audit log of every evaluated action. This is the authoritative audit spine.

Granularity:
One row per evaluated action, with a shared `Batch ID` for the scheduler tick.

Required fields:

- `Name` — Title
- `Run ID` — Rich text, unique
- `Batch ID` — Rich text
- `Run Type` — Select
- `Rule Name` — Rich text
- `Occurred At` — Date
- `Confidence` — Number `0..1`
- `Result` — Select: `Read`, `Drafted`, `Sent`, `Suppressed`, `Review`, `No-op`, `Failed`
- `Source Row IDs` — Rich text
- `Target Row IDs` — Rich text
- `Delivery Target` — Rich text
- `Resulting Change` — Rich text
- `Suppression Reason` — Rich text
- `Error Message` — Rich text
- `Trigger Source` — Select: `Cron`, `Manual`, `Webhook`

Relations:

- `Conversation` -> `Conversations`
- `Customer` -> `Customers`
- `Signal` -> `Signals`
- `Work Item` -> `Work Items`
- `Priority Cycle` -> `Priority Cycles`
- `Readiness Gate` -> `Readiness Gates`
- `Brief` -> `Briefs`

Suggested views:

- `Today`
- `Needs Review`
- `Failures`
- `Suppressed Duplicates`
- `By Batch`

### People Directory

Purpose:
Routing table for Slack DMs and escalation emails.

Required fields:

- `Name` — Title
- `Active` — Checkbox
- `Slack ID` — Rich text
- `Email` — Email
- `Team` — Select or rich text

Suggested views:

- `Active People`
- `Missing Slack ID`
- `Missing Email`

## Runtime Rules

### Allowed Bot Writes

The bot may:

- auto-create `Signals`
- auto-create `Briefs`
- auto-create `Readiness Gates`
- auto-create `Bot Runs`
- write bot-owned fields on `Work Items`

The bot may not:

- create `Work Items`
- change `Status`
- change `Confirmed Priority`
- change `Confirmed Status`
- change `Blocked State`
- change `Due Date`
- change `Owner`
- change `QA Present`
- change `Tests Present`

### Work Item Activity Tracking

The bot is allowed to edit `Work Items`, but each bot touch must remain visible.

Rules:

- `Last Activity Source` is a dedicated property on `Work Items`
- when the bot edits a work item, it sets `Last Activity Source = Bot`
- on later runs, if the row changed and the change was not caused by the bot, the bot flips `Last Activity Source = Human`
- reminder-worthy bot actions also update `Latest Bot Note` and `Bot History URL`
- `Bot Runs` remains the full history

### What Counts As A Meaningful Update

A meaningful update is any change to:

- `Status`
- `Owner`
- `Due Date`
- `Blocked State`
- a human comment or update field
- or `Last Activity Source` changing to `Human` after a nudge

Bot touches alone do not reset the reminder chain.

### Staleness

A `Work Item` is stale when all of these are true:

- it is in the active sprint through explicit `Priority Cycle` relation
- it has an owner
- it is not `Backlog`, `Done`, or `Canceled`
- it has had no meaningful change for `2 business days`

Statuses eligible for stale nudges:

- `Ready`
- `In Progress`
- `Blocked`
- `In Review`

Items without due dates may still become stale if they are assigned and committed.

### Reminder And Escalation Cadence

Base cadence:

- `Nudge 1`: when the item first becomes stale or near due
- `Nudge 2`: `2 business days` later if unchanged
- `Escalation`: `2 business days` after that if still unchanged

Compressed cadence for due date within `1 business day`:

- send one immediate DM
- escalate the next business day if unchanged

Escalation flow:

1. first nudge -> DM owner
2. second nudge -> DM owner again
3. third unresolved nudge -> post to fixed Slack escalation channel and send one batched escalation email

If owner routing is missing:

- skip DM
- post to the escalation channel
- log `missing owner routing` in `Bot Runs`

### Slack And Email Routing

Daily brief recipients:

- DM to you
- post to the fixed Slack escalation channel
- save in Notion as a `Brief`

Escalation recipients:

- Slack post to one fixed escalation channel
- one batched email listing all escalated items in that run
- email goes to all active people in `People Directory`

No manager logic exists in Phase 1.

### Daily Brief Schedule

- weekdays only
- `08:30`
- timezone: `America/Toronto`

### Daily Brief Structure

The brief is active-sprint only.

Sections, in order:

1. sprint snapshot
2. top priorities
3. explicit blockers
4. due soon
5. stale items
6. soft blockers linked to active-sprint work
7. demo readiness

Section caps:

- `Top priorities`: 5
- `Blocked`: 10
- `Due soon`: 10
- `Stale`: 10
- `Soft blockers`: 5

If a section exceeds the cap, show `+N more`.

### Priority Scoring

All scoring is deterministic and uses only Notion fields.

Inputs:

- `Customer Impact` `0..5`
- `Revenue Impact` `0..5`
- `Demo Impact` `0..5`
- `Criticality` `0..5`
- `Effort` `1..5`

Formula:

```text
Priority Score =
round(
  100 * (
    0.35 * CustomerImpact/5 +
    0.25 * RevenueImpact/5 +
    0.20 * DemoImpact/5 +
    0.15 * Criticality/5 +
    0.05 * (5 - Effort)/5
  )
)
```

Priority bands:

- `80-100` -> `P0`
- `65-79` -> `P1`
- `45-64` -> `P2`
- `<45` -> `P3`

Missing data rule:

- if any scoring input is missing, do not compute a score
- set `Priority Needs Review = true`
- populate `Priority Missing Inputs`

The bot may write:

- `Priority Score`
- `Priority Recommendation`

The bot may not write:

- `Confirmed Priority`

### Signal Creation And Confidence

Allowed LLM-assisted tasks:

- extract `pain_point`
- extract `objection`
- extract `feature_request`
- extract `next_step`
- extract `soft_blocker`
- summarize text for briefs

Confidence policy:

- `>= 0.85` -> bot may auto-create the `Signal`
- `0.70 - 0.84` -> create in review state only
- `< 0.70` -> do not create outward-facing signal

`soft_blocker` is a dedicated `Signal Type`.

High-confidence `soft_blocker` signals may appear automatically in the daily brief only when linked to an active-sprint `Work Item`.

LLM outputs may never directly change:

- `Status`
- `Blocked State`
- `Confirmed Priority`
- `Confirmed Status`
- demo readiness canonical state

### Hard Blockers

A work item is hard-blocked only when explicitly reflected in workflow state.

Hard-blocked if any are true:

- `Status = Blocked`
- `Blocked State != Not Blocked`
- an explicit blocked dependency condition exists in Notion

Conversation-derived concerns may create `soft_blocker` signals, but never a hard blocker by themselves.

### Demo Readiness

Readiness evaluates only `Work Items` where `Demo Scope = true`.

There is exactly one `Demo Readiness` gate per active `Priority Cycle`.

Aggregate gate shape only:

- no child check rows in Phase 1
- aggregate counts plus relations back to failing work items

Readiness states:

- `Blocked` if any demo-scope item is hard-blocked
- `At Risk` if no demo-scope item is hard-blocked but any demo-scope item is missing `QA Present` or `Tests Present`
- `At Risk` if `GitHub CI State = Unknown`
- `Blocked` if `GitHub CI State = Failing`
- `Healthy` only when all demo-scope items are unblocked, all have `QA Present` and `Tests Present`, and mirrored CI is `Passing`

`QA Present` and `Tests Present` are separate human-only fields.

### KPI

Primary KPI:

```text
Sprint completion rate = completed by due date / total due in sprint
```

Rules:

- denominator = all non-canceled items in the active `Priority Cycle`
- numerator = items with `Completed At <= Due Date`

### Noise Suppression

Suppression truth lives in `Bot Runs`.

Convenience suppression fields live on `Briefs`:

- `Dedupe Key`
- `Cooldown Until`
- `Status`

Duplicate reminder suppression key:

```text
(rule_name, target_id, recipient_id, reason_signature)
```

Suppress if the same key was sent inside cooldown and none of these changed:

- `Status`
- `Due Date`
- `Owner`
- `Blocked State`
- `Priority Recommendation`
- `Priority Cycle`

Cooldowns:

- status-update nudge -> `2 business days`
- sprint reminder -> `1 business day`
- daily brief -> once per local day

## Email Escalation Format

Subject:

```text
[Sprint Escalation] <Work Item Name> needs update
```

Body should include:

- item name
- owner
- current status
- due date
- priority cycle
- why it escalated
- latest bot note
- Notion URL
- clear call to action to update or unblock the item in Notion

If multiple items escalate in one run, send one batched email listing them.

## Open Assumptions

These are now treated as locked assumptions for Phase 1 unless explicitly changed later:

- timezone is `America/Toronto`
- weekday daily brief time is `08:30`
- one `Demo Readiness` gate exists per active `Priority Cycle`
- `Readiness Gates` use aggregate fields, not child check rows
- bot auto-creates `Readiness Gates`, `Signals`, `Briefs`, and `Bot Runs`
- bot never auto-creates `Work Items`
- CI is mirrored into Notion
- `QA Present` and `Tests Present` are separate, human-only fields
