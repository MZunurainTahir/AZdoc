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

Look closely at the photo and identify the condition.
Return ONLY a valid JSON object, with no markdown code blocks, in this exact format:
{
  "disease": "Specific clinical or botanical name of condition",
  "matchedKey": null,
  "confidence": 0.88,
  "isHealthy": false,
  "description": "2 sentences describing visual signs seen in the photo",
  "remedy": "Detailed step-by-step treatment plan with exact medicine names, dosage, organic remedies, care tips, and precautions.${lang === "ur" ? " (Write in Urdu)" : ""}"
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
