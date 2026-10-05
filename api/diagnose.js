const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

const DOMAIN_PROMPTS = {
  crop: "an agricultural vision specialist helping smallholder farmers diagnose crop diseases from a photo",
  plant: "a horticulturist diagnosing houseplants, vegetables, and garden plants from a photo",
  livestock: "a senior veterinary specialist diagnosing cattle, buffalo, goats, and sheep from a photo",
  pet: "a certified companion animal veterinarian diagnosing dogs, cats, and birds from a photo",
  human: "a medical triage vision specialist analyzing visible skin/eye/throat health symptoms from a photo. Give preliminary clinical guidance.",
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, mode = "human", lang = "en", symptoms, domain } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const activeDomain = domain || mode || "human";
    const role = DOMAIN_PROMPTS[activeDomain] || DOMAIN_PROMPTS.human;
    const imageDataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    const promptText = `You are ${role}.
Language requested: ${lang === "ur" ? "Urdu script" : "English"}.
User reported symptoms: ${symptoms ? JSON.stringify(symptoms) : "None"}.

STRICT MULTI-MODAL TAXONOMY & MEDICAL SAFETY RULES:
1. ANATOMY-FIRST ROUTING FOR HUMAN MODE:
   - Determine the EXACT human body region first (Eye vs Throat/Oral vs Skin Arm/Leg/Body vs Ear vs Chest X-Ray).
   - EYE INFECTIONS (Conjunctivitis / Stye / Corneal): Prescribe Ophthalmic Drops (e.g. Moxifloxacin 0.5% drops) or cool compresses. NEVER PRESCRIBE topical skin creams, hydrocortisone, or antifungal ointments (Clotrimazole) for eye conditions!
   - THROAT / ORAL (Pharyngitis / Tonsillitis): Prescribe warm saline gargles, Paracetamol, or oral antibiotics (Amoxicillin). NEVER PRESCRIBE antifungal skin cream (Clotrimazole) for throat infections!
   - SKIN FUNGAL (Tinea / Ringworm): Prescribe topical antifungal (Clotrimazole 1% Cream or Terbinafine 1%).
   - SKIN ECZEMA (Atopic Dermatitis): Prescribe Hydrocortisone 1% cream and emollients.
2. CROP / BOTANICAL DIAGNOSTICS:
   - Identify BOTH host crop (Tomato vs Potato vs Wheat) AND condition.
   - DO NOT assign potato tuber harvesting notes to Tomatoes!

Return ONLY a valid JSON object, with no markdown code blocks, in this exact format:
{
  "disease": "Exact clinical name (e.g. 'Acute Bacterial Conjunctivitis', 'Streptococcal Tonsillitis', 'Fungal Skin Infection (Ringworm)', 'Atopic Dermatitis')",
  "body_region": "eye | throat_oral | skin_arm | skin_leg | skin_torso | ear | chest_xray",
  "matchedKey": null,
  "confidence": 0.92,
  "isHealthy": false,
  "description": "2 sentences describing visual signs seen in the photo",
  "remedy": "Anatomy-safe, evidence-based clinical treatment plan with exact medication names, dosages, symptomatic relief, red flags, and precautions.${lang === "ur" ? " (Write in Urdu)" : ""}"
}`;


    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[api/diagnose] OpenRouter status:", response.status, errText);
      return res.status(500).json({ error: "llm_error", details: errText });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    let parsed = {};
    if (start !== -1 && end !== -1) {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    }

    return res.status(200).json({
      disease: String(parsed.disease || "Diagnosed Condition"),
      matchedKey: null,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.88)),
      isHealthy: Boolean(parsed.isHealthy),
      description: String(parsed.description || ""),
      remedy: String(parsed.remedy || parsed.description || "Consult a registered doctor/vet for confirmation."),
      source: "ai",
    });
  } catch (err) {
    console.error("[api/diagnose] Error:", err);
    return res.status(500).json({ error: "server_error", message: err.message });
  }
}
