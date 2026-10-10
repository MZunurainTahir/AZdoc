/**
 * AZdoc AI Doctor — Complete Multilingual Health Assistant v3.0
 * Features:
 *  • Gemini-like live voice input (real-time interim transcripts in any language)
 *  • Camera photo capture + AI image analysis (Gemini 2.0 Flash Vision)
 *  • DeepSeek + Groq + OpenRouter multi-model AI with 200+ word detailed responses
 *  • ElevenLabs TTS audio playback
 *  • Domain-specific AI personas (Human, Livestock, Pet, Plant, Crop)
 *  • Prescription slips & pharmacy linking
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useDomain } from "../context/DomainContext";
import { generateLocalId } from "../lib/db";
import { askDeepSeekDoctor } from "../lib/deepseekClient";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  playTextToSpeech,
  stopTextToSpeech,
  startVoiceRecording,
  type VoiceRecorder,
} from "../lib/speechService";
import {
  Send, Mic, MicOff, Volume2, VolumeX,
  Languages, FileText, Sparkles, X,
  Camera, Upload,
  AlertCircle, RotateCcw, ChevronDown, Wand2,
  ShoppingCart, CheckCircle2,
} from "lucide-react";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { addToCart, MEDICINES } from "../lib/pharmacy";

export interface PrescriptionData {
  diagnosis: string;
  medicines: string[];
  precautions: string[];
  doctorName: string;
  slipTitle?: string;
  domainId?: string;
  catalogItemIds?: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  lang?: SupportedLanguage;
  imageUrl?: string;
  prescription?: PrescriptionData;
}

const CHIPS_BY_LANG: Record<string, Record<string, { label: string; query: string }[]>> = {
  en: {
    human: [
      { label: "🤒 Fever & Body Pain", query: "I have had a fever and body pain since yesterday. Please provide the diagnosis, causes, and recommended medication dosage." },
      { label: "🧴 Skin Rash & Itching", query: "I have red patches on my skin with severe itching. What is the diagnosis and recommended cream?" },
      { label: "💊 Paracetamol Dosage", query: "What is the safe Paracetamol dosage for adults and children?" },
      { label: "🩸 Blood Pressure Care", query: "What are the recommended medicines and lifestyle guidance for high blood pressure?" },
      { label: "🤢 Vomiting & Diarrhea", query: "What is the immediate treatment for vomiting and diarrhea and how to prepare ORS?" },
      { label: "🫁 Cough & Phlegm", query: "What is the best medicine and home remedy for chest cough and phlegm?" },
    ],
    livestock: [
      { label: "🐄 Cow High Fever", query: "My cow has high fever and is not feeding. Please provide diagnosis and veterinary treatment with medicine doses." },
      { label: "🔴 Foot & Mouth (FMD)", query: "My cattle has mouth blisters and hoof sores. What is the treatment for FMD?" },
      { label: "🥛 Mastitis (Udder Swelling)", query: "Udder swelling and abnormal milk in cow. How to treat mastitis with exact medicine doses?" },
      { label: "💨 Bloat Emergency", query: "Goat's stomach is bloated. What is the immediate first aid treatment?" },
    ],
    pet: [
      { label: "🐕 Dog Mange & Itching", query: "My dog is scratching continuously and losing hair. What medicine and dose should I use?" },
      { label: "🕷️ Ticks & Fleas", query: "How to safely remove ticks and fleas from my pet dog and cat?" },
      { label: "💉 Rabies Vaccine", query: "When and where should I get my pet vaccinated against rabies?" },
    ],
    plant: [
      { label: "🍂 Yellow Leaves", query: "My houseplant leaves are turning yellow and falling off. What is the cause and cure?" },
      { label: "🐛 Whiteflies & Pests", query: "How to eliminate whiteflies and mealybugs from indoor plants organically?" },
    ],
    crop: [
      { label: "🌾 Wheat Yellow Rust", query: "What is the recommended fungicide spray and dosage per acre for wheat yellow rust?" },
      { label: "🌱 Fertilizer Per Acre", query: "What is the recommended Urea and DAP fertilizer per acre for wheat crop?" },
    ],
  },
  ur: {
    human: [
      { label: "🤒 بخار و جسم درد", query: "مجھے کل سے بخار ہے اور پورے جسم میں درد ہے، علامات اور علاج بتائیں" },
      { label: "🧴 جلد پر خارش", query: "جلد پر لال دھبے اور شدید خارش ہے، اسباب اور دوائی بتائیں" },
      { label: "💊 پیراسیٹامول خوراک", query: "بڑوں اور بچوں کے لیے پیراسیٹامول کی محفوظ خوراک کیا ہے؟" },
      { label: "🩸 بلڈ پریشر", query: "ہائی بلڈ پریشر کی دوائیں اور گھریلو علاج بتائیں" },
      { label: "🤢 الٹی و دست", query: "الٹی اور دست کے لیے فوری علاج اور ORS بنانے کا طریقہ" },
      { label: "🫁 کھانسی و بلغم", query: "کھانسی اور بلغم کے لیے بہترین دوائی اور گھریلو علاج" },
    ],
    livestock: [
      { label: "🐄 گائے کا بخار", query: "میری گائے کو تیز بخار ہے، چارہ نہیں کھا رہی، علاج اور دوائی کی خوراک بتائیں" },
      { label: "🔴 منہ کھر", query: "بھینس میں منہ کھر کے چھالے ہیں، دوا اور خوراک بتائیں" },
      { label: "🥛 سڑو (ماسٹائٹس)", query: "گائے کے تھن میں سوجن اور دودھ میں تبدیلی — سڑو کا علاج" },
      { label: "💨 افارہ", query: "بکری کا پیٹ پھول گیا ہے، فوری گھریلو علاج کیا ہے؟" },
    ],
    pet: [
      { label: "🐕 کتے کی خارش", query: "کتا بہت خارش کر رہا ہے اور بال جھڑ رہے ہیں، کیا کروں؟" },
      { label: "🕷️ چیچر پسو", query: "بلی اور کتے کے چیچر اور پسو ختم کرنے کا طریقہ" },
      { label: "💉 ریبز ویکسین", query: "کتے کو ریبز کا ٹیکہ کب اور کہاں لگوانا چاہیے؟" },
    ],
    plant: [
      { label: "🍂 پیلے پتے", query: "میرے پودے کے پتے پیلے ہو کر گر رہے ہیں، کیا مسئلہ ہے؟" },
      { label: "🐛 سفید کیڑے", query: "پودوں سے سفید کیڑے اور ملی بگ ختم کرنے کا دیسی طریقہ" },
    ],
    crop: [
      { label: "🌾 گندم کنگی", query: "گندم کی پیلی کنگی کا بہترین اسپرے اور خوراک بتائیں" },
      { label: "🌱 فی ایکڑ کھاد", query: "گندم کے لیے یوریا اور ڈی اے پی کی فی ایکڑ مقدار" },
    ],
  },
};

function getLanguageChips(domainId: string, lang: string) {
  const langDict = CHIPS_BY_LANG[lang] || CHIPS_BY_LANG.en;
  return langDict[domainId] || CHIPS_BY_LANG.en[domainId] || CHIPS_BY_LANG.en.human;
}

const ASSISTANT_CONTENT: Record<string, {
  greetingEn: string; greetingUr: string;
  placeholderEn: string; placeholderUr: string;
}> = {
  human: {
    greetingEn: "🩺 **Assalam-o-Alaikum! I am the AZdoc AI Health Doctor.**\n\nSpeak or type in **any language** — Urdu, English, Punjabi, Sindhi, Pashto, Balochi or Spanish. You can also 📷 **send a photo** of any skin condition, rash, wound, or prescription.\n\nAsk me about fever, infections, chronic diseases, medications, child care, or any medical concern. I give **detailed clinical answers** with medicine names and dosages.",
    greetingUr: "🩺 **السلام علیکم! میں اے زیڈ ڈاک AI ہیلتھ ڈاکٹر ہوں۔**\n\nآپ **اردو، پنجابی، سندھی، پشتو، بلوچی، انگریزی** یا کسی بھی زبان میں بول یا لکھ سکتے ہیں۔ آپ 📷 **تصویر بھی بھیج سکتے ہیں**۔\n\nبخار، انفیکشن، دوائیں، بچوں کی صحت یا کوئی بھی طبی سوال پوچھیں — میں تفصیلی جواب دیتا ہوں۔",
    placeholderEn: "Describe symptoms, ask any medical question, or send a photo…",
    placeholderUr: "علامات بیان کریں، کوئی بھی طبی سوال پوچھیں یا تصویر بھیجیں…",
  },
  livestock: {
    greetingEn: "🐄 **Assalam-o-Alaikum! I'm the AZdoc Livestock Vet.**\n\nAsk about cattle, buffalo, goat, sheep, camel diseases — FMD, mastitis, bloat, LSD, vaccination, feed, milk drop — in any language. I give **detailed veterinary treatment with medicine doses per kg**.",
    greetingUr: "🐄 **السلام علیکم! میں اے زیڈ ڈاک لائیوسٹاک ویٹ ہوں۔**\n\nگائے، بھینس، بکری کی بیماریوں کے بارے میں پوچھیں — منہ کھر، سڑو، افارہ، لمپی، ویکسین، خوراک — کسی بھی زبان میں۔",
    placeholderEn: "Ask livestock health questions in your language…",
    placeholderUr: "مویشیوں کی بیماری کا سوال پوچھیں…",
  },
  pet: {
    greetingEn: "🐾 **Assalam-o-Alaikum! I'm the AZdoc Pet Vet.**\n\nAsk about dogs, cats, birds — mange, ticks, nutrition, parvo, vaccination. Send a 📷 **photo** for visual diagnosis.",
    greetingUr: "🐾 **السلام علیکم! میں اے زیڈ ڈاک پیٹ ویٹ ہوں۔**\n\nبلی، کتے اور پرندوں کی خارش، چیچر، ویکسین کے بارے میں پوچھیں۔ تصویر بھیج کر بھی تشخیص کروائیں۔",
    placeholderEn: "Ask pet health question in any language…",
    placeholderUr: "پالتو جانور کا سوال پوچھیں…",
  },
  plant: {
    greetingEn: "🪴 **Assalam-o-Alaikum! I'm the AZdoc Plant Doctor.**\n\nAsk about garden & indoor plants — yellow leaves, pests, fungus, watering. Send a 📷 **photo** of your plant for instant visual diagnosis.",
    greetingUr: "🪴 **السلام علیکم! میں اے زیڈ ڈاک پلانٹ ڈاکٹر ہوں۔**\n\nپودوں کے مسائل پوچھیں یا تصویر بھیجیں — پیلے پتے، کیڑے، پانی کی کمی — فوری تشخیص کروائیں۔",
    placeholderEn: "Ask about your plants or send a photo…",
    placeholderUr: "پودوں کا سوال پوچھیں یا تصویر بھیجیں…",
  },
  crop: {
    greetingEn: "🌾 **Assalam-o-Alaikum! I'm the AZdoc Crop Doctor.**\n\nAsk about wheat, rice, cotton, sugarcane — diseases, spray dosages per acre, fertilizer schedules. Send 📷 **crop photos** for visual disease identification.",
    greetingUr: "🌾 **السلام علیکم! میں اے زیڈ ڈاک کراپ ڈاکٹر ہوں۔**\n\nگندم کی کنگی، دھان کا جھلساؤ، کپاس کے کیڑے، کھادوں کی مقدار — ہر فصل کا علاج بتاتا ہوں۔ فصل کی تصویر بھیجیں۔",
    placeholderEn: "Ask crop doctor in your language or send a photo…",
    placeholderUr: "فصلوں کی بیماری کا سوال پوچھیں یا تصویر بھیجیں…",
  },
};

function extractPrescription(aiReply: string, domainId: string, domainName: string): PrescriptionData | undefined {
  if (!aiReply || aiReply.length < 25) return undefined;

  const lower = aiReply.toLowerCase();
  const hasMedicalOrAgri =
    lower.includes("mg") || lower.includes("ml") || lower.includes("tab") ||
    lower.includes("spray") || lower.includes("اسپرے") ||
    lower.includes("dose") || lower.includes("dosage") || lower.includes("مقدار") ||
    lower.includes("treatment") || lower.includes("علاج") ||
    lower.includes("fertilizer") || lower.includes("کھاد") ||
    lower.includes("urea") || lower.includes("dap") || lower.includes("یوریا") ||
    lower.includes("fungicide") || lower.includes("pesticide") || lower.includes("کیڑے مار") ||
    lower.includes("rust") || lower.includes("کنگی") || lower.includes("blight") ||
    lower.includes("tilt") || lower.includes("nativo") || lower.includes("mancozeb") ||
    lower.includes("deworm") || lower.includes("oxytetracycline") || lower.includes("ٹیکہ") ||
    lower.includes("paracetamol") || lower.includes("panadol") || lower.includes("brufen") ||
    lower.includes("medicine") || lower.includes("دوا") || lower.includes("پرہیز") ||
    lower.includes("acre") || lower.includes("ایکڑ");

  if (!hasMedicalOrAgri) return undefined;

  const lines = aiReply.split("\n");
  const medicines: string[] = [];
  const precautions: string[] = [];

  for (const rawLine of lines) {
    const trimmedRaw = rawLine.trim();
    // Skip markdown table rows and separator rows — they start with |
    if (trimmedRaw.startsWith("|")) continue;

    const stripped = rawLine.replace(/^[•\-*\d.)\]\s]+/, "").trim();
    if (!stripped || stripped.length < 5) continue;
    const strippedLower = stripped.toLowerCase();

    const isMed =
      strippedLower.includes("tab.") || strippedLower.includes("tablet") ||
      strippedLower.includes("mg") || strippedLower.includes("ml/") || strippedLower.includes("ml ") ||
      strippedLower.includes("syrup") || strippedLower.includes("cream") || strippedLower.includes("ointment") ||
      strippedLower.includes("inj.") || strippedLower.includes("injection") ||
      strippedLower.includes("paracetamol") || strippedLower.includes("panadol") || strippedLower.includes("brufen") ||
      strippedLower.includes("flagyl") || strippedLower.includes("zyrtec") || strippedLower.includes("augmentin") ||
      strippedLower.includes("ors") ||
      strippedLower.includes("spray") || strippedLower.includes("اسپرے") ||
      strippedLower.includes("tilt") || strippedLower.includes("nativo") || strippedLower.includes("propiconazole") ||
      strippedLower.includes("mancozeb") || strippedLower.includes("tebuconazole") || strippedLower.includes("imidacloprid") ||
      strippedLower.includes("urea") || strippedLower.includes("dap") || strippedLower.includes("کھاد") ||
      strippedLower.includes("kg/acre") || strippedLower.includes("ml/acre") || strippedLower.includes("gm/acre") ||
      strippedLower.includes("فی ایکڑ") || strippedLower.includes("گولی") || strippedLower.includes("ٹیکہ") ||
      strippedLower.includes("oxytetracycline") || strippedLower.includes("oxfendazole") || strippedLower.includes("dewormer") ||
      strippedLower.includes("neem oil") || strippedLower.includes("vermicompost");

    const isPrec =
      strippedLower.includes("avoid") || strippedLower.includes("prevent") ||
      strippedLower.includes("rest") || strippedLower.includes("interval") ||
      strippedLower.includes("harvest interval") || strippedLower.includes("water") ||
      strippedLower.includes("consult") || strippedLower.includes("caution") ||
      stripped.includes("پرہیز") || stripped.includes("احتیاط") || stripped.includes("آرام") ||
      stripped.includes("ڈاکٹر سے رجوع");

    if (isMed && !isPrec && medicines.length < 5) {
      const clean = stripped.replace(/\*\*/g, "").slice(0, 110);
      if (!medicines.some(m => m.toLowerCase().includes(clean.toLowerCase().slice(0, 20)))) {
        medicines.push(clean);
      }
    } else if (isPrec && precautions.length < 4) {
      const clean = stripped.replace(/\*\*/g, "").slice(0, 120);
      precautions.push(clean);
    }
  }

  const catalogItemIds: string[] = [];
  let doctorName = "Dr. AZdoc AI Medical Board (MBBS/MD)";
  let slipTitle = "🩺 Clinical Prescription Slip (Rx) — AZdoc AI";
  let defaultDiagnosis = `${domainName} Health Evaluation — AZdoc AI`;

  if (domainId === "crop") {
    doctorName = "Dr. AZdoc Agri Board — Crop Protection Specialist";
    slipTitle = "🌾 Agri Prescription Slip (Rx) — Crop Protection";
    if (lower.includes("rust") || lower.includes("کنگی")) {
      defaultDiagnosis = "Wheat Yellow / Brown Rust (Puccinia striiformis) — گندم کی کنگی";
      catalogItemIds.push("crp-tilt", "crp-nativo");
    } else if (lower.includes("fertiliz") || lower.includes("کھاد") || lower.includes("urea") || lower.includes("dap")) {
      defaultDiagnosis = "Crop Nutritional Management & Fertilizer Protocol";
      catalogItemIds.push("crp-dap", "crp-urea");
    } else {
      defaultDiagnosis = "FasalDoc Crop Health & Agro Protection Protocol";
      catalogItemIds.push("crp-tilt", "crp-urea");
    }

    if (medicines.length === 0) {
      if (lower.includes("rust") || lower.includes("کنگی")) {
        medicines.push(
          "Tilt 250 EC (Propiconazole Syngenta) — 200-250 ml in 100L water per acre spray",
          "Nativo 75 WG (Bayer) — 65g per acre spray alternate foliar application"
        );
      } else {
        medicines.push(
          "Tilt 250 EC / Crop Protection Fungicide — 250ml per acre spray",
          "Sona Urea / DAP — Balanced dosage per acre application"
        );
      }
    }
    if (precautions.length === 0) {
      precautions.push(
        "Spray early morning or late afternoon during low wind conditions",
        "Wait at least 14 days after last spray before harvesting",
        "Use clean water without alkaline salts for chemical tank mixing"
      );
    }
  } else if (domainId === "livestock") {
    doctorName = "Dr. Veterinary Board — AZdoc Livestock Care (DVM)";
    slipTitle = "🐄 Veterinary Prescription Slip (Rx) — Livestock Care";
    defaultDiagnosis = "Veterinary Clinical Diagnosis & Treatment Plan";
    catalogItemIds.push("liv-oxy-inject", "liv-oxfendazole");

    if (medicines.length === 0) {
      medicines.push(
        "Oxytetracycline LA 200mg/ml Injection — 1ml/10kg body weight deep IM",
        "Oxfendazole Broad-Spectrum Dewormer — 1ml/5kg body weight orally"
      );
    }
    if (precautions.length === 0) {
      precautions.push(
        "Isolate sick animals and provide fresh clean drinking water",
        "Observe 28-day meat and 7-day milk withdrawal period"
      );
    }
  } else if (domainId === "pet") {
    doctorName = "Dr. AZdoc Pet Care Specialist (BVMS)";
    slipTitle = "🐾 Pet Care Prescription Slip (Rx) — Small Animals";
    defaultDiagnosis = "Pet Health & Veterinary Diagnosis";
    catalogItemIds.push("pet-deworm-tab", "pet-mange-shampoo");

    if (medicines.length === 0) {
      medicines.push(
        "Drontal Allwormer Pet Tablets — 1 tablet per 10kg body weight",
        "Medicated Anti-Tick & Mange Cleansing Shampoo — Wash 2x weekly"
      );
    }
    if (precautions.length === 0) {
      precautions.push(
        "Ensure pet remains well hydrated in a cool, clean environment",
        "Keep other household pets separated until fully evaluated"
      );
    }
  } else if (domainId === "plant") {
    doctorName = "Botanical Specialist — AZdoc Plant & Garden Care";
    slipTitle = "🌿 Botanical Care Prescription Slip (Rx)";
    defaultDiagnosis = "Plant Pathology & Botanical Assessment";
    catalogItemIds.push("plt-neem-oil", "plt-fungicide");

    if (medicines.length === 0) {
      medicines.push(
        "Cold-Pressed Organic Neem Oil Spray — 5ml/L water with mild soap",
        "Copper Oxychloride / Mancozeb Fungicide — 2g/L water foliar spray"
      );
    }
    if (precautions.length === 0) {
      precautions.push(
        "Avoid over-watering and ensure adequate pot drainage holes",
        "Spray underside of leaves during early morning hours"
      );
    }
  } else {
    // human
    doctorName = "Dr. AZdoc AI Medical Board (MBBS/MD)";
    slipTitle = "🩺 Clinical Prescription Slip (Rx) — AZdoc AI";
    defaultDiagnosis = "Clinical Assessment & Prescription — AZdoc AI";
    catalogItemIds.push("hum-paracetamol", "hum-ors");

    if (medicines.length === 0) {
      medicines.push(
        "Tab. Paracetamol 500mg (Panadol/Calpol) — 1-2 tablets TID after meals",
        "ORS Hydration Sachets — Dissolve 1 sachet in 1 liter clean water"
      );
    }
    if (precautions.length === 0) {
      precautions.push(
        "Maintain adequate hydration with clean water, soup and electrolytes",
        "Rest and consult a licensed physician if high fever persists > 48h"
      );
    }
  }

  let extractedDiagnosis = defaultDiagnosis;
  for (const l of lines.slice(0, 4)) {
    const cleanL = l.replace(/^[#*•\-\d.]\s*/, "").replace(/\*\*/g, "").trim();
    if (cleanL.length > 5 && cleanL.length < 80 && !cleanL.toLowerCase().includes("assalam") && !cleanL.toLowerCase().includes("hello")) {
      extractedDiagnosis = cleanL;
      break;
    }
  }

  return {
    diagnosis: extractedDiagnosis,
    medicines,
    precautions,
    doctorName,
    slipTitle,
    domainId,
    catalogItemIds,
  };
}

export default function AssistantScreen() {
  const { lang: appLang } = useLanguage();
  const { domainId, domain } = useDomain();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(appLang === "ur" ? "ur" : "en");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const personality = ASSISTANT_CONTENT[domainId] ?? ASSISTANT_CONTENT.human;

  const getGreeting = (lang: SupportedLanguage) => {
    const greetings: Partial<Record<SupportedLanguage, string>> = {
      ur: personality.greetingUr,
      pa: `🩺 **ست سری اکال! میں اے زیڈ ڈاک AI ڈاکٹر واں۔**\n\nتصویر یا آواز نال سوال پوچھو — بخار، دواواں، چمڑی یا کوئی وی مسئلہ۔`,
      sd: `🩺 **اسلام عليڪم! مان اوھان جو AI ڊاڪٽر آھيان۔**\n\nتصوير موڪليو يا صوتي سوال ڪريو — تپ، دوائون، چمڙي — ڪھڙي به مدد گھربل آھي؟`,
      ps: `🩺 **سلامونه! زه ستاسو AZdoc AI ډاکټر یم۔**\n\nانځور واستوئ یا غږ ورکړئ — تبه، درمل، هر ډول روغتیايي پوښتنه.`,
      bal: `🩺 **سلام! من شمئے AI ڈاکٹر آں۔**\n\nعکس بیارت کن یا گوش کن — تاب، دارو، ہر چیزاں مدد کنت.`,
      es: `🩺 **¡Hola! Soy tu médico de IA de AZdoc.**\n\nPuedes enviar una foto o hablar en tu idioma — fiebre, medicamentos, enfermedades de la piel, cualquier pregunta médica.`,
    };
    return greetings[lang] || personality.greetingEn;
  };

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: getGreeting(selectedLang),
    lang: selectedLang,
  }]);

  const [input, setInput] = useState("");
  // Gemini-like voice state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState(""); // live interim text
  const [isTyping, setIsTyping] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [activePrescription, setActivePrescription] = useState<PrescriptionData | null>(null);

  const handleOrderSpecificItem = (medText: string) => {
    const lower = medText.toLowerCase();
    const matched = MEDICINES.find(m => {
      const mName = m.name.toLowerCase();
      return (
        (lower.includes("tilt") && m.id === "crp-tilt") ||
        (lower.includes("nativo") && m.id === "crp-nativo") ||
        (lower.includes("urea") && m.id === "crp-urea") ||
        (lower.includes("dap") && m.id === "crp-dap") ||
        (lower.includes("trap") && m.id === "crp-trap") ||
        (lower.includes("paracetamol") && m.id === "hum-paracetamol") ||
        (lower.includes("panadol") && m.id === "hum-paracetamol") ||
        (lower.includes("brufen") && m.id === "hum-brufen") ||
        (lower.includes("ibuprofen") && m.id === "hum-brufen") ||
        (lower.includes("flagyl") && m.id === "hum-flagyl") ||
        (lower.includes("zyrtec") && m.id === "hum-zyrtec") ||
        (lower.includes("augmentin") && m.id === "hum-augmentin") ||
        (lower.includes("ors") && m.id === "hum-ors") ||
        (lower.includes("oxfendazole") && m.id === "liv-oxfendazole") ||
        (lower.includes("oxytetracycline") && m.id === "liv-oxy-inject") ||
        (lower.includes("drontal") && m.id === "pet-deworm-tab") ||
        (lower.includes("shampoo") && m.id === "pet-mange-shampoo") ||
        (lower.includes("neem") && m.id === "plt-neem-oil") ||
        (lower.includes("mancozeb") && m.id === "plt-fungicide") ||
        (m.domain === domainId && (mName.split(" ")[0].length > 3 && lower.includes(mName.split(" ")[0])))
      );
    });

    if (matched) {
      addToCart(matched.id, 1);
    } else {
      if (domainId === "crop") addToCart("crp-tilt", 1);
      else if (domainId === "livestock") addToCart("liv-oxy-inject", 1);
      else if (domainId === "pet") addToCart("pet-deworm-tab", 1);
      else if (domainId === "plant") addToCart("plt-neem-oil", 1);
      else addToCart("hum-paracetamol", 1);
    }
    setActivePrescription(null);
    navigate("/pharmacy");
  };

  const handleOrderOnPharmacy = (prescription?: PrescriptionData) => {
    if (prescription?.catalogItemIds && prescription.catalogItemIds.length > 0) {
      prescription.catalogItemIds.forEach(id => addToCart(id, 1));
    } else {
      if (domainId === "crop") { addToCart("crp-tilt", 1); addToCart("crp-urea", 1); }
      else if (domainId === "livestock") { addToCart("liv-oxy-inject", 1); }
      else if (domainId === "pet") { addToCart("pet-deworm-tab", 1); }
      else if (domainId === "plant") { addToCart("plt-neem-oil", 1); }
      else { addToCart("hum-paracetamol", 1); addToCart("hum-ors", 1); }
    }
    setActivePrescription(null);
    navigate("/pharmacy");
  };

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { stopTextToSpeech(); stopCamera(); }, []);

  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setShowLangMenu(false);
    setMessages([{ role: "assistant", content: getGreeting(lang), lang }]);
  };

  // ─── CAMERA ────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setCameraError("Camera access denied. Please allow camera in browser settings.");
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const flipCamera = async () => {
    stopCamera();
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    setTimeout(startCamera, 300);
  };

  const sendImageMessage = async () => {
    if (!capturedImage) return;
    const base64 = capturedImage.split(",")[1];
    const userMsg: Message = {
      role: "user",
      content: input.trim() || (selectedLang === "ur" ? "اس تصویر کی طبی تشخیص کریں" : "Please analyze this image and provide a detailed medical diagnosis."),
      imageUrl: capturedImage,
      lang: selectedLang,
    };
    setMessages(prev => [...prev, userMsg]);
    setCapturedImage(null);
    setInput("");
    setIsTyping(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const aiReply = await askDeepSeekDoctor({
        userMessage: userMsg.content,
        history,
        lang: selectedLang as any,
        domain: domainId,
        imageBase64: base64,
      });
      const prescription = extractPrescription(aiReply, domainId, domain.name);
      setMessages(prev => [...prev, { role: "assistant", content: aiReply, lang: selectedLang, prescription }]);
      playTextToSpeech(aiReply, selectedLang, () => setSpeakingMsgId(messages.length + 2), () => setSpeakingMsgId(null), () => setSpeakingMsgId(null));
    } catch (err) {
      console.error("[sendImage]", err);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── GEMINI-LIKE VOICE INPUT ──────────────────────────────────────────────
  const startListening = async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    setInterimText("");
    const recorder = await startVoiceRecording({
      lang: selectedLang,
      onInterimTranscript: (text) => {
        setInterimText(text);
        setInput(text); // live update input as user speaks
      },
      onFinalTranscript: (text) => {
        setInput(text);
        setInterimText("");
        inputRef.current?.focus();
      },
      onListeningStart: () => setIsListening(true),
      onListeningEnd: () => {
        setIsListening(false);
        setInterimText("");
      },
      onError: (errMsg) => {
        setCameraError(errMsg as string);
        setIsListening(false);
        setInterimText("");
      },
    });

    voiceRecorderRef.current = recorder;
  };

  const stopListening = async () => {
    if (voiceRecorderRef.current) {
      await voiceRecorderRef.current.stop();
      voiceRecorderRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  };

  const handlePlayVoice = (text: string, index: number) => {
    if (speakingMsgId === index) { stopTextToSpeech(); setSpeakingMsgId(null); return; }
    setSpeakingMsgId(index);
    playTextToSpeech(text, selectedLang, () => setSpeakingMsgId(index), () => setSpeakingMsgId(null), () => setSpeakingMsgId(null));
  };

  // ─── SEND MESSAGE ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    // If listening, stop first then send
    if (isListening) {
      await stopListening();
      await new Promise(res => setTimeout(res, 400)); // wait for final transcript
    }

    const text = input.trim();
    if (!text && !capturedImage) return;
    if (capturedImage) { sendImageMessage(); return; }

    const userMsg: Message = { role: "user", content: text, lang: selectedLang };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (!activeSession) setActiveSession(generateLocalId());

    try {
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }));

      const aiReply = await askDeepSeekDoctor({
        userMessage: text,
        history,
        lang: selectedLang as any,
        domain: domainId,
      });

      const prescription = extractPrescription(aiReply, domainId, domain.name);
      const aiMsg: Message = { role: "assistant", content: aiReply, lang: selectedLang, prescription };
      const newMsgIndex = messages.length + 1;
      setMessages(prev => [...prev, aiMsg]);

      playTextToSpeech(aiReply, selectedLang,
        () => setSpeakingMsgId(newMsgIndex),
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    } catch (err) {
      console.error("[sendMessage]", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, capturedImage, activeSession, messages, selectedLang, domainId, domain.name, isListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border bg-bg-elevated/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-heading font-bold text-text-primary leading-tight">AZdoc AI Doctor</h1>
            <p className="text-[10px] text-text-muted">Gemini Vision · DeepSeek · Groq · 7 Languages</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button onClick={() => setShowLangMenu(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-sm">
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.nativeName}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-bg-elevated border border-border rounded-2xl shadow-2xl z-50 p-1.5 animate-scaleIn">
              <p className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Language</p>
              {SUPPORTED_LANGUAGES.map(l => (
                <button key={l.code} onClick={() => handleLangChange(l.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${selectedLang === l.code ? "bg-primary text-white font-bold" : "text-text-primary hover:bg-bg-secondary"}`}>
                  <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                  <span className="text-[11px] opacity-80">{l.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Language pills ── */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-bg-secondary/30 border-b border-border/30">
        <Languages className="w-3.5 h-3.5 text-text-muted shrink-0" />
        {SUPPORTED_LANGUAGES.map(l => (
          <button key={l.code} onClick={() => handleLangChange(l.code)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${selectedLang === l.code ? "bg-primary text-white shadow-sm" : "bg-bg-elevated text-text-muted border border-border hover:text-text-primary hover:border-primary/30"}`}>
            {l.flag} {l.nativeName}
          </button>
        ))}
      </div>

      {/* ── Camera View ── */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-10">
            <button onClick={stopCamera} className="text-white p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md active:scale-95 transition-all" title="Close">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
              <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                {selectedLang === "ur" ? "اے زیڈ ڈاک کیمرہ" : "AZdoc Camera"}
              </span>
            </div>
            <button onClick={flipCamera} className="text-white p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md active:scale-95 transition-all" title="Flip">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-64 h-64 border-2 border-dashed border-white/40 rounded-3xl relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                <span className="text-white/80 text-[11px] font-semibold bg-black/60 px-3 py-1 rounded-full border border-white/10">
                  {selectedLang === "ur" ? "تشخیص کے لیے یہاں لائیں" : "Center subject in box"}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 p-6 pb-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            <button onClick={capturePhoto} aria-label="Capture Photo"
              className="group relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 bg-black/40 hover:bg-black/60 active:scale-90 transition-all duration-200 shadow-2xl">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-inner group-hover:brightness-110 transition-all">
                <Camera className="w-8 h-8 text-white drop-shadow-md" />
              </div>
            </button>
            <button onClick={capturePhoto}
              className="text-white text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-full border border-white/30 shadow-xl active:scale-95 transition-all flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {selectedLang === "ur" ? "تصویر کھینچیں" : "TAP TO CAPTURE"}
            </button>
          </div>
        </div>
      )}

      {/* ── Captured image preview ── */}
      {capturedImage && !showCamera && (
        <div className="mx-4 mt-2 bg-bg-elevated border border-primary/30 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <img src={capturedImage} className="w-16 h-16 rounded-xl object-cover border border-border" alt="captured" />
          <div className="flex-1">
            <p className="text-xs font-bold text-text-primary">📷 Photo ready to send</p>
            <p className="text-[10px] text-text-muted">AI will analyze this with Gemini Vision</p>
          </div>
          <button onClick={() => setCapturedImage(null)} className="text-text-muted hover:text-danger transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {cameraError && (
        <div className="mx-4 mt-2 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-2 text-danger text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
          <button onClick={() => setCameraError("")} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.imageUrl && (
              <img src={msg.imageUrl} className="max-w-[70%] rounded-2xl mb-1.5 border border-border shadow-md" alt="user photo" />
            )}
            <div className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === "user"
                ? "bg-gradient-to-br from-primary via-blue-500 to-indigo-600 text-white rounded-br-md whitespace-pre-line"
                : "bg-bg-elevated border border-border text-text-primary rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                msg.content
              )}

              {msg.prescription && (
                <div className="mt-3.5 pt-3 border-t border-border/80 space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/30 space-y-2.5 shadow-xs">
                    {/* Slip Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          Rx
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-primary flex items-center gap-1">
                            {msg.prescription.slipTitle || "Prescription Slip (Rx)"}
                          </h4>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            {msg.prescription.doctorName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{selectedLang === "ur" ? "تصدیق شدہ" : "Verified Rx"}</span>
                      </span>
                    </div>

                    {/* Diagnosis / Assessment */}
                    <div className="text-[11px] bg-bg-surface/90 rounded-xl px-2.5 py-1.5 border border-border/60">
                      <span className="text-text-muted font-bold text-[10px] uppercase">
                        {selectedLang === "ur" ? "تشخیص: " : "Assessment: "}
                      </span>
                      <span className="text-text-primary font-bold">
                        {msg.prescription.diagnosis}
                      </span>
                    </div>

                    {/* Prescribed Items */}
                    <div className="space-y-1.5 pt-0.5">
                      <p className="text-[10px] font-bold text-text-muted uppercase">
                        {domainId === "crop"
                          ? (selectedLang === "ur" ? "تجویز کردہ اسپرے اور کھادیں:" : "Prescribed Sprays, Fertilizers & Dosages:")
                          : domainId === "livestock"
                          ? (selectedLang === "ur" ? "تجویز کردہ ادویات اور ٹیکے:" : "Prescribed Veterinary Doses & Injections:")
                          : (selectedLang === "ur" ? "تجویز کردہ ادویات اور مقدار:" : "Prescribed Medicines & Dosage:")}
                      </p>
                      {msg.prescription.medicines.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-bg-surface/90 border border-emerald-500/20 text-xs text-text-primary shadow-2xs hover:border-emerald-500/40 transition-all"
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="text-emerald-600 font-bold shrink-0 text-sm">
                              {domainId === "crop" ? "🌾" : domainId === "livestock" ? "🐄" : domainId === "pet" ? "🐾" : domainId === "plant" ? "🌿" : "💊"}
                            </span>
                            <span className="font-semibold text-xs leading-snug break-words">
                              {m}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOrderSpecificItem(m)}
                            title="Add to cart & order"
                            className="shrink-0 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>{selectedLang === "ur" ? "آرڈر کریں" : "Order"}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Order Now Call-To-Action Button */}
                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleOrderOnPharmacy(msg.prescription)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>
                          {domainId === "crop"
                            ? (selectedLang === "ur" ? "فارمیسی سے کیڑے مار دوائیں / کھاد منگوائیں →" : "Order on Agri Pharmacy Radar →")
                            : domainId === "livestock"
                            ? (selectedLang === "ur" ? "ویٹرنری اسٹور سے ادویات منگوائیں →" : "Order on Veterinary Pharmacy Radar →")
                            : (selectedLang === "ur" ? "فارمیسی سے دوائیاں منگوائیں (کیش آن ڈیلیوری) →" : "Order Medicines on Pharmacy Radar →")}
                        </span>
                      </button>
                      <button
                        onClick={() => setActivePrescription(msg.prescription ?? null)}
                        className="py-2 px-3 rounded-xl bg-bg-surface hover:bg-bg-elevated border border-border text-text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5 text-text-muted" />
                        <span>{selectedLang === "ur" ? "مکمل پرچی" : "Full Slip"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {msg.role === "assistant" && (
              <div className="flex items-center gap-2 mt-1 ml-2">
                <button onClick={() => handlePlayVoice(msg.content, i)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    speakingMsgId === i
                      ? "bg-danger text-white border-danger animate-pulse"
                      : "bg-bg-elevated text-primary border-primary/20 hover:bg-primary/10"
                  }`}>
                  {speakingMsgId === i ? (
                    <><VolumeX className="w-3 h-3" /><span>Stop</span></>
                  ) : (
                    <><Volume2 className="w-3 h-3" /><span>Listen in {activeLangObj.nativeName}</span></>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated border border-border rounded-3xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-xs text-text-muted font-medium">AZdoc AI analysing</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick Chips ── */}
      <div className="mx-4 mb-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {getLanguageChips(domainId, selectedLang).map((chip, idx) => (
          <button key={idx} onClick={() => setInput(chip.query)}
            className="shrink-0 bg-bg-elevated border border-primary/20 text-text-primary hover:border-primary hover:bg-primary/5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shadow-xs">
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Gemini-like Voice Banner ── */}
      {isListening && (
        <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-danger/30 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-danger font-bold text-xs">
              <div className="relative">
                <Mic className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full animate-ping" />
              </div>
              <span>Listening in {activeLangObj.name} ({activeLangObj.nativeName})…</span>
            </div>
            <button onClick={stopListening} className="px-3 py-1 rounded-xl bg-danger text-white text-[10px] font-bold shadow-sm hover:bg-red-600 transition-colors">
              Done ✓
            </button>
          </div>
          {/* Live interim text display (Gemini-style) */}
          {interimText && (
            <p className="text-xs text-text-primary font-medium bg-bg-elevated/70 rounded-xl px-3 py-2 border border-border/50 animate-pulse">
              🎙️ {interimText}
            </p>
          )}
          {!interimText && (
            <div className="flex items-center gap-1 px-3 py-1.5">
              {[1,2,3,4,5].map(b => (
                <span key={b} className="h-5 w-1 bg-danger/60 rounded-full animate-bounce"
                  style={{ animationDelay: `${b * 0.1}s`, animationDuration: "0.8s" }} />
              ))}
              <span className="text-[10px] text-text-muted ml-2">Speak now…</span>
            </div>
          )}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="mx-4">
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />

        <div className={`flex items-center gap-1.5 bg-bg-elevated border-2 transition-all rounded-3xl px-3 py-1.5 shadow-sm ${isListening ? "border-danger/50 shadow-danger/10" : "border-border focus-within:border-primary/50"}`}>
          {/* Mic button — Gemini-like toggle */}
          <button
            onClick={startListening}
            title={isListening ? "Stop Recording" : "Voice Input (any language)"}
            id="voice-input-btn"
            className={`flex items-center justify-center rounded-2xl p-2 transition-all ${
              isListening
                ? "bg-danger text-white shadow-lg shadow-danger/30 scale-110 animate-pulse"
                : "text-text-muted hover:text-primary hover:bg-primary/10"
            }`}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Live Camera button */}
          <button onClick={() => { if (showCamera) stopCamera(); else startCamera(); }}
            title="Live Camera Photo"
            className={`flex items-center justify-center rounded-2xl p-2 transition-all ${showCamera ? "bg-primary text-white" : capturedImage ? "text-primary bg-primary/10" : "text-text-muted hover:text-primary hover:bg-primary/10"}`}>
            <Camera className="w-5 h-5" />
          </button>

          {/* Upload Photo button */}
          <button onClick={() => galleryInputRef.current?.click()}
            title="Upload Photo from Gallery"
            className="flex items-center justify-center rounded-2xl p-2 text-text-muted hover:text-primary hover:bg-primary/10 transition-all">
            <Upload className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? (selectedLang === "ur" ? "سن رہا ہوں…" : "Listening… speak in any language")
                : (selectedLang === "ur" ? personality.placeholderUr : personality.placeholderEn)
            }
            className="flex-1 py-2 text-xs sm:text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted/60 min-w-0"
          />

          <button onClick={sendMessage}
            disabled={!input.trim() && !capturedImage}
            id="send-message-btn"
            className="flex items-center justify-center rounded-2xl p-2.5 text-white bg-primary hover:bg-primary-light transition-all disabled:opacity-40 shadow-md active:scale-95 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>

        {!capturedImage && !showCamera && !isListening && (
          <p className="text-center text-[10px] text-text-muted mt-1.5 flex items-center justify-center gap-2">
            <span>📷 Camera</span><span>·</span>
            <span>🖼️ Upload</span><span>·</span>
            <span>🎙️ Voice (any language)</span><span>·</span>
            <span>⌨️ Type</span>
          </p>
        )}
      </div>

      {/* ── Prescription Slip Modal ── */}
      {activePrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-elevated border border-border rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-scaleIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-500/20">Rx</div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    {activePrescription.slipTitle || "Medical Prescription Slip"}
                  </h3>
                  <p className="text-[10px] text-text-muted">{activePrescription.doctorName}</p>
                </div>
              </div>
              <button onClick={() => setActivePrescription(null)} className="w-7 h-7 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-bg-secondary rounded-2xl">
                <p className="text-[10px] font-bold text-text-muted uppercase">Diagnosis / Assessment:</p>
                <p className="font-bold text-text-primary mt-0.5">{activePrescription.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1.5">
                  {domainId === "crop" ? "Prescribed Sprays, Fertilizers & Dosages:" : "Prescribed Medicines & Dosage:"}
                </p>
                <div className="space-y-1.5">
                  {activePrescription.medicines.map((m: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-text-primary font-medium flex items-center justify-between">
                      <span className="leading-snug pr-2">
                        {domainId === "crop" ? "🌾" : domainId === "livestock" ? "🐄" : domainId === "pet" ? "🐾" : domainId === "plant" ? "🌿" : "💊"} {m}
                      </span>
                      <button onClick={() => handleOrderSpecificItem(m)}
                        className="text-[10px] font-bold text-primary hover:underline shrink-0">Order →</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Precautions & Advice:</p>
                <ul className="list-disc list-inside text-text-muted space-y-1">
                  {activePrescription.precautions.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => handleOrderOnPharmacy(activePrescription)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors flex items-center justify-center gap-2 shadow-md">
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {domainId === "crop" ? "Order on Agri Pharmacy Radar" : "Order on Pharmacy Radar"}
                </span>
              </button>
              <button onClick={() => setActivePrescription(null)}
                className="px-4 py-2.5 rounded-xl bg-bg-secondary text-text-primary text-xs font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}