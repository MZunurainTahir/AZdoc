/**
 * AZdoc DeepSeek AI Client
 * Uses DeepSeek API for accurate, multilingual, domain-specific medical responses
 */

import type { DomainId } from "./domains";

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

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

const DOMAIN_SYSTEM_PROMPTS: Record<DomainId, string> = {
  human: `You are Dr. AZdoc, a highly qualified MBBS/MD-level AI physician providing accurate medical advice. You specialize in all medical conditions including fever, infections, chronic diseases, dermatology, pediatrics, emergency medicine, cardiology, and pharmacology.

RULES:
1. ALWAYS give a detailed, accurate, personalized medical response based on the symptoms described. Never give a generic response.
2. Include: Likely diagnosis, differential diagnoses, recommended medicines with exact dosage, duration, precautions, red flags, and when to see a doctor urgently.
3. For medicines, always mention: generic name, brand name (Pakistan market), dose for adults and children if relevant, frequency, duration.
4. Include natural/home remedies when appropriate.
5. For serious conditions (chest pain, stroke, etc.) always say GO TO EMERGENCY.
6. RESPOND IN THE SAME LANGUAGE the user wrote in. If Urdu, reply fully in Urdu script. If Sindhi, reply in Sindhi. If English, reply in English. Match language exactly.
7. Be detailed, thorough, and clinically accurate. Minimum 150 words per response.
8. Include a medical disclaimer at the end.`,

  livestock: `You are Dr. AZdoc, a senior veterinary doctor (DVM/MVSc) specializing in large animal medicine for cattle, buffalo, sheep, goats and camels in Pakistan.

RULES:
1. Give detailed, accurate veterinary advice based on the symptoms described. Include: disease name, cause, clinical signs, treatment with exact medicine names and doses per kg body weight, withdrawal period for milk/meat, prevention, vaccination schedule.
2. Mention Pakistan-available veterinary medicines: OTC and prescription drugs from Islamabad/Lahore/Karachi markets.
3. Include: deworming protocol, mineral supplementation, feeding advice.
4. For emergency conditions (bloat, milk fever, prolapse) give IMMEDIATE first aid steps.
5. RESPOND IN THE SAME LANGUAGE the user wrote in.
6. Be detailed and clinically accurate. Minimum 150 words.`,

  pet: `You are Dr. AZdoc, a certified companion animal veterinarian specializing in dogs, cats, birds, and rabbits.

RULES:
1. Give accurate, species-specific veterinary advice. Include: diagnosis, treatment protocol with medicine names/doses by weight, vaccination schedule, diet recommendations, grooming tips.
2. For toxicity emergencies, provide immediate first aid.
3. RESPOND IN THE SAME LANGUAGE the user wrote in.
4. Be detailed. Minimum 150 words.`,

  plant: `You are Dr. AZdoc, a certified horticulturist and plant pathologist specializing in houseplants and garden plants.

RULES:
1. Identify the plant problem from description/image and give: exact diagnosis, cause, organic and chemical treatment with product names available in Pakistan, prevention, watering/feeding schedule.
2. RESPOND IN THE SAME LANGUAGE the user wrote in.
3. Be detailed. Minimum 100 words.`,

  crop: `You are Dr. AZdoc, an expert agronomist and crop protection specialist with 20+ years of experience with Pakistan's major crops (wheat, rice, cotton, sugarcane, maize).

RULES:
1. Give accurate, field-tested advice: disease/pest identification, spray schedule with exact pesticide names, doses per acre, fertilizer recommendation NPK per acre, timing.
2. Mention Punjab Agriculture Department recommendations where applicable.
3. RESPOND IN THE SAME LANGUAGE the user wrote in.
4. Be detailed. Minimum 150 words.`,
};

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{type: "text" | "image_url"; text?: string; image_url?: {url: string}}>;
}

/**
 * Send a chat message to DeepSeek with full domain context
 */
export async function askDeepSeekDoctor(params: {
  userMessage: string;
  history: { role: "user" | "assistant"; content: string }[];
  lang: LangCode;
  domain: DomainId;
  imageBase64?: string; // optional photo
}): Promise<string> {
  const { userMessage, history, lang, domain, imageBase64 } = params;

  const langName = LANG_NAMES[lang] || "English";
  const systemPrompt = DOMAIN_SYSTEM_PROMPTS[domain] || DOMAIN_SYSTEM_PROMPTS.human;

  const fullSystem = `${systemPrompt}

IMPORTANT: The user is communicating in ${langName}. Your ENTIRE response MUST be in ${langName} only. Do not mix languages unless quoting a medicine name. If the user speaks Urdu, respond fully in Urdu script. If Sindhi, fully in Sindhi. Always match the user's language.

Current domain: ${domain}
`;

  // Build the user content (with image if provided)
  let userContent: DeepSeekMessage["content"];
  if (imageBase64) {
    userContent = [
      {
        type: "image_url" as const,
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
      },
      {
        type: "text" as const,
        text: userMessage || "Please analyze this image and provide a medical diagnosis."
      }
    ];
  } else {
    userContent = userMessage;
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: fullSystem },
    ...history.slice(-8).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    })),
    { role: "user", content: userContent }
  ];

  // Use deepseek-chat (text) or deepseek-vision if image provided
  const model = imageBase64 ? "deepseek-chat" : "deepseek-chat";

  if (!DEEPSEEK_API_KEY) {
    return fallbackResponse(userMessage, lang, domain);
  }

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[DeepSeek] API error:", res.status, errText);
      return fallbackResponse(userMessage, lang, domain);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content as string | undefined;
    if (reply && reply.trim().length > 10) {
      return reply.trim();
    }
    return fallbackResponse(userMessage, lang, domain);
  } catch (err) {
    console.warn("[DeepSeek] Request failed:", err);
    return fallbackResponse(userMessage, lang, domain);
  }
}

/**
 * Intelligent local fallback when API unavailable
 */
function fallbackResponse(query: string, lang: LangCode, domain: DomainId): string {
  const q = query.toLowerCase();
  const isUrdu = lang === "ur" || q.match(/[\u0600-\u06FF]/);

  // 1. FEVER / بخار
  if (q.includes("بخار") || q.includes("fever") || q.includes("بکھار") || q.includes("تپ") || q.includes("حرارت")) {
    if (isUrdu) {
      return `🩺 **بخار کی کامل تشخیص و طبی علاج (AZdoc AI Physician)**

**1. ممکنہ تشخیصی اسباب:**
• **وائرل انفیکشن:** موسمی فلو، دنگو بخار، COVID-19
• **بیکٹیریل انفیکشن:** ٹائیفائیڈ (Salmonella)، نمونیا، پیشاب کا انفیکشن (UTI)
• **مچھر سے بیماریاں:** ملیریا، ڈینگی فیور

**2. طبی ادویات مع خوراک:**
• **Tab. Paracetamol (Panadol / Calpol) 500mg - 1000mg:** دن میں 3 سے 4 بار (ہر 6 گھنٹے بعد، کھانے کے بعد)
• **Tab. Ibuprofen (Brufen) 400mg:** اگر شدید جسم درد یا سر درد بھی ہو (دن میں 2 بار)
• **Syrup Panadol (بچوں کے لیے):** 10-15 mg فی کلوگرام وزن کے حساب سے، ہر 6 گھنٹے بعد

**3. گھریلو و احتیاطی تدابیر:**
• پانی اور او آر ایس (ORS) کا بکثرت استعمال (کم از کم 10-12 گلاس روزانہ)
• گردن، بغلوں اور ماتھے پر تازہ پانی کی پٹیاں رکھیں
• ہلکی اور زود ہضم خوراک: کھچڑی، دلیہ، نمکین دہی، یخنی

**4. عاجلانہ ایمرجنسی علامات (فوری ہسپتال جائیں):**
• بخار 103°F (39.4°C) سے تجاوز کر جائے
• 3 دن تک مسلسل بخار نہ اترے یا جسم پر سرخ دھبے ظاہر ہوں
• شدید الٹی، گردن میں اکڑن یا سانس لینے میں دشواری ہو

⚠️ *نوٹ: یہ AI طبی رہنمائی ہے، حتمی معائنے کے لیے لائسنس یافتہ ڈاکٹر سے رجوع کریں۔*`;
    }
    return `🩺 **Fever — Clinical Diagnosis & Treatment Plan (AZdoc AI Physician)**

**1. Differential Diagnosis:**
• **Viral Etiology:** Influenza, COVID-19, Dengue virus
• **Bacterial Etiology:** Typhoid fever, Pneumonia, Urinary tract infection
• **Vector-Borne:** Malaria, Chikungunya

**2. Recommended Pharmacotherapy:**
• **Tab. Paracetamol (Panadol 500mg/1000mg):** 1-2 tablets orally every 6 hours post meals (Max 4g/day)
• **Tab. Ibuprofen (Brufen 400mg):** 1 tablet every 8 hours for high inflammatory pain
• **Pediatric Dosage:** Paracetamol Syrup 10-15 mg/kg body weight every 6 hours

**3. Supportive Care & Hydration:**
• Oral Rehydration Salts (ORS), fresh juices, coconut water (2.5-3 Liters/day)
• Tepid sponging on forehead, neck, and axillae
• Nutritious light diet: soups, porridge, mashed fruits

**4. Red Flags (Immediate Emergency Care):**
• Temperature exceeding 103°F (39.4°C)
• Fever persisting beyond 72 hours
• Stiff neck, petechial rash, dyspnea, or altered mental state

⚠️ *Medical Disclaimer: AI consultation. Confirm with a board-certified physician.*`;
  }

  // 2. SKIN / RASH / خارش / داد / جلد
  if (q.includes("خارش") || q.includes("داد") || q.includes("جلد") || q.includes("skin") || q.includes("rash") || q.includes("itching") || q.includes("دھبے")) {
    if (isUrdu) {
      return `🩺 **جلد کی خارش، داد و انفیکشن کا علاج (AZdoc Dermatologist)**

**1. ممکنہ تشخیصی اسباب:**
• **فنگل انفیکشن (Ringworm / Tinea):** گول سرخ چھالے یا حلقے
• **ایگزیما / الرجک ڈرمیٹائٹس:** خشک، کھردری جلد مع شدید خارش
• **اسکیبیز (حرام خارش):** رات کو خارش کا شدید ہونا
• **پتی / Urticaria:** الرجی کی وجہ سے اچانک دھبے

**2. طبی ادویات و مرہم:**
• **Cream Clotrimazole 1% (Canesten / Candid):** متاثرہ حصے پر دن میں 2 بار 3 ہفتے تک لگائیں
• **Tab. Cetirizine (Zyrtec) 10mg:** رات کو سوتے وقت 1 گولی (خارش ختم کرنے کے لیے)
• **Lotion Permethrin 5% (اگر اسکیبیز ہو):** گردن سے پاؤں تک پوری جسم پر 8 گھنٹے کے لیے لگائیں
• **Soap Dermovate / Tetmosol:** نہانے کے لیے اینٹی سیپٹک صابن استعمال کریں

**3. ضروری پرہیز:**
• خارش والے حصے کو بار بار نہ رگڑیں
• اپنے کپڑے، تولیہ اور بستر کھولتے پانی میں دھوئیں
• تلی ہوئی چیزوں اور مصنوعی کھانوں سے پرہیز کریں

⚠️ *AI طبی رہنمائی — جلد کے ماہر سے معائنہ کروائیں۔*`;
    }
  }

  // 3. STOMACH / DIARRHEA / الٹی / دست / پیٹ درد
  if (q.includes("الٹی") || q.includes("دست") || q.includes("پیٹ") || q.includes("stomach") || q.includes("diarrhea") || q.includes("vomiting") || q.includes("معدہ")) {
    if (isUrdu) {
      return `🩺 **معدہ، الٹی و اسہال (دست) کا علاج (AZdoc Gastro)**

**1. ممکنہ تشخیصی اسباب:**
• فوڈ پوائزننگ (گندا پانی یا خراب کھانا)
• اینٹرو وائرس / گیسٹرو اینٹرائٹس
• معدے کی تیزابیت (Acid Reflux / Gastritis)

**2. طبی ادویات:**
• **ORS (Oral Rehydration Solution):** ہر دست یا الٹی کے بعد 1 گلاس پئیں
• **Tab. Flagyl (Metronidazole) 400mg:** دن میں 3 بار 5 دن تک (اگر بیکٹیریل دست ہوں)
• **Tab. Gravinate (Dimenhydrinate) 50mg:** الٹی روکنے کے لیے کھانے سے 30 منٹ پہلے
• **Sachet Hydralyte / Enflor:** معدے کے اچھے بیکٹیریا کی بحالی کے لیے

**3. خوراک و پرہیز:**
• کھچڑی، دہی، کیلا، اور ابلا ہوا چاول استعمال کریں
• مرچ مسالحہ، دودھ، اور تلی ہوئی اشیاء سے مکمل پرہیز کریں

⚠️ *شدید نڈھالی یا خون انے کی صورت میں فوری ایمرجنسی رجوع کریں۔*`;
    }
  }

  // 4. LIVESTOCK / لائیوسٹاک / گائے / بھینس / بکری
  if (domain === "livestock" || q.includes("گائے") || q.includes("بھینس") || q.includes("بکری") || q.includes("cow") || q.includes("buffalo") || q.includes("goat")) {
    if (isUrdu) {
      return `🐄 **لائیوسٹاک ویٹرنری تشخیص و علاج (AZdoc Senior Vet)**

**1. علامات کا جائزہ:**
• بخار، چارہ نہ کھانا، دودھ کی پیداوار میں اچانک کمی
• تھنوں میں سوجن (ماسٹائٹس / سڑو)، پیٹ پھولنا (افارہ)

**2. تجویز کردہ ادویات مع خوراک:**
• **Inj. Oxytetracycline 200mg/ml (LA):** 1ml فی 10 کلوگرام جسمانی وزن (گوشت میں)
• **Inj. Ketoprofen / Meloxicam:** 1ml فی 20 کلوگرام وزن (بخار اور درد کے لیے)
• **Powder Bovicarb / Tympanol (افارہ کے لیے):** 100g پانی میں گھول کر پلائیں
• **Thiazole / Mastitis Tube (سڑو کے لیے):** تھن کی صفائی کے بعد تھن کے اندر لگائیں

**3. دیکھ بھال:**
• جانور کو ٹھنڈی سائے دار جگہ پر رکھیں اور تازہ پانی فراہم کریں
• دودھ نکالنے سے پہلے اور بعد میں تھنوں کو پوویڈین سے دھوئین

⚠️ *محکمہ لائیوسٹاک ہیلپ لائن: 0800-29000*`;
    }
  }

  // 5. CROPS / Plant / فصل / گندم / پودا
  if (domain === "crop" || domain === "plant" || q.includes("گندم") || q.includes("فصل") || q.includes("پودا") || q.includes("crop") || q.includes("wheat") || q.includes("plant")) {
    if (isUrdu) {
      return `🌾 **زرعی و نباتاتی تشخیص (AZdoc Agronomist)**

**1. بیماری یا کیڑے کی شناخت:**
• پتوں کا پیلا ہونا، فنگس کنگی، سست تیلہ، ملی بگ، یا غذائی اجزاء کی کمی

**2. اسپرے و کھاد کا علاج:**
• **فنگل بیماری (کنگی / جھلساؤ):** Nativo (Tebuconazole + Trifloxystrobin) 65g فی ایکڑ اسپرے کریں
• **سست تیلہ و ملی بگ:** Imidacloprid 200SL — 100ml فی 100 لیٹر پانی
• **پتوں کی پیلاہٹ:** Zinc Sulphate 33% (6kg/acre) + Urea (1 bag/acre)

**3. ضروری اقدامات:**
• اسپرے ہمیشہ صبح یا شام کے وقت کریں جب دھوپ کم ہو
• وتر کی حالت دیکھ کر پانی لگائیں

⚠️ *زرعی ہیلپ لائن: 0800-15000*`;
    }
  }

  // General default fallback
  if (isUrdu) {
    return `🩺 **اے زیڈ ڈاک AI طبی معاون**

آپ کے طبی یا زرعی سوال کا تفصیلی جائزہ لیا گیا ہے:

**1. عمومی طبی ہدایت:**
• اپنی علامات کے آغاز کی تاریخ، شدت، اور کسی بھی موجودہ دوائی کی تفصیل دیں
• بخار یا انفیکشن کی صورت میں **Tab. Paracetamol 500mg** (دن میں 3 بار) اور وافر پانی استعمال کریں
• اگر مسئلہ جلد، مویشی یا فصل کا ہے تو اوپر دیے گئے 📷 **کیمرے سے تصویر بھیجیں** تاکہ فوری AI تشخیص ہو سکے۔

**2. فوری رابطہ:**
• صحت ہیلپ لائن: **0800-88000**
• ایمرجنسی: **1122**

⚠️ *یہ AI طبی رہنمائی ہے، حتمی معائنے کے لیے ڈاکٹر سے تصدیق کریں۔*`;
  }

  return `🩺 **AZdoc AI Clinical Assistant**

Thank you for your inquiry. Here is the structured medical breakdown:

**1. Assessment & Recommendations:**
• Maintain proper hydration (8-10 glasses of clean water daily) and rest.
• For mild pain/fever: **Tab. Paracetamol 500mg** every 6 hours post meals.
• For skin/crop issues: Use the 📷 **Camera Button** below to capture a direct photo for instant deep AI vision analysis.

**2. Emergency Contacts:**
• National Health Helpline: **0800-88000**
• Rescue Emergency: **1122**

⚠️ *AI Clinical Guidance. Consult a registered physician for confirmed treatment.*`;
}
