# FasalDoc — Error Playbook
### Common Pitfalls & Fixes — BanoQabil AI Hackathon 2026

This playbook catalogs the errors and edge cases most likely to appear while building, deploying, and demoing FasalDoc. Use it as a checklist before demo day.

---

## Phase 1: Authentication

| Issue | Why it happens | Fix |
|---|---|---|
| "Invalid email or password" after signup | Supabase requires email confirmation by default | Use backend `/api/signup` proxy with admin `createUser({ email_confirm: true })` |
| Signup rate limit errors | Too many direct Supabase signups from same IP | Route signups through backend admin API and add rate limiting |
| Demo mode data leaks across users | IndexedDB/localStorage not scoped by user | Filter all local data by `user.id`; use Supabase RLS for remote data |

---

## Phase 2: Diagnosis & Image Handling

| Issue | Why it happens | Fix |
|---|---|---|
| Large image uploads fail | Phone camera produces multi-MB files | Compress client-side to max 1024px, JPEG q0.7 before upload |
| Diagnosis returns wrong condition confidently | Model overconfidence on limited data | Keep `CONFIDENCE_THRESHOLD` conservative; show "unclear, try again" for low confidence |
| API works locally but not on phone | `localhost` used instead of real IP/domain | Use relative API calls or set `VITE_API_URL` to deployed backend |
| Offline diagnosis fails | No fallback when LLM providers unreachable | Use domain RAG engine and cached remedy database as offline fallback |

---

## Phase 3: Data Persistence & Sync

| Issue | Why it happens | Fix |
|---|---|---|
| Scan not saved / history empty | IndexedDB row missing primary key | Always write `id: localId` when saving locally |
| Duplicate history entries | Local + remote rows have different ids for same scan | Deduplicate by canonical id; update local row with remote id after sync |
| Recovery case linked to wrong scan | Recovery fetched latest remote diagnosis instead of current scan | Use a `currentScanRef` to bind recovery to the just-made scan |
| Active recovery count wrong across users | Local recovery cases not filtered by user | Filter local recovery cases by `user.id` before counting |
| Phantom "Invalid Date" entry | Secondary localStorage mirror saved with different id after sync | Remove redundant mirrors; use localStorage only as fallback |

---

## Phase 4: Backend & API

| Issue | Why it happens | Fix |
|---|---|---|
| LLM provider all fail | Missing or invalid API keys, rate limits, timeouts | Implement provider fallback chain: Gemini → Groq → OpenRouter → RAG |
| `/health` reports failure | Model file missing or env vars not loaded | Check `.env` and file paths; call `/health` right after deploy |
| CORS errors | Frontend origin not allowed by backend | Configure CORS allowlist; for Vercel single-domain, use rewrites |
| Cold starts on free tier | Server scales to zero | Warm the backend before demo; mention cold-start possibility |

---

## Phase 5: PWA & Offline

| Issue | Why it happens | Fix |
|---|---|---|
| App not installable | PWA manifest missing required fields | Verify manifest name, short_name, icons, theme_color, display |
| Service worker doesn't cache assets | Workbox config incomplete | Check `vite-plugin-pwa` config and `dev-dist/` output |
| Offline page shows blank | Navigation not cached | Ensure `navigateFallback: 'index.html'` in Workbox config |
| Old assets after deploy | Service worker caches old build | Use `registerType: 'autoUpdate'` and prompt user to reload |

---

## Phase 6: UI/UX

| Issue | Why it happens | Fix |
|---|---|---|
| Urdu text breaks layout | Right-to-left rendering not handled | Use `dir="rtl"` on language switch and test Urdu labels |
| Dark mode flashes white on load | Theme initialized after render | Read theme preference early and apply class in `index.html` |
| Buttons too small on rural phones | Designed for flagship screens only | Use Tailwind `min-h-12 min-w-12` touch targets; test on budget devices |
| Screen overflow on small screens | Fixed widths / no responsive breakpoints | Use mobile-first Tailwind utilities; test at 320px width |

---

## Phase 7: Deployment & DevOps

| Issue | Why it happens | Fix |
|---|---|---|
| Secrets committed to GitHub | Hardcoded API keys | Use `.env` + environment variables; keep `.env` in `.gitignore` |
| Vercel build fails | TypeScript errors or missing env vars | Run `npm run build` locally before pushing; add env vars in Vercel dashboard |
| Backend routes 404 on Vercel | `vercel.json` routes not configured | Use `rewrites` to send `/api/*` to backend serverless function |
| CI fails on GitHub Actions | Node version mismatch or missing tests | Pin Node version; ensure `package-lock.json` is committed |

---

## Phase 8: Demo Day

| Issue | Why it happens | Fix |
|---|---|---|
| Live demo fails | Network, auth, or LLM outage | Always have a recorded backup demo video ready |
| App shows demo data for wrong user | Demo mode hardcoded to single profile | Scope demo data per session or label clearly as demo |
| Browser cache shows old version | Service worker stale | Hard-refresh or use incognito window before demo |
| Judges ask "what if offline?" | Not tested offline | Demo airplane mode or disable network briefly |

---

## The One Habit That Prevents Most Issues

**Test the full end-to-end loop once per day:** camera → API → result → history → sync → recovery tracking. Most bugs hide at the boundaries between frontend, backend, and database. A daily full-loop test surfaces them while they are still cheap to fix.

---

*Built for BanoQabil AI Hackathon 2026.*
