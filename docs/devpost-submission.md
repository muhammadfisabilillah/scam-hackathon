# DevPost Submission - ScamPilot AI

## Project Name

ScamPilot AI

## One-Line Pitch

An AI-powered remote investigator that safely analyzes suspicious messages and links, controls a sandbox browser to collect evidence, and generates clear scam-risk reports.

## Description

Phishing and social engineering attacks exploit speed and trust. A convincing bank alert, delivery notice, or fake login page can push someone to act before they have time to verify the sender or the destination. ScamPilot AI gives users a calm, evidence-based second opinion.

Users paste a suspicious message. ScamPilot extracts links, contact details, urgency cues, and requests for sensitive information, then produces a transparent deterministic risk score. For linked pages, a read-only Playwright browser agent opens the destination in an isolated headless browser, captures a screenshot, and records the final domain, page title, form count, and whether a password field is present. Groq's LLM converts this structured evidence into a plain-language explanation, safe next steps, and ready-to-send reply and report drafts.

The LLM never decides the score. It only explains deterministic evidence, keeping results reproducible and auditable while a human stays in control. Every finding is visible, drafts are copyable, and analyses are stored in a local history.

ScamPilot AI was built for the Remote Control AI hackathon with Next.js 15, TypeScript, Tailwind CSS, Prisma, SQLite, Playwright, Groq SDK, and Zod. It is a practical, privacy-conscious investigation assistant that makes suspicious messages easier to understand and safer to handle.

## How AI Is Used

- **Groq structured reasoning:** Converts redacted message text, deterministic risk reasons, extracted indicators, and browser evidence into a validated JSON explanation with safe actions and draft responses. The model never sets the risk score.
- **Playwright evidence gathering:** A controlled, read-only headless Chromium session visits the linked page, collects metadata and form/password-field signals, and captures a screenshot. It does not submit forms, click buttons, or download files.
- **Deterministic scoring:** A transparent rule engine produces the final 0-100 score and verdict, so the same evidence always produces the same result.

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Playwright
- Groq SDK
- Zod

## What's Next

- Scan multiple URLs per message with prioritized, bounded browser sessions.
- Harden SSRF protection with DNS resolution, redirect validation, and network egress controls.
- Ship a browser extension that lets users submit suspicious messages and links directly from their inbox.
- Add a human approve/edit workflow before drafts are copied or shared.
- Move screenshots to persistent object storage for multi-user deployments.
