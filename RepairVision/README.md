# Repair Cafe Hub
A repair cafe management application with a public website, QR check-in,
volunteer repair queues, session scheduling, reports and an admin dashboard.


## Team

**Team Name:** The Blacklisted

| Member            | Contribution   |
| ----------------- | -------------- |
| Priyansh Narang   | [Contribution] |
| Keertan Vasani    | [Contribution] |
| Adiseshan Ramanan | [Contribution] |
| Kanishk Rungta    | [Contribution] |


## Problem Statement

### The Problem

[Describe the problem being addressed, who is affected by it, and the context in which it occurs.]

### Why We Chose This Problem

[Explain why the team selected this problem and why solving it is important.]

## Solution

[Describe the proposed solution and how it addresses the problem.]

### Key Features

**New for Hack Day: RepairVision AI Diagnosis** ([docs/repairvision-ai.md](docs/repairvision-ai.md))

- Multimodal fault diagnosis with Google Gemma 4 (`gemma-4-26b-a4b-it`): describe a device and add an optional photo to get up to three possible faults, each with supporting and missing evidence, plus safe checks to try.
- Guided troubleshooting: one question at a time, up to five, with the diagnosis re-evaluated after each answer.
- Safety guardrails that work independently of the model, covering mains voltage, swollen batteries, microwaves, high voltage, smoke and burning.
- An **Analyze with RepairVision AI** button on each repair, which prefills the form without changing the repair record.

**Inherited from Circularity Repair Café Hub**

- Public website, QR check-in, volunteer repair queues, repair photos, session scheduling, reports and an admin dashboard.

## Innovation and Differentiation

[Explain what is innovative about the approach and how it differs from existing or conventional solutions.]

## Technical Implementation

### Architecture

[Add the system architecture or workflow Mermaid diagram here.]

### Technology Stack


| Category        | Technologies                |
| --------------- | --------------------------- |
| Frontend        | SvelteKit, TypeScript, Tailwind CSS |
| Backend         | Cloudflare Workers (TypeScript) |
| Database        | Cloudflare D1 (Drizzle ORM), Cloudflare R2 for photos |
| AI / ML         | Google Gemma 4 `gemma-4-26b-a4b-it` (RepairVision AI Diagnosis) |
| Infrastructure  | Cloudflare Workers, D1, R2 |
| APIs / Services | Google Gemini API (hosted Gemma 4); iFixit API (inherited repair guides) |


If a category or technology is not implemented in the project, specify `N/A` instead of leaving the field blank.

### How It Works

[Explain the major components of the system and how they interact.]

### Technical Decisions

[Explain important architectural, algorithmic, or engineering decisions made during development.]

## Implementation During the Hackathon

- **RepairVision AI Diagnosis.** This covers the Gemma 4 integration on the Worker, the diagnostic prompts, schema validation of the model's replies, safety guardrails, rate limiting, the AI Diagnosis page with guided multi-turn troubleshooting, the repair-page integration and the automated tests. See [docs/repairvision-ai.md](docs/repairvision-ai.md).

The repair café management application it builds on was imported from Circularity Repair Café Hub. That imported functionality is not described here as built during the event.

[Describe any further work the team completed during the Hack Day.]

### Team Contributions

- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]
- **[Member Name]:** [Contribution]

## Working Application

**Live Application:** [Live URL]

[Briefly explain how the deployed application can be accessed and what functionality can be tested.]

The submitted application should be functional and accessible through the provided link where applicable.

## Demo Video

**Demo Video:** [Video URL]

[Provide a short demonstration of the working project, covering the main user flow and important functionality.]

## Open Source and AI Usage

### AI / Models

- **Google Gemma 4 (`gemma-4-26b-a4b-it`), via the Google Gemini API:** powers RepairVision AI Diagnosis. It reads the device description and an optional photo, then returns structured fault hypotheses, safe checks and follow-up questions. It is called only from the Worker. The output is validated, passed through safety rules, and always shown as provisional and unverified. Gemma is released by Google under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).

### Open Source Components

- **[Library / Framework]:** [Purpose]
- **[Dataset]:** [Purpose]
- **[API / Service]:** [Purpose]

[Include relevant licenses, attribution, and acknowledgements for external components.]

## Setup and Usage

### Prerequisites

- [Requirement]
- [Requirement]

### Installation

```bash
git clone [repository-url]
cd [project-directory]
[installation-command]
```

### Environment Variables

The hub needs no variables to run. The AI Diagnosis feature needs a Gemini API key, stored as a Worker secret. For local development, copy `apps/cloudflare/.dev.vars.example` to `apps/cloudflare/.dev.vars`, which is git-ignored:

```env
GEMINI_API_KEY=            # required for AI Diagnosis; a secret, never commit it
GEMMA_MODEL=gemma-4-26b-a4b-it   # optional
GEMMA_THINKING_LEVEL=high        # optional: high | minimal
AI_DIAGNOSIS_HOURLY_LIMIT=30     # optional
```

For production, run `pnpm --filter @circularity/cloudflare exec wrangler secret put GEMINI_API_KEY`. The full list of settings is in [docs/repairvision-ai.md](docs/repairvision-ai.md#setup).



### Running the Project

```bash
[run-command]
```

### Usage

[Explain the basic steps required to use the project.]

## Devpost Submission

**Devpost Project:** [Devpost Project URL]

[Add the link to the team's Devpost submission. Ensure the Devpost project page is complete and contains the required project information, links, media, and team details.]

## Credits and License

### Credits

[Credit libraries, frameworks, datasets, models, APIs, contributors, and other external resources used.]

### License

[License name and/or link.]

## Submission Checklist

- [ ] Project title and description added
- [ ] All team members listed
- [ ] Problem clearly explained
- [ ] Reason for choosing the problem explained
- [ ] Solution and key features documented
- [ ] Innovation and differentiation explained
- [ ] Architecture included
- [ ] Technical implementation documented
- [ ] Work completed during the hackathon documented
- [ ] Team contributions documented
- [ ] Working application is functional
- [ ] Live application link added where applicable
- [ ] Demo video added
- [ ] AI and open-source components documented
- [ ] Setup and usage instructions tested
- [ ] Challenges and learnings documented
- [ ] Devpost submission completed
- [ ] Devpost link added
- [ ] Credits added
- [ ] License added
- [ ] Repository is organized and complete
### Device-owner accounts

Once the application owner finishes `/setup`, device owners can register at `/register`, sign in at `/login`, and use `/dashboard` ? `/diagnosis`. The homepage includes **Diagnose my device**. Public accounts have diagnosis access without staff or admin permissions. Diagnosis sessions are not saved.
