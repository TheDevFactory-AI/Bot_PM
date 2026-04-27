#!/usr/bin/env node
// Sync .agents/ -> .claude/ so Claude Code sees the same skills + instructions.
// Canonical sources: AGENTS.md, .agents/README.md, .agents/skills/.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcSkills = resolve(repoRoot, ".agents/skills");
const srcAgents = resolve(repoRoot, "AGENTS.md");
const srcReadme = resolve(repoRoot, ".agents/README.md");
const dstSkills = resolve(repoRoot, ".claude/skills");
const dstClaude = resolve(repoRoot, "CLAUDE.md");
const dstReadme = resolve(repoRoot, ".claude/README.md");

if (!existsSync(srcSkills) || !existsSync(srcAgents) || !existsSync(srcReadme)) {
  console.error("[sync-ai] missing .agents/skills, .agents/README.md, or AGENTS.md; skipping");
  process.exit(0);
}

rmSync(dstSkills, { recursive: true, force: true });
mkdirSync(dirname(dstSkills), { recursive: true });
cpSync(srcSkills, dstSkills, { recursive: true });

writeFileSync(dstClaude, readFileSync(srcAgents));
writeFileSync(dstReadme, readFileSync(srcReadme));

console.log("[sync-ai] synced .agents/ -> .claude/ (skills, README, AGENTS.md -> CLAUDE.md)");
