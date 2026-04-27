# .agents/ — AI Tooling Source Of Truth

This directory is the canonical home for Central Agent skills and shared project instructions.

- **Edit here:** `.agents/skills/*/SKILL.md`, `.agents/README.md`, and `AGENTS.md` at the repo root.
- **Skill shape:** `.agents/skills/<flat-skill-name>/SKILL.md`
- **Extra references:** keep them beside `SKILL.md` in the same skill folder.

## Skills

Legend: **[manual]** = only fires on explicit `$name` invocation. Read-only/reference skills can auto-trigger.

### Notion / Central Agent

- **central-agent-tables** — reference data for Central Agent Notion tables, lifecycle, ownership, and safe editing rules.
- **central-agent-status** — read-only workflow for listing and summarizing Work Items, People Directory, Briefs, Bot Runs, and routing health.
- **central-agent-update-work** **[manual]** — update human-owned Work Item fields such as Status, Due Date, QA Present, Tests Present, Blocked State, and priority inputs.

## Adding Or Editing A Skill

1. Create or edit `.agents/skills/<name>/SKILL.md`.
2. Use YAML frontmatter with `name` and `description`.
3. For any skill that mutates Notion, Slack, email, git, or files, add:
   - `disable-model-invocation: true`
   - `allow_implicit_invocation: false`
4. Keep skill names flat and hyphenated.
5. Keep reference docs in the same skill directory.

