/**
 * AZdoc AI Doctor Client — v3.0
 * Uses Gemini 2.0 Flash for vision (image) analysis + DeepSeek for text responses.
 * Achieves maximum accuracy for all domains: Human, Livestock, Pet, Plant, Crop.
 */

import type { DomainId } from "./domains";

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
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
   b) CLINICAL EXPLANATION (pathophysiology briefly)
   c) MEDICINE NAMES: generic name + Pakistan brand name + dose (adult & child) + frequency + duration
   d) HOME REMEDIES & supportive care
   e) RED FLAGS — when to go to EMERGENCY IMMEDIATELY
   f) FOLLOW UP: when to see a doctor, what tests (CBC, Urine RE, etc.)
3. For IMAGES: Analyze carefully. Identify the exact condition visible (skin lesion type, rash pattern, wound characteristics, eye condition, etc.). Give clinical accuracy.
4. LANGUAGE RULE: Respond 100% in the user's language. If Urdu → full Urdu script. If Sindhi → full Sindhi. Exact match.
5. Minimum 200 words per response. Be thorough.
6. For CHEST PAIN / STROKE / BREATHING DIFFICULTY: say GO TO EMERGENCY NOW.
7. Include Pakistani emergency numbers: 1122 (Rescue), 115 (Edhi), 0800-88000 (Health Helpline).
8. End with a short medical disclaimer.`,

  livestock: `You are Dr. AZdoc, a senior DVM (Doctor of Veterinary Medicine) with 15+ years specializing in large animals: cattle, buffalo, goat, sheep, camel in Pakistan.

CORE RULES:
1. For every case provide:
   a) DISEASE NAME (Urdu + English): e.g., منہ کھر (FMD), سڑو (Mastitis)
   b) CAUSE & PATHOPHYSIOLOGY
   c) CLINICAL SIGNS to confirm
   d) TREATMENT: exact medicine names (Pakistan market), doses in ml/kg body weight, route (IM/IV/SC/oral), duration
   e) WITHDRAWAL PERIOD for milk and meat
   f) PREVENTION & VACCINATION SCHEDULE
   g) FEEDING & SUPPORTIVE CARE
2. For IMAGES: Identify the visible lesion/condition on the animal. Describe what you see (skin texture, lesion type, eye appearance, hoof condition, udder swelling etc.)
3. EMERGENCY conditions (bloat/Tympany, milk fever, prolapse, obstructed parturition): give IMMEDIATE first aid before vet arrives.
4. Mention Pakistan Livestock Helpline: 0800-29000
5. LANGUAGE RULE: Respond 100% in user's language.
6. Minimum 200 words. Include all dose specifics.`,

  pet: `You are Dr. AZdoc, a certified companion animal veterinarian (BVMS) specializing in dogs, cats, birds, rabbits, and hamsters.

CORE RULES:
1. For every case provide:
   a) DIAGNOSIS with species-specific considerations
   b) TREATMENT: medicine names, dose by weight (mg/kg), frequency, route, duration
   c) VACCINATION SCHEDULE (puppies, kittens, adult boosters)
   d) DIET & NUTRITION recommendations
   e) HOME CARE: grooming, environment, hygiene
   f) WHEN TO SEE VET URGENTLY
2. For IMAGES: Describe what you see (skin condition, coat, eye clarity, ear canal, body posture, lesion characteristics). Give accurate visual diagnosis.
3. For TOXICITY EMERGENCIES (chocolate, onion, xylitol, antifreeze): immediate first aid protocol.
4. LANGUAGE RULE: Respond 100% in user's language.
5. Minimum 150 words.`,

  plant: `You are Dr. AZdoc, a certified PhD Horticulturist and Plant Pathologist specializing in houseplants, ornamental plants, and garden plants.

CORE RULES:
1. For every case provide:
   a) DISEASE/PROBLEM DIAGNOSIS: exact name (fungal/bacterial/viral/pest/nutrient deficiency)
   b) VISUAL SYMPTOMS to confirm (leaf color, texture, pattern, stem/root appearance)
   c) CAUSE: environmental stress, pathogen, pest, watering issue
   d) ORGANIC TREATMENT: neem oil, baking soda, garlic spray, compost, etc.
   e) CHEMICAL TREATMENT: product names available in Pakistan, dose, application method
   f) PREVENTION: proper watering schedule, fertilizer NPK ratio, light requirements, pot media
2. For IMAGES: Analyze the plant photo carefully. Identify:
   - Plant species if recognizable
   - Type of damage: yellowing pattern (interveinal = Mg deficiency; overall = N deficiency), spots, lesions, wilting, pest presence
   - Severity (early/moderate/severe)
   Give an accurate visual diagnosis.
3. LANGUAGE RULE: Respond 100% in user's language.
4. Minimum 150 words.`,

  crop: `You are Dr. AZdoc, an expert Agronomist and Crop Protection Specialist with 20+ years working with Punjab Agriculture Department on major Pakistan crops: wheat (گندم), rice (چاول), cotton (کپاس), sugarcane (گنا), maize (مکئی), and vegetables.

CORE RULES:
1. For every case provide:
   a) DISEASE/PEST IDENTIFICATION: exact name (Urdu + English + scientific name)
   b) DIAGNOSTIC FEATURES: how to confirm visually
   c) SPRAY SCHEDULE: specific pesticide/fungicide names (Pakistan brands), dose per acre, water per acre, timing
   d) FERTILIZER RECOMMENDATIONS: NPK per acre, timing, method (urea, DAP, SOP)
   e) CRITICAL TIMING: crop growth stage, spray window, re-entry interval
   f) INTEGRATED PEST MANAGEMENT: biological/cultural control options
2. For IMAGES: Analyze the crop photo carefully. Identify:
   - Crop type and growth stage
   - Disease: rust, blight, smut, mosaic, leaf spot — describe the visual pattern
   - Pest: describe the insect/damage pattern
   - Nutrient deficiency: identify from yellowing/coloration pattern
   Give precise visual diagnosis.
3. LANGUAGE RULE: Respond 100% in user's language.
4. Mention Punjab Agriculture Department helpline where relevant: 0800-15000
5. Minimum 200 words.`,
};

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

/**
 * Main AI Doctor function — Routes to best available model
 * Text: DeepSeek → Groq (fallback) → OpenRouter (fallback)
 * Images: OpenRouter Gemini Flash Vision → DeepSeek (fallback)
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

LANGUAGE INSTRUCTION: The user is communicating in ${langName}. Your ENTIRE response MUST be written in ${langName} only. Do not switch languages. If the user speaks Urdu, respond in full Urdu script. If Punjabi, in Punjabi. If English, in English. Match exactly.

Current consultation domain: ${domain}`;

  // ── IMAGE PATH: OpenRouter with Gemini 2.0 Flash (best vision accuracy) ───
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

  // ── TEXT PATH: DeepSeek → Groq → OpenRouter ───────────────────────────────
  const messages: DeepSeekMessage[] = [
    { role: "system", content: fullSystem },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // 1. DeepSeek (primary — best for structured medical responses)
  if (DEEPSEEK_API_KEY) {
    try {
      const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature: 0.25,
          max_tokens: 1500,
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 20) return reply.trim();
      }
    } catch (err) {
      console.warn("[DeepSeek] Failed:", err);
    }
  }

  // 2. Groq Llama (fast fallback for text)
  if (GROQ_API_KEY) {
    try {
      const groqMessages = messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.25,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 20) return reply.trim();
      }
    } catch (err) {
      console.warn("[Groq] Failed:", err);
    }
  }

  // 3. OpenRouter (final text fallback)
  if (OPENROUTER_API_KEY) {
    try {
      const orMessages = messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));
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
          messages: orMessages,
          temperature: 0.25,
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 20) return reply.trim();
      }
    } catch (err) {
      console.warn("[OpenRouter] Failed:", err);
    }
  }

  return fallbackResponse(userMessage, lang, domain);
}

/**
 * Analyzes images using OpenRouter with Gemini 2.0 Flash Experimental (best vision model)
 * Falls back to OpenRouter Claude/GPT-4V if needed.
 */
async function analyzeImageWithVision(params: {
  imageBase64: string;
  userMessage: string;
  systemPrompt: string;
  domain: DomainId;
  lang: LangCode;
}): Promise<string | null> {
  const { imageBase64, userMessage, systemPrompt, domain, lang } = params;

  // Determine image mime type
  const mimeType = imageBase64.startsWith("/9j") ? "image/jpeg" : "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const visionSystemPrompt = `${systemPrompt}

VISION ANALYSIS INSTRUCTIONS:
- You are analyzing a medical/agricultural/veterinary image.
- Examine the image VERY carefully and thoroughly.
- Describe exactly what you see: colors, textures, patterns, lesion characteristics, affected areas.
- Provide a CONFIDENT, SPECIFIC diagnosis based on the visual evidence.
- Do NOT say "I cannot analyze images" — you CAN and MUST analyze this image.
- Give actionable treatment recommendations based on what you observe.
- Domain: ${domain}`;

  const visionUserMessage = userMessage || getDomainImagePrompt(domain, lang);

  // 1. OpenRouter → Gemini 2.0 Flash (best free vision model)
  if (OPENROUTER_API_KEY) {
    const models = [
      "google/gemini-2.0-flash-exp:free",
      "google/gemini-flash-1.5",
      "anthropic/claude-3-haiku",
      "openai/gpt-4o-mini",
    ];

    for (const model of models) {
      try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://azdoc.vercel.app",
            "X-Title": "AZdoc AI Doctor Vision",
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
            max_tokens: 1500,
          }),
          signal: AbortSignal.timeout(35000),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content as string | undefined;
          if (reply && reply.trim().length > 30) {
            console.info(`[Vision] Success with model: ${model}`);
            return reply.trim();
          }
        }
      } catch (err) {
        console.warn(`[Vision] Model ${model} failed:`, err);
      }
    }
  }

  // 2. DeepSeek vision fallback
  if (DEEPSEEK_API_KEY) {
    try {
      const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
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
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) return reply.trim();
      }
    } catch (err) {
      console.warn("[DeepSeek Vision] Failed:", err);
    }
  }

  // 3. Groq vision (llava)
  if (GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llava-v1.5-7b-4096-preview",
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
          max_tokens: 1200,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content as string | undefined;
        if (reply && reply.trim().length > 30) return reply.trim();
      }
    } catch (err) {
      console.warn("[Groq LLaVA] Failed:", err);
    }
  }

  return null;
}

function getDomainImagePrompt(domain: DomainId, lang: LangCode): string {
  const prompts: Record<DomainId, Record<string, string>> = {
    human: {
      ur: "اس تصویر کا طبی تجزیہ کریں۔ جلد کی حالت، زخم، آنکھ یا جو بھی نظر آئے اسکی درست تشخیص اور علاج بتائیں۔",
      en: "Analyze this medical image. Identify the condition visible (skin lesion, wound, eye problem, rash etc.) and provide accurate diagnosis and treatment.",
    },
    livestock: {
      ur: "اس جانور کی تصویر کا جائزہ لیں۔ جو بیماری یا زخم نظر آئے اسکی تشخیص اور ویٹرنری علاج بتائیں۔",
      en: "Analyze this livestock animal image. Identify any disease, lesion, or abnormality visible and provide veterinary diagnosis and treatment.",
    },
    pet: {
      ur: "اس پالتو جانور کی تصویر سے بیماری کی تشخیص کریں اور علاج بتائیں۔",
      en: "Diagnose the pet's condition from this image and provide treatment recommendations.",
    },
    plant: {
      ur: "اس پودے کی تصویر سے بیماری یا مسئلہ پہچانیں اور علاج بتائیں۔",
      en: "Identify the plant disease, deficiency, or pest problem from this image and provide treatment.",
    },
    crop: {
      ur: "اس فصل کی تصویر سے بیماری یا کیڑے کا تعین کریں اور اسپرے و علاج تجویز کریں۔",
      en: "Identify the crop disease, pest, or deficiency from this image and recommend spray and treatment.",
    },
  };
  const domainPrompts = prompts[domain] || prompts.human;
  return domainPrompts[lang] || domainPrompts.en;
}

/**
 * Intelligent local fallback when all APIs unavailable
 */
function fallbackResponse(query: string, lang: LangCode, domain: DomainId): string {
  const q = query.toLowerCase();
  const isUrdu = lang === "ur" || lang === "pa" || lang === "sd" || lang === "bal" || q.match(/[\u0600-\u06FF]/);

  // FEVER
  if (q.includes("بخار") || q.includes("fever") || q.includes("تپ") || q.includes("حرارت")) {
    if (isUrdu) {
      return `🩺 **بخار کا مکمل طبی علاج (AZdoc AI Doctor)**

**تشخیص:** وائرل یا بیکٹیریل انفیکشن کا امکان

**دوائیں:**
• **Tab. Paracetamol (Panadol) 500mg–1000mg:** ہر 6 گھنٹے بعد (بالغ) | بچے: 15mg/kg
• **Tab. Ibuprofen (Brufen) 400mg:** شدید درد پر ہر 8 گھنٹے بعد (کھانے کے بعد)
• **بخار 39°C سے اوپر:** ٹھنڈے پانی کی پٹیاں لگائیں

**احتیاط:** پانی 10+ گلاس، ہلکی خوراک، آرام
**ایمرجنسی:** بخار 103°F سے اوپر یا 3 دن مسلسل → فوری ہسپتال
⚠️ *1122 | Health Helpline: 0800-88000*`;
    }
    return `🩺 **Fever — Clinical Management (AZdoc AI Doctor)**

**Assessment:** Likely viral/bacterial infection

**Medications:**
• **Paracetamol (Panadol) 500-1000mg:** Every 6 hrs after meals | Children: 15mg/kg
• **Ibuprofen (Brufen) 400mg:** Every 8 hrs for high inflammatory pain
• **Tepid sponging:** For fever > 39°C

**Supportive Care:** 10+ glasses of water, ORS, rest, light diet
**Emergency:** Fever > 103°F for 3+ days → Go to hospital immediately
⚠️ *Emergency: 1122 | Health Helpline: 0800-88000*`;
  }

  // SKIN
  if (q.includes("خارش") || q.includes("جلد") || q.includes("skin") || q.includes("rash") || q.includes("itching")) {
    if (isUrdu) {
      return `🩺 **جلد کی خارش و انفیکشن کا علاج (AZdoc Dermatologist)**

**ممکنہ تشخیص:** فنگل انفیکشن، ایگزیما، یا الرجک رد عمل

**دوائیں:**
• **Cream Clotrimazole 1% (Canesten):** دن میں 2 بار 3 ہفتے
• **Tab. Cetirizine (Zyrtec) 10mg:** رات کو 1 گولی (خارش کے لیے)
• **Lotion Calamine:** فوری ٹھنڈک اور آرام کے لیے

**پرہیز:** خارش نہ رگڑیں، کپڑے ابلتے پانی میں دھوئیں
⚠️ *جلد کے ماہر سے معائنہ کروائیں۔*`;
    }
  }

  // LIVESTOCK
  if (domain === "livestock" || q.includes("گائے") || q.includes("cow") || q.includes("goat")) {
    if (isUrdu) {
      return `🐄 **لائیوسٹاک ویٹرنری علاج (AZdoc Senior Vet)**

**دوائیں:**
• **Inj. Oxytetracycline 200mg/ml:** 1ml فی 10kg وزن (IM)
• **Inj. Meloxicam:** 1ml فی 20kg وزن (بخار و درد)
• **Tympanol Powder (افارہ):** 100g پانی میں حل کر کے پلائیں

**ہیلپ لائن:** 0800-29000
⚠️ *فوری ویٹرنری ڈاکٹر سے رابطہ کریں۔*`;
    }
  }

  // CROP/PLANT
  if (domain === "crop" || domain === "plant" || q.includes("گندم") || q.includes("plant") || q.includes("wheat")) {
    if (isUrdu) {
      return `🌾 **زرعی تشخیص و علاج (AZdoc Agronomist)**

**بیماری کا علاج:**
• **فنگل کنگی:** Nativo 75WG (65g/acre) اسپرے
• **سست تیلہ:** Imidacloprid 200SL (100ml/100L)
• **پتوں کی پیلاہٹ:** Zinc Sulphate 33% (6kg/acre) + Urea

**زرعی ہیلپ لائن:** 0800-15000`;
    }
  }

  // DEFAULT
  if (isUrdu) {
    return `🩺 **AZdoc AI طبی معاون**

آپ کے سوال کی بنیاد پر رہنمائی:
• اپنی علامات تفصیل سے بتائیں تاکہ بہتر تشخیص ہو سکے
• کیمرے سے تصویر بھیجیں — فوری AI بصری تشخیص ملے گی
• بخار یا انفیکشن: **Tab. Paracetamol 500mg** دن میں 3 بار

**ایمرجنسی:** 1122 | **صحت:** 0800-88000
⚠️ *یہ AI رہنمائی ہے — تصدیق کے لیے ڈاکٹر سے ملیں۔*`;
  }

  return `🩺 **AZdoc AI Clinical Assistant**

Based on your query, here is our guidance:
• Please describe your symptoms in detail for a more accurate diagnosis
• Use the 📷 Camera button to send a photo for instant AI visual analysis
• For mild symptoms: **Paracetamol 500mg** every 6 hours after meals

**Emergency:** 1122 | **Health Helpline:** 0800-88000
⚠️ *AI guidance only — confirm with a licensed physician.*`;
}
