# FasalDoc — AI-Powered Crop & Livestock Health Companion
### Startup Blueprint — BanoQabil AI Hackathon 2026

---

## 1. Identity

**Primary name: FasalDoc**
*(Fasal = crop/harvest in Urdu/Punjabi; "Doc" = doctor — instantly understandable for crops, livestock, and farmers alike)*

**Tagline options:**
- "Har Fasal, Har Jaanwar, Ek App"
- "Kheti ka Doctor, Aapki Jeb Mein"

**One-line pitch:**
"FasalDoc is an AI health companion for Pakistani farmers — point your phone camera at a crop or animal, get an instant bilingual diagnosis and a locally-relevant remedy, even offline."

---

## 2. The Problem

Pakistan's agricultural sector is losing billions every year to preventable problems:

- **30–40% annual crop losses** due to diseases diagnosed too late (PARC/NARC estimates)
- **Rs. 800+ billion** estimated yearly economic damage from crop diseases and livestock mortality
- **1 extension officer for 2,000+ farmers** — expert help is physically unreachable
- **58M+ farming families** lack an instant diagnostic tool
- **Low rural connectivity & literacy** make generic global apps unusable
- Livestock diseases (foot-and-mouth, mastitis, parasitic infections) cause major dairy/meat losses with no accessible early-warning tool

Existing global apps (Plantix, PlantVillage) are not tuned to Pakistani crops, local disease strains, Urdu/regional languages, or local remedy availability.

**Wedge:** hyper-localized, bilingual, offline-capable, dual-domain (crop + livestock) diagnosis with weather, market, and government scheme intelligence.

---

## 3. Product Scope — Phased

### Phase 1 (MVP — BanoQabil AI Hackathon demo)
- Installable PWA that works on any Android smartphone
- Camera-based crop and livestock disease detection
- Bilingual remedy display (Urdu + English)
- Offline-first local storage with cloud sync
- Basic weather, mandi rates, and government schemes

### Phase 2 (Months 5–9)
- Expand crop coverage and livestock categories
- Offline RAG chat assistant for non-visual symptoms
- Tele-vet booking and expert consultations
- Community pest/disease outbreak reports

### Phase 3 (Months 10–12+)
- Soil health advisory and fertilizer calculators
- Weather-linked proactive disease alerts
- Agri-input marketplace integration
- Regional language expansion (Punjabi, Sindhi, Pashto)

**Important scoping advice:** For the hackathon, judges reward a sharp, working demo of Phase 1 with a believable roadmap for Phases 2–3.

---

## 4. Technical Architecture

### 4.1 Frontend
- **React 19 + TypeScript** for type-safe, maintainable UI
- **Vite 7 PWA** with Workbox-generated service worker
- **Tailwind CSS v4** mobile-first design system with dark mode
- **Dexie.js** IndexedDB for offline-first local storage
- **Zustand** lightweight state management
- **react-router-dom v7** for screen navigation

### 4.2 Backend
- **Node.js + Express** AI gateway
- **Multi-provider LLM mesh:** Gemini 2.0 Flash, Groq Llama-3.3-70B, OpenRouter
- **Domain RAG engine** as offline fallback when no API keys are available
- **Rate limiting & structured error handling**

### 4.3 AI/ML
- Vision diagnosis via multi-provider LLMs
- Offline RAG with curated Pakistani agricultural knowledge base
- Client-side image compression (max 1024px, JPEG q0.7) for low-bandwidth networks

### 4.4 Database & Auth
- **Supabase PostgreSQL** with Row Level Security (RLS)
- Email/password auth plus demo/guest mode
- Background sync queue for offline-created records

### 4.5 DevOps
- GitHub Actions CI: type-check → test → build on every push
- Vercel multi-service deployment (frontend + backend on one domain)
- Environment-based configuration with `.env`

---

## 5. Business Model

| Revenue Stream | Description | Timeline |
|---|---|---|
| **Freemium subscription** | Free 10 scans/month; Pro at Rs. 199/month for unlimited scans + priority tele-vet | Phase 2+ |
| **B2B partnerships** | License to banks (ZTBL, PPCBL), seed/fertilizer companies, insurers | Phase 2+ |
| **Tele-vet commission** | 10–15% on paid consultations | Phase 2+ |
| **Marketplace commission** | Connect farmers to certified agri-stores/vets | Phase 3 |
| **Government/NGO contracts** | Provincial agriculture department digitization | Ongoing |

Year 1 focus: user adoption + data collection.

---

## 6. Team

**MZunurain Tahir — Founder & Lead Architect**
- GitHub: github.com/MZunurainTahir
- AI/ML integration, product strategy, system architecture

**Muhammad Abdullah Khalid — Co-Founder & Tech Partner**
- GitHub: github.com/AbdullahKhalid
- Full-stack development, DevOps, scalable system design

---

## 7. 12-Month Roadmap

| Timeframe | Milestone |
|---|---|
| Month 1 | Problem validation, finalize target crops/livestock, baseline diagnosis flow |
| Month 2 | End-to-end photo → diagnosis → remedy working, user interviews |
| Month 3 | Pilot with 10–30 farmers, refine UX and remedy accuracy |
| Month 4 | **BanoQabil AI Hackathon demo** — polished MVP + pitch deck |
| Month 5–6 | Field pilot expansion, tele-vet onboarding |
| Month 7–9 | Livestock expansion, offline RAG chat, regional languages |
| Month 10–12 | B2B conversations, seed funding, provincial rollout planning |

---

## 8. Risks & Honest Challenges

- **Data scarcity:** Pakistan-specific labeled disease images are limited — build university/PARC partnerships early.
- **Rural connectivity:** design offline-first from day one.
- **Trust & liability:** validate remedy database with agronomists/vets; include "consult local expert" disclaimers.
- **Adoption:** distribute through trusted channels (extension workers, cooperatives, input companies) rather than app-store ads alone.

---

## 9. Competitive Landscape

- **Plantix / PlantVillage:** global leaders but not Pakistan-specific in language, remedies, or local brand names.
- **Local SMS services:** no visual AI or structured diagnosis history.
- **WhatsApp advisory groups:** unverified, untraceable advice.

**Defensibility:** local data moat, bilingual UX, offline-first architecture, and integrated farmer tools.

---

## 10. Next Immediate Steps

1. Confirm target crops/livestock for the hackathon demo.
2. Lock team roles and repository workflow.
3. Validate remedy database with at least one domain advisor.
4. Prepare a recorded backup demo in addition to the live pitch.

---

*Built for BanoQabil AI Hackathon 2026.*
