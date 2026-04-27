# Central Agent Bot

## Retrieved Starter

Source: https://github.com/MinoThauros/TSBaseSetup/tree/main/BaseSetup

The linked `BaseSetup` folder is a minimal Node and TypeScript starter. It contains `package.json`, `package-lock.json`, `tsconfig.json`, `nodemon.json`, `src/app.ts`, `dist/app.js`, and an empty `README`.

I used the starter's intended shape: ESM TypeScript, `src/app.ts`, `dist`, `nodemon`, and a strict TypeScript config. The upstream `package.json` has trailing commas, so this project uses a valid equivalent instead of copying it byte-for-byte.

## Bot Shape

This project is intended to run as a Vercel Cron endpoint and communicate through Slack and email.

Initial modules:

- `api/cron.ts`: Vercel serverless endpoint protected by `CRON_SECRET`.
- `src/bot/runCentralAgent.ts`: central orchestration entry point.
- `src/integrations/slack.ts`: Slack Web API wrapper.
- `src/domain/entities.ts`: canonical domain entities from the spec.
- `src/planning/mvpPlan.ts`: local MVP phases and guardrails.
- `src/reporting/buildStartupReport.ts`: startup readiness summary.
- `scripts/check-env.ts`: verifies required environment variables are present.
- `scripts/check-slack.ts`: verifies the Slack token and channel can be used.

## Spec Summary

MVP from the Notion spec:

- Transcript to structured customer insights
- Daily brief
- Weekly priorities
- Blocker detection
- Demo readiness

Main source systems named in the spec:

- Notion
- Slack
- Email
- GitHub
- Sentry

Planned phases:

1. Foundations: schema, transcript ingestion, daily brief
2. Execution monitoring: commit mapping and blocker detection
3. Product insight: pain clustering and readiness dashboard

## Questions To Resolve

- `SLACK_BOT_TOKEN`: a Slack bot token beginning with `xoxb-`.
- `SLACK_CHANNEL_ID`: the target Slack channel ID.
- `CRON_SECRET`: any long random string used to protect `/api/cron`.
- `NOTION_TOKEN`: integration token for the Notion databases the bot will read and write.
- Email credentials once the provider is chosen.
- `GITHUB_TOKEN`: if commit and PR linking will be part of the MVP.
- `SENTRY_AUTH_TOKEN`: if blocker detection will consume Sentry directly in the MVP.

Product decisions still needed:

1. Which email provider should we use for outbound briefs: Resend or SMTP?
2. Which Slack destination is the first MVP target: one channel or direct messages?
3. Are transcript inputs coming from pasted notes, uploaded files, calendar transcripts, or a call recording provider?
4. Should the bot write directly into your existing Notion databases, or should we create dedicated CRM, conversations, and insights tables first?
5. What cron cadence should the MVP use in production?

## Slack App Setup Notes

The likely Slack scopes are:

- `chat:write` for posting messages.
- `channels:read` if the bot needs to inspect public channel metadata.
- `groups:read` if the target is a private channel.
- `im:write` if the bot will send direct messages.

After the Slack app is installed, invite the bot to the target channel before running `npm run check:slack`.
