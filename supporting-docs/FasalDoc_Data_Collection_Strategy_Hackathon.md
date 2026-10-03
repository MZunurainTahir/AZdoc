# FasalDoc — Data Collection Strategy
### BanoQabil AI Hackathon 2026

---

## 1. Why Data Strategy Matters

FasalDoc's real value comes from Pakistan-specific, verified agricultural knowledge. While the MVP uses multi-provider LLMs for visual diagnosis, the long-term moat is a curated local dataset of crop/livestock conditions, verified remedies, and farmer-validated outcomes. This strategy describes how we build that moat responsibly and scalably.

---

## 2. Types of Data We Collect

### 2.1 Diagnostic Images
- Crop leaf, stem, fruit, and whole-plant photos showing disease/pest symptoms.
- Livestock skin, eye, hoof, and oral cavity photos showing visible conditions.
- Metadata: crop/animal type, suspected condition, location, date, confidence.

### 2.2 Remedy Knowledge Base
- Disease/condition → organic remedy → chemical active ingredient → local brand names.
- Dosage per acre/kanal/animal weight and estimated PKR cost.
- Preventative agronomic practices.
- Source attribution (agronomist, vet, research paper, extension bulletin).

### 2.3 Structured Agricultural Data
- Weather disease-risk scoring rules by province/city.
- Daily mandi rates from provincial market committees.
- Government scheme metadata (eligibility, benefits, contacts, deadlines).
- Crop calendar windows for sowing, irrigation, fertilizer, and harvest.
- Soil health scoring rubrics and amendment recommendations.

### 2.4 User Feedback Data
- "Was this diagnosis correct?" confirmations from farmers.
- Recovery case updates (improving, stable, worsening).
- Tele-vet consultation ratings and outcome notes.

---

## 3. Collection Channels

### A. University & Research Partnerships
- Pakistan Agricultural Research Council (PARC)
- University of Agriculture Faisalabad (UAF)
- Provincial Agriculture Extension Departments
- Offer attribution, early app access, and co-branded research outputs in exchange.

### B. Field Collection Trips
- Visit farms, nurseries, and mandis in target provinces.
- Use a standardized mobile form inside FasalDoc to capture images + metadata.
- Aim for varied lighting, angles, and growth stages.

### C. Crowdsourcing via Pilot Users
- In-app feedback button: "Was this diagnosis correct?"
- Confirmed scans become labeled training examples over time.
- Recovery tracking creates a longitudinal outcome dataset.

### D. Agri-Input Shops & Extension Workers
- Pesticide/fertilizer retailers see diseased samples daily.
- Extension workers can verify conditions and recommend remedies.
- Treat these as "helpful but requires expert verification" unless confirmed.

### E. Public Datasets (for pretraining and benchmarking)
- PlantVillage — baseline leaf-disease dataset.
- PlantDoc — real-world field images.
- South Asia-specific datasets on Kaggle, Zenodo, and research repositories.

---

## 4. Labeling & Verification Workflow

1. **Capture** — image + context metadata stored in Supabase with `pending_review` status.
2. **Review** — domain advisor (agronomist/vet) confirms or corrects the label.
3. **Curate** — verified entries promoted to the remedy database and RAG knowledge base.
4. **Version** — every remedy update is timestamped and attributed.
5. **Retire** — outdated treatments marked deprecated with a replacement pointer.

---

## 5. Data Targets by Phase

| Phase | Target | Primary Channel |
|---|---|---|
| Hackathon (Month 1) | Baseline RAG + sample test images | Public datasets + curated remedy DB |
| Months 2–3 | 200+ verified local images | Field trips + shop visits |
| Months 4–6 | 1,000+ verified images + 50 recovery cases | Pilot users + university partners |
| Months 7–12 | 5,000+ images + active crowdsourcing | All channels |

---

## 6. Consent & Ethics

- Verbal permission before photographing farms, animals, or people.
- Separate consent if identifiable people appear in public materials.
- Written/email agreement with any institution sharing data.
- Farmer data is isolated via Supabase RLS; aggregated insights only.
- Clear disclaimers: severe cases should always be referred to a local expert.

---

## 7. Immediate Next Steps

1. Finalize the in-app feedback and recovery-tracking schema.
2. Identify 1–2 nearby farms or agri markets for a first field trip.
3. Draft a simple partnership email template for UAF/PARC outreach.
4. Set up a shared spreadsheet for remedy database source attribution.

---

*Built for BanoQabil AI Hackathon 2026.*
