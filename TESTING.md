# Testing approach

This project does not use Vitest, Playwright, Testing Library, or any
automated-test framework. Verification is **manual** and lives next to the
work as a `Testing` section inside each milestone in [`PLAN.html`](PLAN.html).

## Why

- MVP velocity over regression safety. The whole build is 2-4 weeks; manual
  checks are faster to author than tests for UI work that changes daily.
- Corporate SSL inspection makes Playwright browser downloads painful.
- The riskiest code (the entropy engine) is verified by the **simulation
  harness** ([`scripts/sim.ts`](scripts/sim.ts), built in M1.5) — a dev tool
  that auto-plays every character. That's not a test framework; it's a
  domain-specific evaluator, and it stays.

## What stays as automation

| Tool | Purpose | Why it survived the cut |
|---|---|---|
| `scripts/sim.ts` | Auto-plays every character through the engine, reports accuracy | The only objective measure of engine quality. Not a unit test. |
| `scripts/checks/*.ts` (M1.4) | Hand-crafted `tsx` validators for entropy math | A few one-shot scripts you run with `npx tsx` and eyeball — closer to a notebook than a test suite. |
| `scripts/validate-dataset.ts` (M1.2) | Schema checks on `data/characters.json`; gates `npm run build` | Catches malformed data before deploy. |

## Format of a `Testing` section

Every milestone gets a section that looks like this:

```html
<h4>Testing</h4>
<ol>
  <li><strong>Run:</strong> exact command the user pastes</li>
  <li><strong>Look for:</strong> the specific signal that proves it worked
      (a URL response, a console line, a UI element)</li>
  <li><strong>Red flag:</strong> the signal of failure — what would make
      you back out</li>
</ol>
```

Rules:
- Every step must be a thing **a human runs** and a thing **a human looks
  at**. No "run npm test"-style placeholders.
- Steps must be in execution order — if step 3 needs the dev server, step 1
  is "start the dev server."
- Include negative checks where they're cheap: "navigate to `/_nope`, see
  404." Catches half the smoke regressions.
- For UI milestones, prefer a single playthrough over a 12-step matrix.
  "Play one game to the end" beats checking every button in isolation.

## Pre-deploy acceptance playbook

M4.2's old "Playwright E2E suite" is replaced by a single Markdown
checklist (lives in `docs/acceptance-checklist.md`, written in M4.2). Run
it manually before each production deploy. Target: ~20 minutes.

The playbook covers: happy path, give-up path, share URL, mid-game resume,
offline play, keyboard-only nav, mobile viewport.
