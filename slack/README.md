# Slack App Manifest for Phase 1

This folder contains the Slack app manifest for the Phase 1 bot in this repo:

- [`manifest.phase1.yaml`](/Users/artyrakoto/Development/Mino/TDF/central_agent/slack/manifest.phase1.yaml)

The manifest is intentionally narrow. It only covers what the current code does:

- verify auth with `auth.test`
- verify the fixed escalation channel with `conversations.info`
- open DMs with `conversations.open`
- send messages with `chat.postMessage`
- verify DM targets with `users.info`

It does **not** include slash commands, event subscriptions, interactivity, Socket Mode, or an app-level token because the Phase 1 bot does not use them.

## Create the Slack app

1. Go to [Your Slack Apps](https://api.slack.com/apps).
2. Click **Create New App**.
3. Choose **From an app manifest**.
4. Pick the target workspace.
5. Paste in the contents of [`manifest.phase1.yaml`](/Users/artyrakoto/Development/Mino/TDF/central_agent/slack/manifest.phase1.yaml).
6. Create the app, then install it to the workspace.

After installation, Slack will issue the bot token used by this repo.

## Env vars this repo expects

Primary env vars used by the current code:

- `SLACK_BOT_TOKEN`
- `SLACK_ESCALATION_CHANNEL_ID`
- `SLACK_BRIEF_DM_USER_ID`

Compatibility fallbacks also exist in the Slack config helper:

- `SLACK_CHANNEL_ID` as a fallback for `SLACK_ESCALATION_CHANNEL_ID`
- `DAILY_BRIEF_SLACK_USER_ID` or `SLACK_DM_USER_ID` as fallbacks for `SLACK_BRIEF_DM_USER_ID`

For new setup, prefer the three primary env vars.

## How to get each value

### `SLACK_BOT_TOKEN`

In the Slack app config:

1. Open **OAuth & Permissions**.
2. Copy the **Bot User OAuth Token**.
3. It should start with `xoxb-`.

### `SLACK_ESCALATION_CHANNEL_ID`

Use the fixed channel where the bot should post the daily brief and team escalations.

Good ways to get the ID:

- Open the channel in Slack and copy its link. The last path segment is the channel ID, such as `C12345678` for a public channel or `G12345678` for a private channel.
- Or open the channel details and use Slack's copy-link/share flow.

Important:

- This manifest does **not** request `chat:write.public`.
- Invite the app to the escalation channel before running checks.
- If the escalation channel is private, the app must also be invited there.

### `SLACK_BRIEF_DM_USER_ID`

Use the Slack member ID for the one fixed user who should receive the daily brief by DM.

Good ways to get the ID:

- Open the person's profile in Slack and use **Copy member ID**.
- Or use a Slack profile/share flow that reveals the `U...` user ID.

The same kind of `U...` member ID should be stored in Notion `People Directory` rows for work-item owner DMs.

## Recommended post-install checks

Once the env vars are set:

1. Invite the app to the escalation channel.
2. Run:

```bash
npm run check:slack
```

That script verifies:

- bot auth works
- the configured escalation channel can be resolved
- the configured daily-brief DM user can be looked up

## Chosen OAuth scopes

- `chat:write`  
  Needed for `chat.postMessage`.

- `im:write`  
  Needed for `conversations.open` when opening 1:1 DMs.

- `users:read`  
  Needed for `users.info` when verifying the configured DM user.

- `channels:read`  
  Needed for `conversations.info` on a public escalation channel.

- `groups:read`  
  Needed for `conversations.info` if the escalation channel is private.

Not included:

- `chat:write.public` because Phase 1 can work by inviting the app to the fixed channel
- `users:read.email` because the bot never reads Slack email fields
- `im:read`, `mpim:*`, `channels:manage`, `groups:write`, commands, events, interactivity, or Socket Mode because the current code does not use them
