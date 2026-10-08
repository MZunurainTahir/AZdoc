# 🩺 AZdoc — AI Health & Diagnostics for Every Living Thing
### *A to Z of Health — For Humans, Livestock, Pets, Plants & Crops*

> **Built with ❤️ by Abdullah Khalid & Abdullah Nadeem**  
> *One Ecosystem. Every Life.*

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite%20PWA-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2B%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![ElevenLabs](https://img.shields.io/badge/TTS-ElevenLabs%20Voice%20AI-blueviolet)](https://elevenlabs.io/)
[![Speechmatics](https://img.shields.io/badge/STT-Speechmatics%20%2B%20Whisper-orange)](https://speechmatics.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Google%20Maps%20Radar-4285F4?logo=google-maps&logoColor=white)](https://maps.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Executive Summary & Vision

**AZdoc** is an all-in-one AI healthcare super-app designed to bridge clinical and veterinary healthcare accessibility across Pakistan and developing regions. From human clinical triage and emergency care to livestock veterinary advice, domestic pet wellness, indoor plant healing, and agricultural crop disease management — **AZdoc delivers instant diagnostic intelligence, multilingual voice consultation, and doorstep pharmacy fulfillment.**

Founded and architected by **Abdullah Khalid** and **Abdullah Nadeem**, AZdoc brings hospital-grade AI triage, live GPS pharmacy discovery, and native regional voice communication to every citizen's pocket.

---

## 🚀 Key Features & Innovations

### 🎙️ 1. Multilingual AI Doctor (7 Regional & Global Languages)
- **Languages Supported**:
  - 🇵🇰 **Urdu (اردو)** — Full Nastaliq alignment & native clinical vocabulary
  - 🇬🇧 **English** — Comprehensive medical terminology
  - 🌾 **Punjabi (پنجابی)** — Dedicated regional phrasing for farmers & rural families
  - 🏺 **Sindhi (سنڌي)** — Authentic health and veterinary dialect
  - 🏔️ **Pashto / Pakhtoon (پښتو)** — Native northern and western regional support
  - 🌴 **Balochi (بلوچی)** — Accessible care for Balochistan communities
  - 🇪🇸 **Spanish (Español)** — International language expansion
- **Speechmatics & Groq Whisper Speech-to-Text (STT)**: Direct microphone speech transcription with real-time waveform animation.
- **ElevenLabs AI Voice Synthesis (TTS)**: Ultra-realistic expressive doctor voices that read clinical advice and prescriptions aloud.
- **Clinical Prescription Generator (Rx)**: Generates structured, downloadable, and printable medical prescription slips with 1-tap medicine ordering.

---

### 📍 2. Live GPS Geolocation & Nearest Pharmacy Delivery Radar
- **Instant GPS Location Detection**: Prompts user for browser location access and pinpoints latitude/longitude with reverse-geocoded address.
- **Google Maps Integration**:
  - Live Google Maps route directions to the nearest pharmacy.
  - Interactive Google Maps radar views with distance calculation (Haversine formula).
- **Nearest Partner Stores Ranking**:
  - Calculates exact distance (`km`), estimated delivery time (`mins`), and live store ratings.
  - Direct 1-tap phone call button (`tel:042-xxx` / `tel:03xx-xxx`) to speak directly with the on-duty pharmacist.
- **Doorstep Cash-on-Delivery (COD) Checkout**: Instant order placement for human medicines, veterinary drugs, pet food, plant fungicides, and agricultural fertilizers.
- **Live Animated Delivery Departure Tracker**:
  - Real-time stages: **Order Placed** ➔ **Pharmacist Packed** ➔ **Departed Store with Rider** ➔ **On the Way** ➔ **Delivered**.
  - Verified Courier Profile: Rider Name, Rating, Vehicle Type (Bike/Van), License Plate, and direct calling.
  - Live ETA countdown timer.

---

### 🔬 3. Multi-Domain Computer Vision Diagnostics (`/capture`)
- **Dual Diagnosis Engine**: Captures photos of human skin conditions, livestock lesions, pet skin/fur, houseplants, or crop leaves.
- **Sub-Second Edge Analysis**: Client-side canvas compression for rapid operation even on 2G/3G mobile networks.
- **Certified Treatment Plans**:
  - 🌿 **Herbal & Organic Solutions**
  - 🧪 **Chemical Formulations with Pakistani Brand Stockists**
  - 💊 **Exact Application Dosages & Prevention Rules**

---

### 👨‍⚕️ 4. Telemedicine & Doctor Consultations (`/doctors`)
- Book 1-on-1 audio, video, clinic, or field visit appointments with certified practitioners across all 5 life domains.
- Real-time slot management, instant confirmation, and offline-first persistence.

---

### 🛠️ 5. Comprehensive Care & Agronomic Toolkit (`/tools`)
- **Disease Encyclopedia**: 30+ detailed pathologies across all domains with symptoms and prevention guides.
- **Weather Outbreak Risk Engine**: Real-time OpenWeatherMap data & FortyGuard intelligence computing 5-day humidity and temperature disease risk scores.
- **Mandi & Commodity Market Rates**: Live market price monitoring across Punjab, Sindh, KPK, Balochistan, Gilgit-Baltistan, and AJK.
- **Government Healthcare & Agri Schemes**: Complete directory of subsidies, Kisan Cards, Sehat Sahulat Card, and livestock support programs.
- **Dosage, Irrigation, Soil & Yield Calculators**: Precision mathematical estimation tools.

---

### 📶 6. Offline-First Architecture & Supabase Sync
- **IndexedDB via Dexie.js**: All scans, chat histories, offline remedy caches, and local orders function completely without internet.
- **Bidirectional Cloud Sync**: Automatically enqueues pending mutations and syncs with Supabase PostgreSQL upon network reconnection.

---

## 👥 Core Leadership & Founding Team

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| **Abdullah Khalid** | **Co-Founder & Chief Product Architect** | Core Product Vision, Multilingual AI Systems, Telemedicine UX & Startup Strategy |
| **Abdullah Nadeem** | **Co-Founder & Chief Technology Officer** | Full-Stack Engineering, Speechmatics & ElevenLabs Pipeline, Geolocation Engine |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, React Router 7.
- **AI & Speech**:
  - **Speechmatics API** & **Groq Whisper** (`whisper-large-v3-turbo`) for Multi-lingual STT.
  - **ElevenLabs Multilingual v2** for High-Fidelity Voice Synthesis.
  - **Google Gemini 2.0 / Groq Llama 3.3 / OpenRouter** for Clinical Medical Intelligence.
- **Location & Maps**: HTML5 Geolocation API, OpenStreetMap Nominatim, Google Maps Navigation URLs & Radar Embeds, FortyGuard Location API.
- **Database & Sync**: Supabase PostgreSQL, Supabase Auth, Dexie.js (IndexedDB).
- **Testing & Quality**: Vitest, React Testing Library, ESLint, TypeScript Strict Mode.

---

## 📚 Complete Software Engineering & Investor Pitch Documentation

AZdoc includes production-grade technical and presentation documentation available both in Markdown and printable PDF formats:

1. 📄 **[AZdoc Complete Software Engineering & UML Docs (PDF)](docs/AZdoc_Complete_Software_Engineering_and_UML_Docs.pdf)** | **[Markdown Version](docs/AZDOC_COMPLETE_SOFTWARE_ENGINEERING_DOCS.md)**
   - Software Requirement Specification (SRS) - Functional & Non-Functional
   - Tech Stack & System Architecture Breakdown
   - Supabase PostgreSQL DDL Database Schema & Row-Level Security (RLS)
   - Complete Catalog of API Endpoints & Method Calls
   - 12 Complete UML Diagrams (Architecture, Use Case, DFD 0/1/2, 4 Sequence Diagrams, ERD, Component, Deployment, 2 State Machines, Activity Journey)

2. 📄 **[AZdoc Startup Pitch Strategy & 500 Q&A Defense Manual (PDF)](docs/AZdoc_Startup_Pitch_and_500_QA_Defense_Manual.pdf)** | **[Markdown Version](docs/AZDOC_STARTUP_PITCH_AND_500_QA_DEFENSE_MANUAL.md)**
   - 30-Sec Elevator Pitch, 3-Min Pitch Script, and 5-Min Product Demo Walkthrough
   - In-depth Strategic Analysis across the **7 Startup Evaluation Criteria** (Problem Significance, Solution & Innovation, Market Opportunity, Business Model, Feasibility & Execution, Team Capability, Presentation & Communication)
   - **500 Question & Answer Investor Defense Repository** organized across all 7 evaluation categories for competition defense & VC due diligence.

---

## ⚙️ Quick Start & Local Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/MZunurainTahir/AZdoc.git
cd AZdoc
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
# Frontend AI & Speech Services
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_SPEECHMATICS_API_KEY=your_speechmatics_key
VITE_GROQ_API_KEY=your_groq_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_API_URL=http://localhost:8000
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch locally at **`http://localhost:5173`**.

### 5. Run Type Check & Tests
```bash
npm run type-check
npm run test
```

---

## 📜 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---
*AZdoc — Empowering every life with accessible, compassionate, and cutting-edge AI healthcare.*
