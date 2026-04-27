# Design manager bot (AI product & operations assistant)

Source page:
`https://www.notion.so/timatech/Design-manager-bot-AI-product-operations-assistant-34bd1025e43b806ba7c0c96ffb31d28d`

Fetched on:
`2026-04-25`

## Purpose

The bot exists to solve five problems:

1. Customer truth gets lost.
2. Work is disconnected from outcomes.
3. Lack of operational pressure.
4. Manual prioritization overload.
5. Weak observability over execution.

The bot is a decision-support and enforcement system intended to reduce organizational entropy.

## High-Level Role

The bot acts as:

- Product ops assistant
- Engineering manager assistant
- Technical chief of staff
- Sales follow-up intelligence layer
- Execution monitor

Core functions:

1. Ingest reality
2. Structure reality
3. Surface decisions
4. Enforce follow-through

## Core Responsibilities

### Customer Intelligence

Inputs:

- Demo notes
- Discovery calls
- Voice memos
- Support feedback

Outputs:

- Customer records
- Pain points (ranked)
- Objections
- Feature requests
- Urgency signals
- Next steps

### Product Intelligence

Connects:

- Customer pain to roadmap
- Bugs to GTM risk
- Features to outcomes

### Delivery Monitoring

Tracks:

- Ticket age
- Blockers
- Regressions
- Release readiness

Inputs:

- Sentry error logs
- Features table
- Weekly priorities
- Support feedback

Outputs:

- Customer records
- Pain points (ranked)
- Objections
- Feature requests
- Urgency signals
- Next steps

### Weekly Cadence

Produces:

- Daily brief
- Weekly priorities
- Readiness reports

Delivery channels:

- Email
- Slack

## Non-Goals

The bot must not:

- Reprioritize without rules
- Spam notifications
- Hallucinate customer intent
- Replace source-of-truth tools
- Act as a general chatbot

## System Architecture

### Layer 1: Source Connectors

- Features dashboard
- GitHub
- Slack
- CRM
- Call transcripts

### Layer 2: Normalization

Standard entities:

- Work items
- Customers
- Commits
- Conversations

### Layer 3: Rules Engine

Handles:

- Overdue detection
- Blockers
- Readiness failures

### Layer 4: LLM Layer

Used for:

- Summaries
- Pain extraction
- Insight generation

### Layer 5: Output Layer

- Notion tables
- Email
- Slack

## Core Use Cases

- Post-call intelligence
- Daily brief
- Weekly prioritization
- Readiness monitoring
- Commit mapping
- Pain clustering

## Functional Modules

### Conversation Intelligence

Outputs:

- `pain_points[]`
- `objections[]`
- `feature_requests[]`
- `next_steps[]`

### Work Intelligence

- Classifies work
- Detects stale and blocked items
- Links tickets, commits, and customers

### Reliability Intelligence

- Detects regressions
- Computes release confidence

### GTM Readiness

- Determines demo readiness
- Flags blocking issues

### Startup Scoreboard

Metrics:

- Throughput
- Regression rate
- Critical flow health

## Canonical Data Model

### Customer

- `id`
- `company_name`
- `persona`
- `stage`
- `pains[]`

### Conversation

- `id`
- `customer_id`
- `summary`
- `pains[]`
- `next_steps[]`

### Work Item

- `id`
- `title`
- `status`
- `owner`
- `linked_customers[]`

### Commit

- `sha`
- `author`
- `linked_work_items[]`

### Readiness Gate

- `id`
- `name`
- `status`

## Priority Scoring

Priority is computed deterministically from:

- Customer impact
- Revenue impact
- Demo impact
- Criticality
- Effort

## Readiness Gates

### Demo Readiness

- Search works
- Pipeline works
- No blocker bugs

### Design Partner Readiness

- ATS flows stable
- Core workflows recoverable

### Distribution Readiness

- Repeatable onboarding
- Test coverage

## Outputs

### Slack

- Daily brief
- Alerts

### Jira via dedicated Notion table

- Ticket linking
- Health updates

### CRM

- Customer intelligence

### Dashboard

- KPI tracking

## Guardrails

- Noise suppression
- Confidence thresholds
- Source traceability
- No silent mutations
- Limited autonomy

## MVP Scope

Focus on:

- Transcript to insights
- Daily brief
- Weekly priorities
- Blocker detection
- Demo readiness

## Build Order

Step 1:

- Schema
- Transcript ingestion
- Daily brief

Step 2:

- Commit mapping
- Blocker detection

Step 3:

- Pain clustering
- Readiness dashboard

## Success Criteria

The system is successful when:

- Customer insights are structured
- Priorities reflect real pain
- Blockers are visible
- Demos are predictable
- Execution is tight
