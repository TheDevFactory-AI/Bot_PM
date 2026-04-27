---
name: central-agent-plan-sprint
description: Intent-first workflow for creating Central Agent Priority Cycles and adding existing or new Work Items to a sprint. Use only when the user clearly asks to create, plan, replace, activate, or populate a sprint.
disable-model-invocation: true
allow_implicit_invocation: false
---

# Central Agent Plan Sprint

Plan sprint changes from user intent, then map that intent into Notion fields.

## Reference

Use `$central-agent-tables` first for database IDs, ownership rules, and lifecycle expectations.

This skill may mutate only after explicit approval:

- `Priority Cycles`: create a sprint/week row or update a cycle status.
- `Work Items`: create human-owned Work Items, update human-owned fields, or update the `Priority Cycle` relation.

Never update bot-owned Work Item fields. Never send Slack or email.

## Databases

- Priority Cycles database: `643a78e769624943b6fe43ac82826dd7`
- Priority Cycles data source: `collection://408e24e8-2b22-49ff-88f2-e3409d22a3f4`
- Work Items database: `2cad1025e43b80e0a0bbc8e83d5ed2f2`
- Work Items data source: `collection://2cad1025-e43b-803d-9458-000be54ad2e0`
- People Directory database: `34ed1025e43b8059ac12ed949c5c5c1f`
- People Directory data source: `collection://34ed1025-e43b-8043-9468-000bb5537045`

## Workflow

### 1. Ground The Current State

Before asking the user for details:

- Fetch Priority Cycles and identify active and recent cycles.
- Fetch Work Items if the request mentions adding, replacing, remaining, open, active, unfinished, or all work.
- Fetch People Directory when owner names are supplied or needed.
- Fetch schemas if exact property names, relation formats, or option names are uncertain.

Treat fetched rows as candidates until the user approves the final mutation plan.

### 2. Capture The Sprint Intent Brief

Ask plain-language intent questions before asking for Notion fields. Ask only for missing high-signal details:

- Goal: What is this sprint trying to accomplish?
- Timeframe: When should it start and end?
- Desired state: Should it be `Planned` or `Active` now?
- Work selection: What belongs in the sprint, and what should be excluded?
- Ownership defaults: Should items be assigned to someone, left as-is, or only assigned when obvious?
- Success evidence: What must be true by the end, such as demo scope, QA, tests, or acceptance notes?
- Existing cycle handling: Should any current active cycle remain active, close, or be replaced?

Accept concise, messy answers. Translate relative dates using the current date and state the exact dates in the preview.

### 3. Map Intent To Fields

After the intent brief, produce a derived Notion field plan.

For Priority Cycles:

- Sprint title -> `Cycle`
- Suggested ID -> `Cycle ID`, using `cycle_<slug>_<YYYY_MM_DD>` unless the user supplies one.
- Sprint or week intent -> `Cycle Type` (`Sprint` by default for sprint language)
- Desired state -> `Cycle Status`
- Exact dates -> `date:Start Date:start`, `date:Start Date:is_datetime`, `date:End Date:start`, `date:End Date:is_datetime`

For Work Items:

- Existing item selection -> append the target cycle to `Priority Cycle`
- New item title -> `Bug Title`
- Work status intent -> `Status`
- Owner names -> `Owner` relation after one clear People Directory match
- Schedule intent -> `date:Due Date:start` or `date:Week of:start`
- Evidence intent -> `QA Present`, `Tests Present`, `Demo Scope`, and acceptance-test text when explicitly supplied
- Priority intent -> `priority` (`high`, `medium`, `low`) or the exact visible priority field
- Impact/effort intent -> numeric `Customer Impact`, `Revenue Impact`, `Demo Impact`, `Criticality`, `Effort`

Keep omitted fields unchanged. Preserve existing `Priority Cycle` relation values unless the user explicitly asks to replace them.

### 4. Handle Active Cycles Safely

The bot expects exactly one active cycle, but planned future work may coexist with the current active cycle.

- If creating a `Planned` cycle, keep the current active cycle active by default.
- If creating an `Active` cycle while another active cycle exists, warn that only one active cycle is expected and ask whether to close the current active cycle.
- If the user asks to close the current active cycle while creating a `Planned` cycle, warn that this leaves no active sprint and require explicit reconfirmation.
- Never close or replace an active cycle implicitly.

### 5. Preview Bulk Work Before Mutation

When the user says `remaining`, `open`, `all`, `unfinished`, or similar:

- Interpret it as a candidate-selection request, not as approval to mutate.
- Default candidate statuses: `New`, `In Progress`, `Testing`, and `lingeringBugs`.
- Exclude `Resolved`, `Released`, `Won't Fix`, and archived rows unless the user explicitly includes them.
- Group the preview by `Status`, then by `Classification` when useful.
- Show counts, representative titles, and any odd rows with missing titles, existing cycle links, blockers, owners, or stale dates.
- Ask for approval after the grouped preview.

For large candidate sets, summarize groups first and offer to show the full list before mutation. Do not bulk update without naming the exact count and selection rule.

### 6. Confirm Before Mutating

Before any Notion create/update call, show a concise mutation plan and ask for explicit approval.

Include:

- Sprint row to create or update.
- Current active-cycle change, if any.
- Work Item selection rule and exact count.
- Fields and values to set.
- Any fields intentionally left blank or preserved.

Use approval phrasing tied to the preview, such as `Approve creating this planned sprint and attaching these 35 candidate items`.

### 7. Apply Notion Changes

Only after explicit approval:

- Create/update the Priority Cycle using exact schema property names.
- Update existing Work Items using only human-owned fields and `Priority Cycle`.
- Create new Work Items only when the user asked for new items and confirmed their mapped fields.
- Do not update bot-owned fields.
- Do not send Slack or email.
- Do not change schemas.

### 8. Report Back

Reply with:

- Created or updated sprint URL.
- Active-cycle status change, if any.
- Work Item count attached or created.
- Links for changed Work Items, or grouped links when the set is large.
- Any skipped or ambiguous rows.

## Safety Rules

- No Notion mutation before explicit approval.
- No Slack or email sends.
- No schema changes.
- No bot-owned Work Item field updates.
- No implicit active-cycle closure.
- No bulk update without a grouped preview and exact selection rule.
