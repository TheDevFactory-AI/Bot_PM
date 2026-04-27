export interface PlanPhase {
  name: string;
  outcomes: string[];
}

export const mvpScope = [
  "Transcript to structured customer insights",
  "Daily brief to Slack and email",
  "Weekly priorities summary from Notion",
  "Blocker detection across work and reliability signals",
  "Demo readiness assessment with explicit gates",
] as const;

export const planPhases: PlanPhase[] = [
  {
    name: "Phase 1 - Foundations",
    outcomes: [
      "Set up Notion schema for customers, conversations, and cross-call insights",
      "Ingest transcripts and normalize them into canonical entities",
      "Generate and send a daily brief",
    ],
  },
  {
    name: "Phase 2 - Execution Monitoring",
    outcomes: [
      "Map commits to work items",
      "Detect blockers, stale work, and readiness failures",
      "Tie regressions from Sentry to roadmap and GTM risk",
    ],
  },
  {
    name: "Phase 3 - Product Insight",
    outcomes: [
      "Cluster recurring pain points across conversations",
      "Produce a readiness dashboard and startup scoreboard",
      "Surface deterministic priority recommendations with traceability",
    ],
  },
];

export const keyGuardrails = [
  "Do not reprioritize without explicit scoring rules",
  "Suppress notification noise",
  "Require source traceability for generated claims",
  "Do not mutate source systems silently",
  "Keep autonomy limited to drafts, flags, and recommendations",
] as const;
