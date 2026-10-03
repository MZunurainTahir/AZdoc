import { chatCompletion } from "./llm.js";
import { searchKnowledgeBase, generateRAGAnswer } from "./rag.js";

const SYSTEM_PROMPT_EN =
  "You are AZdoc's bio-health assistant for every living thing — humans, livestock, pets, plants and crops. " +
  "You provide practical, accurate, concise, and structured advice. Use markdown bold headings, numbered steps, " +
  "organic remedies, chemical remedies with exact local product names and dosages (per acre/kanal for crops, per kg for animals), and clear prevention steps. " +
  "For HUMAN health you are NOT a doctor: give preliminary first-aid guidance only, always recommend a licensed doctor, and say Rescue 1122 (Pakistan) for emergencies. " +
  "Below is verified domain knowledge retrieved from AZdoc's database for the user's query:";

const SYSTEM_PROMPT_UR =
  "آپ اے زیڈ ڈاک کے صحت معاون ہیں — انسان، مویشی، پالتو جانور، پودے اور فصلیں، سب کے لیے۔ آسان، درست اور مکمل جواب دیں۔ " +
  "جواب میں قدرتی علاج، کیمیائی دوائیں (مقامی برانڈ نام اور خوراک کے ساتھ)، اور حفاظتی تدابیر شامل کریں۔ " +
  "انسانی صحت میں آپ ڈاکٹر نہیں — صرف ابتدائی رہنمائی دیں، لائسنس یافتہ ڈاکٹر سے تصدیق کا کہیں، اور ایمرجنسی میں 1122 بتائیں۔ " +
  "ذیل میں اے زیڈ ڈاک ڈیٹا بیس سے حاصل کردہ معلومات درج ہیں:";

/* AZdoc domain personas — appended to the base system prompt per active domain */
const DOMAIN_PERSONAS = {
  crop: {
    en: "The user's active domain is CROPS. Focus on field crops (wheat, cotton, rice, maize). Use per-acre/kanal dosages.",
    ur: "صارف کا فعال ڈومین فصلیں ہے۔ فصلوں (گندم، کپاس، چاول، مکئی) پر توجہ دیں اور فی ایکڑ خوراک بتائیں۔",
  },
  plant: {
    en: "The user's active domain is PLANTS & GARDEN. Focus on house plants, vegetables and ornamentals. Prefer organic treatments first.",
    ur: "صارف کا فعال ڈومین پودے اور باغ ہے۔ گھریلو پودوں اور سبزیوں پر توجہ دیں اور پہلے قدرتی علاج بتائیں۔",
  },
  livestock: {
    en: "The user's active domain is LIVESTOCK. Focus on cattle, buffalo, goats and poultry. For notifiable diseases (FMD, LSD) tell them to inform the local livestock department.",
    ur: "صارف کا فعال ڈومین مویشی ہے۔ گائے، بھینس، بکریوں اور مرغیوں پر توجہ دیں۔ متعدی بیماریوں میں مقامی محکمے کو مطلع کرنے کا کہیں۔",
  },
  pet: {
    en: "The user's active domain is PETS. Focus on cats, dogs, birds and companion animals. Always recommend an in-person vet visit for vaccination or rabies concerns.",
    ur: "صارف کا فعال ڈومین پالتو جانور ہے۔ بلی، کتے اور پرندوں پر توجہ دیں۔ ویکسینیشن یا ریبز کے لیے ڈاکٹر سے ملاقات کا کہیں۔",
  },
  human: {
    en: "The user's active domain is HUMAN HEALTH. You are a preliminary health-information assistant, NOT a doctor. Give general first-aid and lifestyle guidance, always advise confirmation from a licensed doctor, and say that in emergencies they should call Rescue 1122 (Pakistan). Never prescribe prescription-only medicines.",
    ur: "صارف کا فعال ڈومین انسانی صحت ہے۔ آپ ڈاکٹر نہیں ہیں — عمومی ابتدائی رہنمائی دیں، لائسنس یافتہ ڈاکٹر سے تصدیق کا کہیں، اور ایمرجنسی میں 1122 پر کال کا مشورہ دیں۔",
  },
};

export async function chatReply({ messages, lang, domain }) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const isUr = lang === "ur" || /[\u0600-\u06FF]/.test(lastUserMsg);
  const persona = domain ? DOMAIN_PERSONAS[domain]?.[isUr ? "ur" : "en"] : null;

  // 1. RAG Retrieval from local knowledge base
  const retrievedItems = searchKnowledgeBase(lastUserMsg);
  const ragContextStr = retrievedItems
    .map(
      (item) =>
        `[Topic: ${item.titleEn} / ${item.titleUr}]\n` +
        `Summary: ${item.summaryEn}\n` +
        `Organic: ${item.organicEn}\n` +
        `Chemical & Products: ${item.chemicalEn} (Local Brands: ${item.localProducts.join(", ")})\n` +
        `Dosage: ${item.dosageEn}\n` +
        `Prevention: ${item.preventionEn}\n`
    )
    .join("\n---\n");

  try {
    const basePrompt = isUr ? SYSTEM_PROMPT_UR : SYSTEM_PROMPT_EN;
    const domainLine = persona ? `\n=== ACTIVE DOMAIN ===\n${persona}\n======================` : "";
    const fullSystemPrompt = `${basePrompt}${domainLine}\n\n=== RETRIEVED KNOWLEDGE CONTEXT ===\n${ragContextStr}\n====================================`;

    const trimmed = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    const content = await chatCompletion({
      messages: [{ role: "system", content: fullSystemPrompt }, ...trimmed],
    });

    return { reply: content.trim(), source: "ai_rag" };
  } catch (err) {
    console.warn("[chatReply] LLM call failed or timed out, returning Instant RAG Answer:", err.message);
    // Instant RAG Answer generation (<10ms fallback) — domain-aware so a
    // human/pet/plant question never gets an unrelated crop answer offline.
    const ragReply = generateRAGAnswer(lastUserMsg, isUr ? "ur" : "en", domain);
    return { reply: ragReply, source: "rag_engine" };
  }
}
