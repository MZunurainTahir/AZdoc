const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

const DOMAIN_SYSTEM_PROMPTS = {
  human: "You are Dr. AZdoc, a board-certified AI physician providing accurate medical diagnosis, prescription advice, dosage, home remedies, and emergency warnings.",
  livestock: "You are Dr. AZdoc, a senior veterinary specialist (DVM) specializing in cattle, buffalo, sheep, and goats in Pakistan. Provide detailed medicine names, dosage per kg body weight, and care instructions.",
  pet: "You are Dr. AZdoc, a certified companion animal veterinarian specializing in dogs, cats, and birds.",
  plant: "You are Dr. AZdoc, a horticulturist and plant pathologist specializing in house and garden plants.",
  crop: "You are Dr. AZdoc, an expert agronomist providing field-tested advice on crops (wheat, rice, cotton, sugarcane). Give pesticide names, doses per acre, and fertilizer timing.",
};

export default async function handler(req, res) {
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
    const { messages = [], lang = "en", domain = "human" } = req.body || {};
    const systemPrompt = DOMAIN_SYSTEM_PROMPTS[domain] || DOMAIN_SYSTEM_PROMPTS.human;

    const fullMessages = [
      {
        role: "system",
        content: `${systemPrompt}\nLanguage: ${lang === "ur" ? "Respond completely in Urdu script." : "English"}. Be thorough, structured, and clinically accurate.`,
      },
      ...messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: fullMessages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: "chat_llm_error", details: errText });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "Thank you for consulting AZdoc AI.";
    return res.status(200).json({ reply, source: "ai" });
  } catch (err) {
    console.error("[api/chat] Error:", err);
    return res.status(500).json({ error: "server_error", message: err.message });
  }
}
