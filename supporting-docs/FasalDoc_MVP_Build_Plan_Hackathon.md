# FasalDoc — MVP Build Plan
### BanoQabil AI Hackathon 2026 Timeline

Assumes a 2-person core team (Founder + Tech Partner) building the hackathon-ready PWA. Roughly 6–8 weeks from first commit to demo day.

---

## Week 1 — Foundation

**Goal: Lock architecture and project skeleton.**

- Set up GitHub repository with `.gitignore` for secrets and build artifacts.
- Initialize Vite PWA frontend: React 19, TypeScript, Tailwind CSS v4.
- Initialize Express backend: Node.js, ESM, CORS, dotenv, rate-limit.
- Configure Supabase project: auth, PostgreSQL schema, RLS policies.
- Create `docs/` folder with architecture, API reference, and pitch deck.
- Define UI screens: Home, Capture, History, Assistant, Tools, Settings, Auth.

---

## Week 2 — Auth & Offline Storage

**Goal: Users can sign up, log in, and work offline.**

- Implement Supabase email/password auth.
- Add backend `/api/signup` proxy using admin API to auto-confirm users.
- Add demo/guest mode for instant evaluation.
- Set up Dexie.js IndexedDB stores: users, diagnoses, recovery_cases, sync_queue.
- Implement offline-first sync queue pattern.
- Build `AuthScreen` and `SettingsScreen` with dark mode toggle.

---

## Week 3 — Diagnosis Flow

**Goal: Photo in, diagnosis + remedy out.**

- Build `CaptureScreen` with camera/file input and image compression.
- Implement `requestDiagnosis()` API client with timeout and fallback.
- Build backend `/api/diagnose` route with LLM provider fallback chain.
- Curate remedy database with organic + chemical options, dosage, and local brand names.
- Display diagnosis result with confidence, remedies, prevention, and cost.
- Save every scan to IndexedDB and sync to Supabase when online.

---

## Week 4 — History & Recovery Tracking

**Goal: Scans persist, history is filterable, recovery cases are tracked.**

- Build `HistoryScreen` with local + remote merge and deduplication by canonical id.
- Implement recovery tracking linked to the current scan.
- Add active recovery case count on `HomeScreen` filtered by user.
- Fix localStorage fallback for environments where IndexedDB is restricted.
- Ensure every scan updates the scan count correctly.

---

## Week 5 — Farmer Tools Hub

**Goal: 14 tools working and tested.**

- Weather disease-risk forecast by city/province.
- Live mandi rates widget with trend indicators.
- Government schemes directory with filters and helplines.
- Tele-vet booking with expert profiles and appointment types.
- Crop calendar, soil health scorer, irrigation planner.
- Seed rate calculator, fertilizer/NPK calculator, yield & income estimator.
- Community pest reports, disease library, emergency helplines.
- Add bilingual labels (Urdu + English) on every tool.

---

## Week 6 — AI Assistant & RAG

**Goal: Farmers can ask questions in text or voice.**

- Build `AssistantScreen` with message history.
- Implement `/api/chat` with multi-provider LLM fallback.
- Build domain RAG engine for offline fallback.
- Add Urdu language support and speech-to-text where supported.
- Wire RAG knowledge base with crop/livestock remedy data.

---

## Week 7 — Polish, Tests & CI

**Goal: App is demo-stable and professional.**

- Add loading skeletons, error boundaries, and offline banner.
- Write Vitest unit tests for weather, market, schemes, yield, seed rate, etc.
- Enforce zero TypeScript errors.
- Set up GitHub Actions CI: type-check → test → build.
- Record backup demo video.
- Update all 2025 references to 2026.

---

## Week 8 — Deployment & Pitch Prep

**Goal: Live app + compelling pitch deck.**

- Deploy backend and frontend to Vercel (single-domain multi-service).
- Verify auth, scan save, history, recovery tracking on production.
- Generate 20+ slide pitch deck covering problem, solution, demo, market, tech, roadmap, team, and ask.
- Prepare supporting documents: blueprint, build plan, data strategy, error playbook.
- Final dry-run of pitch + live demo.

---

## Cadence Recommendations

- **Daily standup** (10 min) — blockers, scope decisions.
- **Mid-week demo to yourselves** — forces honesty about real progress.
- **Keep a "must-have / nice-to-have" list** — cut nice-to-haves if any week slips.
- **Always test the full loop** — camera → API → result → history → sync.

---

## Reality Check

This plan is ambitious for a 2-person student team. If a week slips, cut scope rather than quality:
- A polished 5-tool demo beats a buggy 14-tool demo.
- Offline mode and guest mode are non-negotiable for rural evaluators.
- The recorded backup demo is insurance against live-demo failure.
