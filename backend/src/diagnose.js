import { chatCompletion, parseJsonLoose } from "./llm.js";
import { CROP_KEYS, LIVESTOCK_KEYS } from "./remedyKeys.js";

const CROP_MOCK_POOL = [
  { key: "Tomato___Early_blight", disease: "Tomato Early Blight" },
  { key: "Wheat___Leaf_rust", disease: "Wheat Leaf Rust" },
  { key: "Rice___Blast", disease: "Rice Blast" },
  { key: "Cotton___Bacterial_blight", disease: "Cotton Bacterial Blight" },
  { key: "Potato___Late_Blight", disease: "Potato Late Blight" },
];
const LIVESTOCK_MOCK_POOL = [
  { key: "Livestock___Foot_and_Mouth", disease: "Foot & Mouth Disease" },
  { key: "Livestock___Bovine_Mastitis", disease: "Bovine Mastitis" },
  { key: "Livestock___Lumpy_Skin", disease: "Lumpy Skin Disease" },
];
const DOMAIN_MOCK_POOL = {
  human: [
    { key: null, disease: "Possible Fungal Skin Infection" },
    { key: null, disease: "Allergic Skin Reaction" },
  ],
  pet: [{ key: null, disease: "Possible Mange / Tick Dermatitis" }],
  plant: [{ key: null, disease: "Leaf Spot Disease" }],
};

function mockDiagnosis(mode, domain) {
  const d = domain || mode;
  const domainPool = DOMAIN_MOCK_POOL[d];
  const picked = domainPool
    ? domainPool[Math.floor(Math.random() * domainPool.length)]
    : (mode === "livestock" ? LIVESTOCK_MOCK_POOL : CROP_MOCK_POOL)[Math.floor(Math.random() * (mode === "livestock" ? LIVESTOCK_MOCK_POOL : CROP_MOCK_POOL).length)];
  const confidence = 0.72 + Math.random() * 0.22;
  return {
    disease: picked.disease,
    matchedKey: picked.key,
    confidence: Number(confidence.toFixed(2)),
    isHealthy: false,
    description: "Simulated result — no AI provider configured on the backend (add GROQ_API_KEY to enable real diagnosis).",
    source: "mock",
  };
}

/* Domain personas for the AZdoc multi-domain bio-health ecosystem */
const DOMAIN_PROMPTS = {
  crop: {
    role: "an agricultural vision assistant helping smallholder farmers in Pakistan diagnose crop diseases from a photo",
    subject: "plant",
    advisory: "Recommend the farmer consult their local agriculture extension officer.",
  },
  plant: {
    role: "a plant-care vision assistant helping home gardeners diagnose house plant, vegetable and ornamental plant issues from a photo",
    subject: "plant",
    advisory: "Recommend organic treatments first and approved products only.",
  },
  livestock: {
    role: "a veterinary vision assistant helping farmers in Pakistan diagnose livestock (cattle, buffalo, goat, poultry) health issues from a photo",
    subject: "animal",
    advisory: "For notifiable diseases (FMD, LSD) advise informing the local livestock department.",
  },
  pet: {
    role: "a small-animal veterinary vision assistant helping pet owners diagnose cats, dogs, birds and other companion animals from a photo",
    subject: "pet",
    advisory: "Always advise an in-person vet visit for confirmation, vaccination or rabies concerns.",
  },
  human: {
    role: "a preliminary health-triage vision assistant looking at a photo of visible human symptoms (skin, eyes, throat). You are NOT a doctor and must NOT give a definitive medical diagnosis",
    subject: "person",
    advisory: "Always include: this is preliminary guidance, not a medical diagnosis; see a licensed doctor; for emergencies call Rescue 1122 (Pakistan).",
  },
};

function buildPrompt({ mode, lang, symptoms, domain }) {
  const d = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS[mode] || DOMAIN_PROMPTS.crop;
  const keys = d === DOMAIN_PROMPTS.crop ? CROP_KEYS : d === DOMAIN_PROMPTS.livestock ? LIVESTOCK_KEYS : null;
  const symptomLine = symptoms
    ? `\nThe user also reported these symptoms: ${JSON.stringify(symptoms)}.`
    : "";

  const keyClause = keys
    ? `If it matches one of these known catalogue entries, set "matchedKey" to that exact string: ${keys.join(", ")}. `
    : `Set "matchedKey" to null for this domain (no curated catalogue yet) and fill in "disease" and "description" yourself. `;

  return (
    `You are ${d.role}.${symptomLine}\n\n` +
    `Look carefully at the attached image and identify the most likely condition. ` +
    keyClause +
    `If the ${d.subject} looks healthy, set "isHealthy" to true.\n` +
    `Safety: ${d.advisory}\n\n` +
    `Respond with ONLY a single JSON object, no markdown, no commentary, in this exact shape:\n` +
    `{\n` +
    `  "disease": "short English name of the condition, or 'Healthy'",\n` +
    `  "matchedKey": "one of the catalogue keys above, or null",\n` +
    `  "confidence": 0.0-1.0 number reflecting how sure you are from the image alone,\n` +
    `  "isHealthy": true or false,\n` +
    `  "description": "1-2 plain sentences describing what you see in the image and why you think this${lang === "ur" ? " (respond in Urdu)" : ""}"\n` +
    `}`
  );
}

export async function diagnoseImage({ imageBase64, mode, lang, symptoms, domain }) {
  const imageDataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  try {
    const raw = await chatCompletion({
      messages: [
        {
          role: "user",
          content: buildPrompt({ mode, lang, symptoms, domain }),
        },
      ],
      imageDataUrl,
      jsonMode: true,
    });

    const parsed = parseJsonLoose(raw);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6));

    return {
      disease: String(parsed.disease || "Unknown"),
      matchedKey: parsed.matchedKey && typeof parsed.matchedKey === "string" ? parsed.matchedKey : null,
      confidence,
      isHealthy: Boolean(parsed.isHealthy),
      description: String(parsed.description || ""),
      source: "ai",
    };
  } catch (err) {
    console.warn("[diagnoseImage] AI call failed, falling back to mock:", err.message);
    return mockDiagnosis(mode, domain);
  }
}
