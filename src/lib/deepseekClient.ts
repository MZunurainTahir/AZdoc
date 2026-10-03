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

  // Fever keywords in multiple languages
  if (q.includes("بخار") || q.includes("fever") || q.includes("بکھار") || q.includes("تپ")) {
    if (lang === "ur") {
      return `🩺 **بخار کی تشخیص و علاج (AZdoc AI Doctor)**

**ممکنہ وجوہات:**
بخار وائرل انفیکشن (فلو/COVID)، بیکٹیریل انفیکشن (ٹائیفائیڈ، نمونیا)، ملیریا، یا ڈینگی کی علامت ہو سکتا ہے۔

**فوری علاج:**
• **Tab. Paracetamol (Panadol) 500mg** — ہر 6-8 گھنٹے بعد کھانے کے ساتھ (بالغوں کے لیے)
• بچوں کے لیے: **Paracetamol Syrup (Calpol/Panadol)** — 10-15 mg/kg ہر 6 گھنٹے بعد
• **Tab. Ibuprofen (Brufen) 400mg** — اگر درد بھی ہو تو (خالی پیٹ نہیں)

**گھریلو علاج:**
• پانی، لسی، ORS کافی مقدار میں پئیں (دن میں 8-10 گلاس)
• ماتھے اور بغلوں پر ٹھنڈے پانی کی پٹیاں رکھیں
• ہلکی خوراک: کھچڑی، دلیہ، سبزیوں کا شوربہ

**فوری ڈاکٹر کے پاس جائیں اگر:**
• بخار 103°F / 39.4°C سے اوپر جائے
• 3 دن میں بخار نہ اترے
• شدید سر درد، گردن اکڑنا، جلد پر سرخ دھبے ہوں
• بچہ 3 ماہ سے کم عمر ہو

⚠️ *یہ AI طبی رہنمائی ہے، لائسنس یافتہ معالج سے تصدیق ضروری ہے۔*`;
    } else {
      return `🩺 **Fever — Diagnosis & Treatment (AZdoc AI Doctor)**

**Possible Causes:**
Viral infection (flu, COVID-19), bacterial infection (typhoid, pneumonia), malaria, dengue, or UTI.

**Immediate Treatment:**
• **Tab. Paracetamol (Panadol/Calpol) 500-1000mg** every 6-8 hours with food (adults)
• Children: **Paracetamol Syrup** — 10-15 mg/kg every 6 hours
• **Tab. Ibuprofen (Brufen) 400mg** every 8 hours if pain is also present (not on empty stomach)

**Home Management:**
• Drink plenty of fluids: water, ORS, coconut water, soups (8-10 glasses/day)
• Apply cool wet cloths to forehead and armpits
• Light diet: khichdi, soup, boiled vegetables

**Go to Emergency if:**
• Temperature above 103°F / 39.4°C
• Fever persists beyond 3 days
• Severe headache, neck stiffness, skin rash
• Child under 3 months old with any fever

⚠️ *This is AI-generated guidance. Always consult a licensed physician for confirmation.*`;
    }
  }

  // Skin problems
  if (q.includes("خارش") || q.includes("داد") || q.includes("جلد") || q.includes("skin") || q.includes("rash") || q.includes("itching")) {
    if (lang === "ur") {
      return `🩺 **جلد کی خارش و داد — AZdoc AI Doctor**

**ممکنہ تشخیص:**
1. فنگل انفیکشن (داد / Ringworm) — گول لال حلقے
2. ایگزیما — خشک، کھردری جلد مع خارش
3. اسکیبیز (خارش) — رات کو زیادہ خارش
4. الرجی رش — کیمیکل یا خوراک سے

**علاج:**
• **فنگل:** Clotrimazole 1% cream (Candid/Canesten) — دن میں 2 بار 3-4 ہفتے تک
• **ایگزیما:** Hydrocortisone 1% cream — ہفتے میں 5 دن، پھر بند
• **خارش (Scabies):** Permethrin 5% cream — پوری جسم پر رات بھر
• **الرجی:** Tab. Cetirizine (Zyrtec) 10mg — رات کو 1 گولی

**پرہیز:**
• متاثرہ حصے کو خشک رکھیں، زیادہ خارش نہ کریں
• اپنے کپڑے اور تولیہ الگ دھوئیں

⚠️ *AI طبی رہنمائی — ڈاکٹر سے تصدیق کروائیں۔*`;
    }
  }

  // Blood pressure
  if (q.includes("بلڈ پریشر") || q.includes("blood pressure") || q.includes("bp") || q.includes("hypertension")) {
    if (lang === "ur") {
      return `🩺 **بلڈ پریشر (ہائی بی پی) — AZdoc AI Doctor**

**نارمل BP:** 120/80 mmHg
**ہائی BP (Hypertension):** 140/90 سے اوپر

**فوری اقدامات (اگر BP بہت زیادہ ہو):**
• ایک جگہ بیٹھ کر گہری سانسیں لیں — 5 منٹ تک
• **Tab. Amlodipine (Norvasc) 5mg** — ڈاکٹر کی ہدایت پر روزانہ صبح
• **Tab. Losartan 50mg** — متبادل دوا

**پرہیز:**
• نمک بالکل کم کریں (دن میں 1 چائے کا چمچ سے کم)
• چائے، کافی، سگریٹ بند کریں
• روزانہ 30 منٹ چلیں

**فوری ڈاکٹر کے پاس جائیں اگر:**
• BP 180/120 سے اوپر ہو
• شدید سر درد، نظر دھندلی، سینے میں درد ہو

⚠️ *AI رہنمائی — ڈاکٹر سے BP دوائیں تجویز کروائیں۔*`;
    }
  }

  // Generic domain-specific fallback
  const genericByDomain: Partial<Record<DomainId, string>> = {
    livestock: lang === "ur"
      ? `🐄 **اے زیڈ ڈاک لائیوسٹاک ویٹ**\n\nآپ کے سوال کی بنیاد پر:\n• جانور کی علامات نوٹ کریں (بخار، خوراک نہ کھانا، پیدا وار کم)\n• قریبی ویٹرنری ڈاکٹر سے رابطہ کریں\n• **Oxytetracycline 200mg/ml** — مختلف بیماریوں میں 1ml/10kg\n• پانی کافی مقدار میں دیں\n• ہیلپ لائن: 0800-29000 (محکمہ لائیوسٹاک پنجاب)`
      : `🐄 **AZdoc Livestock Vet**\n\nFor your livestock concern:\n• Monitor: Temperature, feed intake, milk production\n• Contact your nearest livestock extension officer\n• **Oxytetracycline 200mg/ml** injection at 1ml/10kg for infections\n• Ensure adequate clean water and shade\n• Punjab Livestock Helpline: 0800-29000`,
  };

  return genericByDomain[domain] || (lang === "ur"
    ? `🩺 **اے زیڈ ڈاک AI ڈاکٹر**\n\nآپ کی علامات کی بنیاد پر براہ کرم مزید تفصیل فراہم کریں:\n• علامات کب سے ہیں؟\n• کتنا بخار ہے؟\n• کوئی دوا لے رہے ہیں؟\n\nیا فوری مدد کے لیے صحت ہیلپ لائن: **0800-88000** پر کال کریں۔\n\n⚠️ *AI رہنمائی — ڈاکٹر سے تصدیق کروائیں۔*`
    : `🩺 **AZdoc AI Doctor**\n\nPlease provide more details about your symptoms:\n• How long have you had these symptoms?\n• Any fever? What temperature?\n• Any medicines taken already?\n\nFor urgent help: **Rescue 1122** or **Sehat Sahulat Helpline: 0800-88000**\n\n⚠️ *AI-generated guidance — always confirm with a licensed doctor.*`
  );
}
