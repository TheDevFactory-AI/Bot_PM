## General

This repo contains the Central Agent Phase 1 Slack/email/Notion operations bot.

Use `rg` for codebase search. Keep Notion and Slack mutations explicit and scoped. Do not send Slack/email or mutate Notion unless the user clearly asks for that action.

## Skills

Skills live under `.agents/skills/`. Use them when working with Central Agent Notion tables:

- `central-agent-tables`: reference data for tables, ownership, and lifecycle.
- `central-agent-status`: read-only table summaries and status reports.
- `central-agent-update-work`: manual-only updates to human-owned Work Item fields.

When adding or editing skills, follow the Tenpo-style layout: `.agents/skills/<flat-name>/SKILL.md`, with any extra reference docs next to that `SKILL.md`.

## Safety

Humans own Work Item status, owner, due date, priority inputs, blocker state, QA/test evidence, and demo scope.

The bot owns computed priority fields, latest bot notes, brief history, readiness evaluations, and run audit rows.

For action-y skills that mutate Notion, include both frontmatter guards:

```yaml
disable-model-invocation: true
allow_implicit_invocation: false
```
