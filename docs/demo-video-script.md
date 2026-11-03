# ScamPilot AI - 2-Minute Demo Video Script

**Target length:** 2:00
**Format:** 1440x900 or 1920x1080 screen recording with browser UI and voice-over
**Demo URL:** `http://localhost:3000`

## Pre-Recording Checklist

1. Run `npm install`, `npx prisma db push`, and `npm run browser:install`.
2. Run `npm run dev` and warm both demo targets in a browser tab:
   - `http://localhost:3000/demo/phishing-bank`
   - `http://localhost:3000/demo/legit-announcement`
3. Run at least one analysis beforehand so the History page is not empty.
4. Confirm the Groq key is configured and that the home page loads without an error toast.
5. Close unrelated tabs, hide API keys, and disable notifications.
6. Set browser zoom to 90% so the investigation result and browser card fit cleanly.

## Second-by-Second Script

| Time | Action | Narration |
| --- | --- | --- |
| 0:00 | Open `http://localhost:3000` on the hero page. | "Every day, phishing messages try to turn urgency into clicks. ScamPilot AI gives people a safer way to investigate before they act." |
| 0:08 | Slowly scroll from the hero to the message input. | "It is a remote-control investigation agent: paste a suspicious message and keep control of every decision." |
| 0:15 | Click the sample card labeled **Browser demo: fake bank**. | "I'll load the built-in fake bank demo. This message claims the account is locked and pushes the user to verify within 24 hours." |
| 0:22 | Click **Analyze Message**. | "One click starts the investigation. ScamPilot extracts indicators and sends a read-only Playwright browser agent to the linked page." |
| 0:30 | When the result appears, point to the score ring and **85 / 100 High risk** badge. | "The result is 85 out of 100: high risk. This score is deterministic, so the same evidence always produces the same verdict." |
| 0:40 | Highlight the **Why this score** list. | "The evidence is visible: urgency language, a request for card number, PIN, and OTP, plus a suspicious link." |
| 0:50 | Scroll to **Remote browser investigation**. Point to the screenshot, **Password field detected** badge, domain, and **Forms on page 1**. | "Here is the remote-control evidence. Playwright opened the page in an isolated browser, captured this screenshot, and found a password field and a form on localhost. It never fills or submits anything." |
| 1:02 | Point to **Safe actions**. | "ScamPilot turns that evidence into concrete safe actions: do not click, do not share credentials, and report the message." |
| 1:10 | Click **Copy** on **Suggested reply**, then on **Report draft**. Let the button change to **Copied!** | "The reply and report drafts are ready to copy. The human reviews and decides what to send, so the agent supports judgment instead of replacing it." |
| 1:18 | Click **History** in the header. | "Every investigation is saved locally. History shows the newest cases first." |
| 1:28 | Point to the color-coded verdict badges, risk-score bars, and **View** buttons. | "Green is low risk, yellow is medium, and red is high. Each row keeps the date, message preview, verdict, and score for quick triage." |
| 1:38 | Click **Back to analyzer**. | "Under the hood, deterministic rules set the score, Groq explains the evidence in structured JSON, and Playwright gathers browser evidence safely." |
| 1:48 | Return to the hero or the completed result panel. | "ScamPilot AI makes suspicious messages easier to understand, easier to report, and safer to handle. Thank you for watching." |
| 2:00 | End recording. | Silence. |

## Optional B-Roll (if time allows)

- Briefly show the **Browser demo: safe page** sample scoring low, proving the system is not biased toward "high risk."
- Show the saved screenshot in `public/screenshots/` to reinforce that evidence is persisted.
- Show `GET /api/history` returning the newest 20 analyses.

## Recording Notes

- Do not describe an "Agent Timeline"; the current build uses the **Remote browser investigation** card. Use the on-screen labels exactly as written above.
- Keep the mouse movement slow and deliberate. Avoid scrolling past the evidence while speaking about it.
- If the first analysis takes longer than expected, cut the waiting portion in editing, but keep the result reveal.
- Re-record the copy-button moment if the temporary **Copied!** state is missed.
