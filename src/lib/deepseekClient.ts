/**
 * AZdoc AI Doctor Client — v5.0 (Multi-LLM + OpenAI + Client RAG Engine)
 * Features:
 *  • OpenAI GPT-4o / GPT-4o-mini (PRIMARY — user's own API key)
 *  • Gemini 2.0 Flash Vision & Text
 *  • Groq Llama 3.3 70B
 *  • DeepSeek Chat
 *  • OpenRouter multi-model gateway
 *  • Pollinations AI (Zero-key guaranteed free LLM endpoint)
 *  • Client RAG Knowledge Base Integration
 *  • Domain-isolated fallback (No Paracetamol for crops!)
 */

import type { DomainId } from "./domains";
import { generateClientRAGAnswer } from "./ragClient";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) as string | undefined;

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

type LangCode = "ur" | "en" | "pa" | "sd" | "ps" | "bal" | "es";

const LANG_NAMES: Record<LangCode, string> = {
  ur: "Urdu (اردو)",
  en: "English",
  pa: "Punjabi (پنجابی)",
  sd: "Sindhi (سنڌي)",
  ps: "Pashto (پښتو)",
  bal: "Balochi (بلوچی)",
  es: "Spanish (Español)",
};

// ─── ENHANCED DOMAIN SYSTEM PROMPTS ─────────────────────────────────────────

const DOMAIN_SYSTEM_PROMPTS: Record<DomainId, string> = {
  human: `You are Dr. AZdoc, a highly qualified MBBS/MD-level AI physician with specializations in General Medicine, Dermatology, Pediatrics, Emergency Medicine, Cardiology, Infectious Diseases, and Pharmacology.

CORE RULES:
1. Give DETAILED, ACCURATE, PERSONALIZED medical responses. Never generic. Never refuse to answer.
2. For every condition, provide:
   a) Likely DIAGNOSIS with differential diagnoses
   b) CLINICAL EXPLANATION
   c) MEDICINE NAMES: generic name + Pakistan brand name + dose + frequency + duration
   d) HOME REMEDIES & supportive care
   e) RED FLAGS — when to go to EMERGENCY IMMEDIATELY
   f) FOLLOW UP: when to see a doctor
3. LANGUAGE RULE: Respond 100% in the user's language. If Urdu → full Urdu script. If English → English.
4. End with a short medical disclaimer.`,

  livestock: `You are Dr. AZdoc, a senior DVM (Doctor of Veterinary Medicine) with 15+ years specializing in large animals: cattle, buffalo, goat, sheep, camel in Pakistan.

CORE RULES:
1. For every case provide:
   a) DISEASE NAME (Urdu + English): e.g., منہ کھر (FMD), سڑو (Mastitis)
   b) CAUSE & PATHOPHYSIOLOGY
   c) CLINICAL SIGNS to confirm
   d) TREATMENT: exact medicine names (Pakistan market), doses in ml/kg body weight, route (IM/IV/SC/oral), duration
   e) WITHDRAWAL PERIOD for milk and meat
   f) PREVENTION & VACCINATION SCHEDULE
2. Emergency conditions (bloat/Tympany, milk fever, prolapse): give IMMEDIATE first aid protocol.
3. Mention Pakistan Livestock Helpline: 0800-29000
4. LANGUAGE RULE: Respond 100% in user's language.`,

  pet: `You are Dr. AZdoc, a certified companion animal veterinarian (BVMS) specializing in dogs, cats, birds, rabbits, and hamsters.

CORE RULES:
1. For every case provide:
   a) DIAGNOSIS with species-specific considerations
   b) TREATMENT: medicine names, dose by weight (mg/kg), frequency, route, duration
   c) VACCINATION SCHEDULE
   d) DIET & NUTRITION recommendations
   e) WHEN TO SEE VET URGENTLY
2. LANGUAGE RULE: Respond 100% in user's language.`,

  plant: `You are Dr. AZdoc, a certified PhD Horticulturist and Plant Pathologist specializing in houseplants, ornamental plants, and garden plants.

CORE RULES:
1. For every case provide:
   a) DISEASE/PROBLEM DIAGNOSIS: exact name (fungal/bacterial/viral/pest/nutrient deficiency)
   b) VISUAL SYMPTOMS to confirm
   c) ORGANIC TREATMENT: neem oil, baking soda, garlic spray, etc.
   d) CHEMICAL TREATMENT: product names available in Pakistan, dose, application method
   e) PREVENTION: proper watering schedule, NPK fertilizer, light requirements
2. LANGUAGE RULE: Respond 100% in user's language.`,

  crop: `You are Dr. AZdoc, an expert Agronomist and Crop Protection Specialist with 20+ years working with Punjab Agriculture Department on major Pakistan crops: wheat (گندم), rice (چاول), cotton (کپاس), sugarcane (گنا), maize (مکئی), and vegetables.

CORE RULES:
1. Answer ANY agricultural, crop, fertilizer, pesticide, or soil question thoroughly and accurately.
2. For FERTILIZER questions: Give exact DAP, Urea, SOP, NPK per acre dosage, application timing (at sowing, 1st irrigation, 2nd irrigation), and soil moisture rules.
3. For DISEASE/PEST questions: Identify exact disease, spray products (Syngenta, FMC, Bayer brands), dose per acre, and IPM control.
4. LANGUAGE RULE: Respond 100% in user's language.
5. Mention Punjab Agriculture Helpline where relevant: 0800-15000`,
};

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

/**
 * Main AI Doctor function — Routes through multi-model AI Pipeline:
 * 1. DeepSeek API (PRIMARY — user's own key)
 * 2. OpenAI GPT-4o-mini (if separate OpenAI key available)
 * 3. Gemini Direct API
 * 4. Groq Llama 3.3
 * 5. OpenRouter API
 * 6. Pollinations AI (Zero-key guaranteed free endpoint)
 * 7. Client RAG Knowledge Base Engine
 * 8. Domain-Isolated Smart Fallback
 */
export async function askDeepSeekDoctor(params: {
  userMessage: string;
  history: { role: "user" | "assistant"; content: string }[];
  lang: LangCode;
  domain: DomainId;
  imageBase64?: string;
}): Promise<string> {
  const { userMessage, history, lang, domain, imageBase64 } = params;
  const langName = LANG_NAMES[lang] || "English";
  const systemPrompt = DOMAIN_SYSTEM_PROMPTS[domain] || DOMAIN_SYSTEM_PROMPTS.human;

  const fullSystem = `${systemPrompt}

LANGUAGE INSTRUCTION: The user is communicating in ${langName}. Your ENTIRE response MUST be written in ${langName} only. Do not switch languages. Match exactly.

Current consultation domain: ${domain}`;

  // ── IMAGE PATH: Vision analysis ───
  if (imageBase64) {
    const imageResult = await analyzeImageWithVision({
      imageBase64,
      userMessage,
      systemPrompt: fullSystem,
      domain,
      lang,
    });
    if (imageResult) return imageResult;
  }

  // ── TEXT PATH ─────────────────────────────────────────────────────────────
  const messages: DeepSeekMessage[] = [
    { role: "system", content: fullSystem },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Helper: convert messages to simple text format for providers that need it
  const simpleMessages = messages.map((m) => ({
    role: m.role,
    content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
  }));

  // 1. DeepSeek API (PRIMARY — direct endpoint if genuine sk- key)
  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY.startsWith("sk-")) {
    try {
      console.log("[DeepSeek] Attempting DeepSeek Chat (PRIMARY)...");
      const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: simpleMessages,
          temperature: 0.3,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) {
          console.log("[DeepSeek] ✅ Response received (PRIMARY)");
          return reply.trim();
        }
      } else {
        const errText = await res.text();
        console.warn("[DeepSeek] API error:", res.status, errText);
      }
    } catch (err) {
      console.warn("[DeepSeek] Failed:", err);
    }
  }

  // 2. OpenRouter DeepSeek V3 (Authentic DeepSeek Chat - verified active)
  if (OPENROUTER_API_KEY) {
    try {
      console.log("[OpenRouter] Attempting DeepSeek V3 (deepseek/deepseek-chat)...");
      const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://azdoc.vercel.app",
          "X-Title": "AZdoc AI Doctor",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: simpleMessages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) {
          console.log("[OpenRouter] ✅ DeepSeek V3 response received");
          return reply.trim();
        }
      } else {
        const errText = await res.text();
        console.warn("[OpenRouter] DeepSeek API error:", res.status, errText);
      }
    } catch (err) {
      console.warn("[OpenRouter/DeepSeek] Failed:", err);
    }
  }

  // 3. Groq LLM (Ultra-fast high capability: GPT-OSS 120B & Qwen 27B)
  if (GROQ_API_KEY) {
    const groqModels = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
    for (const model of groqModels) {
      try {
        console.log(`[Groq] Attempting ${model}...`);
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: simpleMessages,
            temperature: 0.3,
            max_tokens: 2000,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content as string | undefined;
          if (reply && reply.trim().length > 30) {
            console.log(`[Groq] ✅ ${model} response received`);
            return reply.trim();
          }
        } else {
          const errText = await res.text();
          console.warn(`[Groq] ${model} error:`, res.status, errText);
        }
      } catch (err) {
        console.warn(`[Groq] ${model} request failed:`, err);
      }
    }
  }

  // 4. OpenRouter GPT-4o-mini
  if (OPENROUTER_API_KEY) {
    try {
      console.log("[OpenRouter] Attempting GPT-4o-mini...");
      const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://azdoc.vercel.app",
          "X-Title": "AZdoc AI Doctor",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: simpleMessages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) {
          console.log("[OpenRouter] ✅ GPT-4o-mini response received");
          return reply.trim();
        }
      }
    } catch (err) {
      console.warn("[OpenRouter/GPT-4o] Failed:", err);
    }
  }

  // 6. Pollinations AI (Zero API key required public LLM endpoint)
  try {
    console.log("[Pollinations] Attempting free LLM endpoint...");
    const promptText = encodeURIComponent(`${fullSystem}\n\nUser Question: ${userMessage}`);
    const polRes = await fetch(`https://text.pollinations.ai/${promptText}?model=openai&system=${encodeURIComponent(fullSystem)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (polRes.ok) {
      const reply = await polRes.text();
      if (reply && reply.trim().length > 30) {
        console.log("[Pollinations] ✅ Response received");
        return reply.trim();
      }
    }
  } catch (err) {
    console.warn("[Pollinations AI] Failed:", err);
  }

  // 7. RAG Knowledge Base fallback (Instant local verified answers)
  const ragAnswer = generateClientRAGAnswer(userMessage, lang === "ur" ? "ur" : "en", domain);
  if (ragAnswer && ragAnswer.length > 40) {
    console.log("[RAG] ✅ Local knowledge base answer provided");
    return ragAnswer;
  }

  // 8. Domain-Isolated Fallback Response
  console.log("[Fallback] Using domain-isolated static response");
  return fallbackResponse(userMessage, lang, domain);
}

/**
 * Vision analysis using OpenAI GPT-4o or OpenRouter vision models
 */
async function analyzeImageWithVision(params: {
  imageBase64: string;
  userMessage: string;
  systemPrompt: string;
  domain: DomainId;
  lang: LangCode;
}): Promise<string | null> {
  const { imageBase64, userMessage, systemPrompt, domain, lang } = params;
  const mimeType = "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const visionSystemPrompt = `${systemPrompt}

VISION ANALYSIS INSTRUCTIONS:
- You are analyzing an image in the ${domain} domain.
- Describe what you see in detail (lesion texture, color, affected plant/animal/human tissue).
- Give a confident diagnosis and specific treatment plan.`;

  const visionUserMessage = userMessage || getDomainImagePrompt(domain, lang);

  // 1. OpenAI GPT-4o-mini Vision (only if genuine OpenAI key)
  if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-") && OPENAI_API_KEY !== DEEPSEEK_API_KEY) {
    try {
      console.log("[Vision/OpenAI] Attempting GPT-4o-mini vision...");
      const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: visionSystemPrompt },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: visionUserMessage },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) {
          console.log("[Vision/OpenAI] ✅ Vision response received");
          return reply.trim();
        }
      } else {
        const errText = await res.text();
        console.warn("[Vision/OpenAI] API error:", res.status, errText);
      }
    } catch (err) {
      console.warn("[Vision/OpenAI] Failed:", err);
    }
  }

  // 2. OpenRouter Vision models (fallback)
  if (OPENROUTER_API_KEY) {
    const models = [
      "openai/gpt-4o-mini",
      "google/gemini-flash-1.5",
    ];

    for (const model of models) {
      try {
        console.log(`[Vision/OpenRouter] Trying ${model}...`);
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://azdoc.vercel.app",
            "X-Title": "AZdoc Vision",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: visionSystemPrompt },
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: dataUrl } },
                  { type: "text", text: visionUserMessage },
                ],
              },
            ],
            temperature: 0.2,
            max_tokens: 2000,
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content as string | undefined;
          if (reply && reply.trim().length > 30) {
            console.log(`[Vision/OpenRouter] ✅ ${model} response received`);
            return reply.trim();
          }
        }
      } catch (err) {
        console.warn(`[Vision] ${model} failed:`, err);
      }
    }
  }

  return null;
}

function getDomainImagePrompt(domain: DomainId, lang: LangCode): string {
  const isUr = lang === "ur";
  switch (domain) {
    case "crop":
      return isUr ? "اس فصل کی تصویر کا جائزہ لیں اور بیماری/کیڑے کا علاج بتائیں" : "Analyze this crop image and provide disease diagnosis and treatment plan.";
    case "plant":
      return isUr ? "اس پودے کا معائنہ کریں اور مسئلے کا قدرتی یا کیمیائی علاج بتائیں" : "Analyze this plant photo and suggest treatment.";
    case "livestock":
      return isUr ? "اس جانور کی علامات اور بیماری کی ویٹرنری تشخیص کریں" : "Analyze this livestock photo and provide veterinary advice.";
    case "pet":
      return isUr ? "اس پالتو جانور کی خارش/بیماری کا علاج بتائیں" : "Analyze this pet photo and provide vet guidance.";
    case "human":
    default:
      return isUr ? "اس طبی تصویر کی تشخیص اور علاج کا مشورہ دیں" : "Analyze this medical image and provide diagnosis and guidance.";
  }
}

/**
 * Domain-isolated fallback response — NEVER mixes crop with human paracetamol!
 */
function fallbackResponse(userQuery: string, lang: LangCode, domain: DomainId): string {
  const isUrdu = lang === "ur" || /[\u0600-\u06FF]/.test(userQuery);

  // 1. CROP / FASALDOC
  if (domain === "crop") {
    if (isUrdu) {
      return `🌾 **زرعی و فصلات ماہرانہ رہنمائی (AZdoc FasalDoc Agronomist)**

**گندم، دھان اور دیگر فصلوں کے لیے تجاویز:**
• **کھاد کا شیڈول (فی ایکڑ):** 1.5 بوری DAP بوائی کے وقت؛ 1 سے 1.25 بوری یوریا + 3 کلوگرام زنک سلفیٹ (33%) پہلے پانی پر (20-25 دن)؛ 1 بوری یوریا دوسرے پانی پر (40-45 دن)۔
• **کنگی و فنگل بیماری:** Nativo 75WG (65g/ایکڑ) یا Tilt 250 EC (200ml/ایکڑ) اسپرے کریں۔
• **سست تیلہ و کیڑے:** Imidacloprid 200SL (100ml/100L پانی) اسپرے کریں۔

📞 **زرعی ہیلپ لائن:** 0800-15000`;
    }
    return `🌾 **Crop & Agricultural Guidance (AZdoc FasalDoc Agronomist)**

**General Crop & Fertilizer Recommendations:**
• **Wheat Fertilizer (per Acre):** 1.5 bags DAP at sowing time; 1 to 1.25 bags Urea + 3 kg Zinc Sulphate (33%) at 1st irrigation (20-25 days); 1 bag Urea at 2nd irrigation (40-45 days).
• **Rust & Fungal Blight:** Spray Propiconazole (Tilt 250 EC @ 200ml/acre) or Tebuconazole + Trifloxystrobin (Nativo 75WG @ 65g/acre).
• **Aphids & Pests:** Spray Imidacloprid 200SL @ 100ml/100L water per acre.

📞 **Agriculture Helpline:** 0800-15000`;
  }

  // 2. PLANT / PLANTDOC
  if (domain === "plant") {
    if (isUrdu) {
      return `🌿 **پودوں کی دیکھ بھال و بیماری علاج (AZdoc PlantDoc)**

• **پتوں کا پیلا پن:** نائٹروجن کی کمی دور کرنے کے لیے ہلکی یوریا یا NPK 20:20:20 دیں۔
• **سفید پھپھوندی و دھبے:** نیم آئل (5ml/لیٹر پانی + صابن قطرہ) اسپرے کریں یا کاپر آکسی کلورائیڈ 2g/L۔
• **پانی کی مقدار:** مٹی 2cm خشک ہونے پر پانی دیں۔`;
    }
    return `🌿 **Plant Care & Disease Guidance (AZdoc PlantDoc)**

• **Yellowing Leaves:** Apply balanced NPK 20:20:20 or light liquid fertilizer for nitrogen recovery.
• **Fungal Spots & Mildew:** Spray Neem Oil (5ml/1L water + 1 drop liquid dish soap) or Copper Oxychloride @ 2g/L.
• **Watering Rule:** Only water when top 2cm of soil feels dry to the touch.`;
  }

  // 3. LIVESTOCK / STOCKDOC
  if (domain === "livestock") {
    if (isUrdu) {
      return `🐄 **لائیوسٹاک ویٹرنری رہنمائی (AZdoc StockDoc)**

• **بخار و سوجن:** Inj. Meloxicam (1ml فی 20kg وزن)
• **انفیکشن:** Inj. Oxytetracycline 200 L.A. (1ml فی 10kg)
• **افارہ (Bloat):** Tympanol powder یا میٹھا سوڈا 100g پانی میں حل کر کے پلائیں۔

📞 **ویٹرنری ہیلپ لائن:** 0800-29000`;
    }
    return `🐄 **Livestock Veterinary Guidance (AZdoc StockDoc)**

• **Fever & Pain:** Inj. Meloxicam (1ml per 20kg body weight IM).
• **Bacterial Infections:** Inj. Oxytetracycline 200 L.A. (1ml per 10kg body weight).
• **Bloat / Tympany:** Give 100g Sodium Bicarbonate or Tympanol powder in warm water.

📞 **Livestock Helpline:** 0800-29000`;
  }

  // 4. PET / PETSDOC
  if (domain === "pet") {
    if (isUrdu) {
      return `🐕 **پالتو جانوروں کی صحت (AZdoc PetsDoc)**

• **چیچر و خارش:** Simparica یا Bravecto گولی پالتو کے وزن کے مطابق دیں؛ Cothivet اسپرے زخموں پر لگائیں۔
• **قے و پیچش:** ORS پانی میں ملا کر پلائیں؛ فوری ویٹرنری کلینک لے جائیں۔`;
    }
    return `🐕 **Pet Health & Vet Care (AZdoc PetsDoc)**

• **Ticks, Fleas & Mange:** Administer Simparica or Bravecto chewable per pet body weight; apply Cothivet topical spray.
• **Vomiting & Diarrhea:** Keep hydrated with ORS solution; consult a vet if symptoms persist > 24h.`;
  }

  // 5. HUMAN / HEALTHDOC
  if (isUrdu) {
    return `🩺 **AZdoc AI طبی معاون (HealthDoc)**

آپ کے سوال کی بنیاد پر رہنمائی:
• اپنی علامات تفصیل سے بتائیں تاکہ بہتر تشخیص ہو سکے
• کیمرے سے تصویر بھیجیں — فوری AI بصری تشخیص ملے گی
• بخار یا جسم درد: **Tab. Paracetamol 500mg** دن میں 3 بار (کھانے کے بعد)

**ایمرجنسی:** 1122 | **صحت:** 0800-88000
⚠️ *یہ AI رہنمائی ہے — حتمی تصدیق کے لیے ڈاکٹر سے رجوع کریں۔*`;
  }

  return `🩺 **AZdoc AI Clinical Assistant (HealthDoc)**

Based on your query, here is our guidance:
• Please describe your symptoms in detail for an accurate diagnosis
• Use the 📷 Camera button to send a photo for instant AI visual analysis
• For fever or mild pain: **Paracetamol 500mg** every 6 to 8 hours after meals

**Emergency:** 1122 | **Health Helpline:** 0800-88000
⚠️ *AI guidance only — confirm with a licensed physician.*`;
}
