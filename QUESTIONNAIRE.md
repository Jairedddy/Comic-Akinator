# Superhero Akinator — Requirements Questionnaire

> **Instructions for you (the user):** Please answer every question below as completely as possible. For each question I have provided multiple-choice options and marked my **recommendation** in **bold with a ⭐**. You may pick a recommended option, choose another, combine options, or write a custom answer. Where useful, add context or constraints I should know. Once you finish answering, I will produce the full end-to-end implementation plan in my next response.

---

## 1. Product Scope & Vision

**1.1 What is the primary purpose of this app?**
- A) A fun side project / portfolio piece ⭐ **Recommended** (lets us prioritize polish + deployability over scale)
- B) A commercial product targeting fan communities
- C) A learning vehicle to practice a specific stack
- D) A demo for a client / interview piece

**1.2 What does "success" look like 3 months after launch?**
- A) A small but loyal user base playing weekly
- B) Viral shareable moments on social media ⭐ **Recommended** (drives the shape of the result screen + share features)
- C) Used as a portfolio showcase only
- D) Revenue / subscriptions

**1.3 Universe scope — final boundary?**
- A) Marvel comics + DC comics only (canonical print/digital comics characters)
- B) Marvel + DC across **all media** (comics, MCU films, DCEU films, animated series, video games) ⭐ **Recommended** (richer trait set, more recognisable characters)
- C) Only the most well-known ~300 characters from each
- D) Everything including obscure / one-shot characters

**1.4 Approximately how many characters should the game know?**
- A) ~200 (top tier only — fast to build, less surprising)
- B) ~500–800 ⭐ **Recommended** (sweet spot for variety vs. data quality)
- C) ~1,500+
- D) As many as the source data provides (3,000+)

---

## 2. Target Users

**2.1 Who is the primary audience?**
- A) Casual fans who know mainstream characters
- B) Hardcore comics fans who know deep cuts
- C) Both, with adaptive difficulty ⭐ **Recommended**
- D) Kids / family-friendly only

**2.2 Expected age range?**
- A) 8–14
- B) 13–35 ⭐ **Recommended**
- C) All ages, no content gating
- D) Adult-oriented (mature themes allowed)

**2.3 Geographic / language scope at launch?**
- A) English only ⭐ **Recommended** (MVP)
- B) English + Spanish
- C) Multi-language from day one (i18n built in)
- D) English now, design for i18n later

---

## 3. Gameplay Flow

**3.1 Core game loop — answer options the user can give?**
- A) Yes / No
- B) Yes / No / Don't know
- C) Yes / No / Probably / Probably not / Don't know ⭐ **Recommended** (classic Akinator feel; better inference)
- D) Yes / No / Maybe / Skip

**3.2 How many questions before the app guesses?**
- A) Fixed 20 questions
- B) Adaptive — guesses when confidence is high enough (typically 15–25) ⭐ **Recommended**
- C) Unlimited until guessed
- D) User can set a cap

**3.3 What happens when the app is confident enough?**
- A) It guesses one character; if wrong, it keeps asking
- B) It guesses, and if wrong asks user to reveal + adds to learning queue ⭐ **Recommended**
- C) It guesses top 3 and lets user pick
- D) Guess once, game ends regardless

**3.4 What if the app fails to guess?**
- A) "I give up" — ask user to reveal the character ⭐ **Recommended**
- B) Show top 5 closest guesses
- C) Offer to keep playing
- D) All of the above as a choice screen

**3.5 Should the game support a "think of a character with hints" / reverse mode?**
- A) No, single mode only ⭐ **Recommended for MVP**
- B) Yes — app describes, user guesses
- C) Yes — multiplayer guessing
- D) Later phase

---

## 4. Question / Inference Logic

**4.1 Preferred inference engine approach?**
- A) Decision tree (hand-crafted) — predictable, hard to scale
- B) Information-gain / entropy-based question selection over a trait matrix ⭐ **Recommended** (classic Akinator-style, transparent, deployable, no ML training needed)
- C) Bayesian network with probabilistic traits
- D) LLM-driven dynamic question generation (uses Claude/GPT each turn)
- E) Hybrid: entropy-based + LLM tie-breakers for ambiguous traits

**4.2 How should traits be modeled?**
- A) Strict booleans only (has cape: yes/no)
- B) Booleans + probabilistic weights (0.0–1.0) per character per trait ⭐ **Recommended** (handles ambiguity, alternate versions)
- C) Tags only (set membership)
- D) Free-text attributes + embeddings

**4.3 How should the system handle "I don't know" answers?**
- A) Ignore the question entirely
- B) Treat as soft negative
- C) Use probabilistic update with reduced weight ⭐ **Recommended**
- D) Penalize all characters equally

**4.4 Should the system learn from games (improve over time)?**
- A) No — static dataset ⭐ **Recommended for MVP**
- B) Yes — log answers and adjust weights automatically
- C) Yes — but only with admin review (queued suggestions)
- D) Full crowdsourcing like real Akinator

**4.5 How to handle alternate versions (Ultimate Spider-Man vs 616 Spider-Man, Earth-2 Superman, etc.)?**
- A) Treat each version as a separate character
- B) One canonical entry per character with version tags ⭐ **Recommended** (cleaner UX, traits can differ per version internally)
- C) Only canonical (mainline) versions
- D) Group as one but allow user to specify "which version"

**4.6 Should teams (Avengers, Justice League, X-Men) be guessable entities?**
- A) No, only individual characters ⭐ **Recommended for MVP**
- B) Yes, teams are first-class
- C) Teams appear only as traits ("member of Avengers")
- D) Phase 2 feature

---

## 5. Data Source & Schema

**5.1 Preferred data source strategy?**
- A) Use a public API live (Marvel API, Superhero API, Comic Vine)
- B) Pull from a public source once and store locally as normalized JSON/DB ⭐ **Recommended** (offline reliable, fast, fully controlled, easier to enrich with traits)
- C) Build the dataset manually from Wikipedia/Fandom scraping
- D) Mix: API for character images/bio, hand-curated for traits

**5.2 Specific source preference?**
- A) Superhero API (superheroapi.com) — good powers/stats
- B) Marvel Developer API + DC scraping (legal-ish, official Marvel images)
- C) Comic Vine API (rich metadata, needs key)
- D) Kaggle Marvel/DC datasets + Fandom wiki enrichment ⭐ **Recommended** (no API key dependency, redistributable, broad coverage)
- E) Combine multiple, deduplicate

**5.3 What trait categories must the question system know about?** (multi-select recommended — pick all that apply)
- A) Universe (Marvel/DC) ⭐
- B) Alignment (hero/villain/antihero) ⭐
- C) Gender ⭐
- D) Species (human, mutant, alien, god, AI, etc.) ⭐
- E) Powers (flight, super strength, telepathy, magic, etc.) ⭐
- F) Equipment (suit, weapon, vehicle) ⭐
- G) Team affiliations ⭐
- H) First appearance era (Golden/Silver/Bronze/Modern) ⭐
- I) Hair / eye / skin color
- J) Costume color scheme ⭐
- K) Secret identity / civilian name known
- L) Notable relatives
- M) Origin city / planet
- N) Movie/TV adaptations exist
- O) Death/resurrection history
- P) Other (specify)

⭐ **Recommended:** A, B, C, D, E, F, G, H, J — strong inference power without overwhelming data work.

**5.4 Should each character have an image?**
- A) Yes — required, used on result screen ⭐ **Recommended**
- B) Yes — optional
- C) No images (text-only)

**5.5 Image licensing approach?**
- A) Use official Marvel API images (Marvel only, terms attached)
- B) Use Fandom / Wikipedia fair-use thumbnails ⭐ **Recommended for non-commercial portfolio**
- C) Commission/illustrate stylized icons (most legal-safe; expensive)
- D) Silhouettes only until guessed (also helps gameplay reveal)

---

## 6. UX / UI

**6.1 Overall visual style?**
- A) Comic-book / halftone / Ben-Day dots, bold panels ⭐ **Recommended** (perfect thematic fit, very shareable)
- B) Minimalist / modern (Linear, Vercel aesthetic)
- C) Dark cinematic (MCU/Snyder-verse feel)
- D) Playful cartoon (kid friendly)
- E) Neon / cyberpunk

**6.2 Branding — does the app need a name + logo?**
- A) Yes, I will provide a name
- B) Yes, please suggest names + a wordmark direction ⭐ **Recommended**
- C) No branding for now

**6.3 Question screen layout?**
- A) Big question text + 3–5 large answer buttons ⭐ **Recommended** (works mobile + desktop, accessible)
- B) Card-stack swipe interface (Tinder-style)
- C) Conversational chat bubble UI
- D) Comic panel per question

**6.4 Genie / mascot character?**
- A) No mascot ⭐ **Recommended for MVP** (avoid IP issues, focus on polish)
- B) Original mascot character (commissioned)
- C) Animated abstract avatar (orb / spark)
- D) Yes, design later

**6.5 Animation & motion polish level?**
- A) None / minimal CSS transitions
- B) Tasteful Framer Motion micro-interactions ⭐ **Recommended**
- C) Heavy animations, page transitions, particle effects
- D) Lottie / animated genie reactions per answer

**6.6 Accessibility level?**
- A) Basic semantic HTML
- B) WCAG 2.1 AA target ⭐ **Recommended** (keyboard nav, ARIA, contrast, motion-reduce)
- C) WCAG AAA
- D) Not a priority

**6.7 Dark mode?**
- A) Light only
- B) Dark only (matches comic-cinematic vibe)
- C) Both with auto + manual toggle ⭐ **Recommended**

---

## 7. Platform & Devices

**7.1 Primary platform?**
- A) Responsive web app (mobile + desktop) ⭐ **Recommended** (max reach, single codebase, easiest deploy)
- B) Mobile-first PWA
- C) Native iOS + Android
- D) Desktop only

**7.2 Should the app work offline?**
- A) No
- B) PWA with offline game cache ⭐ **Recommended** (small dataset, makes app feel premium)
- C) Fully offline

**7.3 Minimum supported screen size?**
- A) 320px (old iPhones)
- B) 360px ⭐ **Recommended**
- C) 390px+
- D) Tablet & up only

---

## 8. Tech Stack Preferences

**8.1 Frontend framework?**
- A) Next.js (React) — App Router ⭐ **Recommended** (SSR/SSG/edge ready, easy Vercel deploy, great DX)
- B) Vite + React SPA
- C) SvelteKit
- D) Vue / Nuxt
- E) No preference — pick best

**8.2 Styling?**
- A) Tailwind CSS + shadcn/ui ⭐ **Recommended** (fast, modern, accessible primitives, matches comic-book theming)
- B) CSS Modules
- C) Styled Components / Emotion
- D) Vanilla CSS

**8.3 Backend approach?**
- A) Next.js API routes / Server Actions (monorepo) ⭐ **Recommended** (single deploy, low ops)
- B) Separate Node/Express API
- C) Python FastAPI
- D) Go service
- E) Serverless functions (Vercel/Netlify)
- F) No backend — pure client-side inference with bundled dataset

**8.4 Database?**
- A) None — bundle dataset as JSON in the app ⭐ **Recommended for MVP** (small dataset, fast, free)
- B) SQLite + Prisma (file based)
- C) Postgres (Supabase / Neon) for users + game logs
- D) MongoDB
- E) Redis for game session state only

**8.5 Inference engine implementation?**
- A) Custom TypeScript module (entropy-based) ⭐ **Recommended**
- B) Python microservice
- C) Use a third-party engine
- D) LLM API call per turn (Claude/GPT)

**8.6 State management?**
- A) React useState + URL state ⭐ **Recommended** (game state is simple)
- B) Zustand
- C) Redux Toolkit
- D) Jotai / Recoil

---

## 9. Authentication & User Accounts

**9.1 Do users need accounts?**
- A) No accounts — anonymous play with localStorage ⭐ **Recommended for MVP**
- B) Optional accounts for leaderboard / history
- C) Required accounts
- D) Anonymous + optional sign-in for cloud sync

**9.2 If accounts: provider?**
- A) Email/password
- B) Google + GitHub OAuth via Auth.js (NextAuth) ⭐ **Recommended if accounts are added**
- C) Magic link only
- D) Clerk / Supabase Auth managed

---

## 10. Game Modes & Features

**10.1 Game modes for MVP?** (multi-select)
- A) Classic single-player guess ⭐ **Recommended for MVP**
- B) Daily challenge (same character for everyone, ranked guesses)
- C) Speedrun (fewest questions possible)
- D) Themed packs (X-Men only, Bat-Family only)
- E) Two-player pass-and-play

⭐ **Recommended MVP:** A only. Phase 2: B, D.

**10.2 Leaderboards?**
- A) None ⭐ **Recommended for MVP**
- B) Local-only stats (your own history)
- C) Global leaderboard for daily challenge (Phase 2)
- D) Friend leaderboards

**10.3 Shareable result screen?**
- A) No
- B) Yes — image generated server-side for social sharing ⭐ **Recommended** (huge for virality goal)
- C) Yes — copyable text only (Wordle-style emoji grid)
- D) Both

**10.4 Save progress / resume mid-game?**
- A) No — quick games only
- B) Yes — localStorage auto-resume ⭐ **Recommended**
- C) Cloud-synced resume

**10.5 Game history / stats for the user?**
- A) None
- B) Last N games shown locally ⭐ **Recommended**
- C) Full historical stats with charts

---

## 11. Admin / Content Tools

**11.1 Admin dashboard for editing the character database?**
- A) None — edit JSON directly in the repo ⭐ **Recommended for MVP** (you control updates via PRs)
- B) Simple password-protected admin UI to edit traits + add characters
- C) Full CMS (Sanity / Payload / Directus)
- D) Headless CMS + preview deploys

**11.2 Should users be able to suggest corrections / new characters?**
- A) No ⭐ **Recommended for MVP**
- B) Yes, feedback form → email/Slack/Linear
- C) Yes, queued for admin review
- D) Open crowdsourcing

**11.3 Content moderation needed?**
- A) No user-generated content, no moderation needed ⭐ **Recommended** (matches MVP scope)
- B) Light (suggestion box only)
- C) Heavy (chat/comments)

---

## 12. Analytics & Telemetry

**12.1 Analytics provider?**
- A) None
- B) Plausible / Umami (privacy-friendly) ⭐ **Recommended**
- C) Google Analytics 4
- D) PostHog (product analytics + session replay)
- E) Mixpanel

**12.2 What should we measure?** (multi-select)
- A) Daily / weekly active users ⭐
- B) Average questions per game ⭐
- C) Win rate (app guessing correctly) ⭐
- D) Most asked questions
- E) Drop-off points
- F) Share-button clicks ⭐
- G) Character "miss" frequency (which characters defeat the app) ⭐
- H) Device / browser breakdown

⭐ **Recommended:** A, B, C, F, G — directly informs gameplay tuning.

**12.3 Error monitoring?**
- A) None
- B) Sentry free tier ⭐ **Recommended**
- C) LogRocket
- D) Self-hosted

---

## 13. Monetization (Optional)

**13.1 Will the app be monetized?**
- A) No, free forever ⭐ **Recommended given "portfolio/viral" intent**
- B) Display ads (AdSense)
- C) "Buy me a coffee" / donations link
- D) Premium themed packs
- E) Decide after launch

---

## 14. Legal & Compliance

**14.1 Legal disclaimer about Marvel/DC trademarks?**
- A) Footer disclaimer + fan-project notice ⭐ **Recommended**
- B) Full ToS + privacy page
- C) None
- D) Both A and B ⭐ **also recommended if any account/analytics is added**

**14.2 Privacy policy needed?**
- A) No (no PII collected)
- B) Yes — required if analytics or accounts are added ⭐ **Recommended**

**14.3 Cookie / consent banner?**
- A) Not needed (no tracking) ⭐ **Recommended if using Plausible**
- B) Yes — GDPR/CCPA compliant banner

---

## 15. Deployment & Hosting

**15.1 Hosting target?**
- A) Vercel ⭐ **Recommended** (Next.js native, free tier, edge, simple)
- B) Netlify
- C) Cloudflare Pages + Workers
- D) AWS (Amplify / S3+CloudFront / ECS)
- E) Self-hosted VPS (Hetzner, DigitalOcean)
- F) Railway / Fly.io

**15.2 Domain?**
- A) Use Vercel's free *.vercel.app subdomain (MVP launch)
- B) Buy a custom domain ⭐ **Recommended** (e.g., capedguesser.app, panelpsychic.com — names TBD)
- C) Subdomain of an existing site

**15.3 CI/CD?**
- A) Vercel's built-in git integration ⭐ **Recommended**
- B) GitHub Actions custom pipeline
- C) Manual deploys

**15.4 Environments?**
- A) Production only
- B) Production + preview deploys on PRs ⭐ **Recommended** (Vercel does this automatically)
- C) Prod + staging + preview

---

## 16. Testing Strategy

**16.1 Testing level expected?**
- A) No tests
- B) Light: unit tests for inference engine only ⭐ **Recommended MVP minimum** (the engine is the riskiest piece)
- C) Medium: unit + integration + a few E2E happy paths ⭐ **Recommended for polish**
- D) Heavy: unit + integration + E2E + visual regression

**16.2 Tools?**
- A) Vitest + React Testing Library + Playwright ⭐ **Recommended**
- B) Jest + Cypress
- C) Other

**16.3 Special tests for the inference engine?**
- A) Just unit tests on entropy math
- B) Simulation harness: play N games against every character automatically and report guess accuracy + avg questions ⭐ **Recommended** (this is gold for tuning + a great portfolio talking point)
- C) Both A and B

---

## 17. Performance Targets

**17.1 Target Lighthouse scores at launch?**
- A) 80+ across the board
- B) 90+ across the board ⭐ **Recommended**
- C) 95+ across the board
- D) Don't care

**17.2 Acceptable time-to-first-question?**
- A) <1s ⭐ **Recommended**
- B) <2s
- C) <3s
- D) Doesn't matter

**17.3 Bundle size budget?**
- A) <100kb JS
- B) <200kb JS + dataset ⭐ **Recommended**
- C) <500kb
- D) No budget

---

## 18. Polish Level Expected

**18.1 Define "polished" for this project:** (pick what applies)
- A) Looks professional, no obvious bugs, responsive ⭐ **Recommended baseline**
- B) Above + delightful micro-interactions, sound effects, share screen ⭐ **Recommended target**
- C) Above + onboarding, empty states, error states, edge case handling ⭐ **Recommended stretch**
- D) "App Store launch" level — everything in C plus marketing site

**18.2 Sound effects / music?**
- A) None
- B) Subtle SFX on button taps + reveal (mutable) ⭐ **Recommended**
- C) Background music + SFX
- D) Voice acting

---

## 19. MVP vs Phase 2+ Scope

**19.1 Which features are MUST-HAVE for MVP (v1.0)?** (multi-select, your call — my picks below)
- ⭐ Classic single-player guessing
- ⭐ ~500 characters, entropy-based engine
- ⭐ Responsive web app, comic-book theme, dark mode
- ⭐ Shareable result screen
- ⭐ Local game history (no accounts)
- ⭐ Analytics + error monitoring
- ⭐ Deployed on Vercel with custom domain
- Daily challenge (could be MVP if quick)
- Leaderboards
- Themed packs
- Accounts
- Admin CMS
- i18n
- PWA / offline
- Suggestion form

**19.2 Which features are Phase 2 (v1.1–1.5)?** Please confirm or change my defaults above.

**19.3 Which are Phase 3 (long-term)?** Multiplayer, mobile native apps, monetization, ML-based learning, etc.

---

## 20. Constraints

**20.1 Budget?**
- A) $0 (free tiers only) ⭐ **Recommended baseline — fully achievable**
- B) <$50/mo (domain + paid analytics tier)
- C) <$200/mo
- D) Open

**20.2 Timeline?**
- A) Weekend prototype
- B) 2–4 weeks to MVP launch ⭐ **Recommended for a polished v1**
- C) 1–3 months
- D) No deadline

**20.3 Team size?**
- A) Solo (you) ⭐ **assumed**
- B) You + me (Claude pair-programming)
- C) Small team
- D) Other

**20.4 Are there any specific technologies you want to avoid?**
- A) None
- B) Avoid Python
- C) Avoid heavy frameworks
- D) Avoid paid services
- E) Other (specify)

**20.5 Long-term maintenance plan?**
- A) Active maintenance for 6–12 months ⭐ **Recommended for portfolio value**
- B) Set and forget
- C) Open source it and accept PRs
- D) Hand off to community

---

## 21. Anything Else?

**21.1 Inspirations / references** — apps you love the feel of and want to draw from? (e.g., Akinator, Wordle, GeoGuessr, Marvel Snap, Connections, the Vercel marketing site, etc.)

**21.2 Anti-references** — apps whose UX you specifically dislike?

**21.3 Existing assets you have** — logo, color palette, character art, dataset, domain, etc.?

**21.4 Hard "no"s** — anything you absolutely do not want in this product?

**21.5 Anything I haven't asked about that matters to you?**

---

## ⏭ Next Steps

**Please answer every question above as completely as possible.** Feel free to write "go with your recommendation" for any question where you have no strong preference — that is a perfectly valid answer and I will use my ⭐ pick.

Once you submit your answers, I will respond with:

1. **Inferred requirements summary** — a concise restatement of what we are building.
2. **Assumptions & open risks** — anything still unclear, plus likely failure modes.
3. **Phased build plan** — milestones from zero to deployed v1, with deliverables per milestone.
4. **Architecture & data model** — diagrams (ASCII), schema, module breakdown.
5. **Question-selection algorithm spec** — exactly how the inference engine will work, with pseudocode.
6. **UI structure** — screen inventory, component tree, key states.
7. **Backend / API surface** — endpoints or server actions.
8. **Admin workflow** — how you'll maintain the dataset.
9. **Deployment approach** — concrete steps and configs.
10. **Testing strategy** — unit, integration, simulation harness, E2E plan.
11. **Launch checklist** — pre-flight before going live.

Only after you answer will I write the plan. I will not assume answers you have not given.
