---
name: central-agent-update-work
description: Update human-owned fields on Central Agent Notion Work Items, such as marking work In Progress, Testing, Resolved, setting Due Date, QA Present, Tests Present, Blocked State, Demo Scope, or priority inputs. Only use when the user explicitly asks to mutate a Work Item.
disable-model-invocation: true
allow_implicit_invocation: false
---

# Central Agent Update Work

Update one Work Item safely.

## Reference

Use `$central-agent-tables` first for table IDs and ownership rules.

## Allowed Fields

Only update human-owned Work Item fields:

- `Status`
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

Never update bot-owned fields in this skill.

## Steps

### 1. Find the Work Item

Use the Work Items database:

- Database ID: `2cad1025e43b80e0a0bbc8e83d5ed2f2`

If the user gives a page URL or page ID, fetch that page directly.

If the user gives a title, search/query Work Items and require one exact or obvious match. If multiple rows match, show the candidates and ask which one.

### 2. Confirm The Change

If the user did not explicitly give an exact field and value, ask for confirmation.

Examples:

- `Mark "Auto-add candidate to pipeline fails" as In Progress?`
- `Set QA Present = true for "Search candidate, jobs, companies, contact from search bar"?`

### 3. Update

Use Notion page update properties only for the requested human-owned fields.

Common updates:

- Status: `{ "Status": "In Progress" }`
- Due date: `{ "date:Due Date:start": "YYYY-MM-DD", "date:Due Date:is_datetime": 0 }`
- Checkbox: `QA Present` / `Tests Present` / `Demo Scope` as `__YES__` or `__NO__`
- Number inputs: use JavaScript numbers, not strings.

Use exact Notion option names from the database. Do not invent new statuses unless the user explicitly asks to add/change schema.

### 4. Report Back

Reply with:

- Work Item name
- Field(s) changed
- New value(s)
- Page URL

