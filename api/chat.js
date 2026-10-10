const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

const DOMAIN_SYSTEM_PROMPTS = {
  human: "You are Dr. AZdoc, a board-certified AI physician providing accurate medical diagnosis, prescription advice, dosage, home remedies, and emergency warnings. Give DETAILED, ACCURATE responses with medicine names (generic + Pakistan brand name), dose, frequency, and duration.",
  livestock: "You are Dr. AZdoc, a senior veterinary specialist (DVM) specializing in cattle, buffalo, sheep, and goats in Pakistan. Provide detailed medicine names, dosage per kg body weight, route (IM/IV/SC/oral), withdrawal periods, and care instructions.",
  pet: "You are Dr. AZdoc, a certified companion animal veterinarian specializing in dogs, cats, and birds. Provide species-safe treatments with exact medication names and doses.",
  plant: "You are Dr. AZdoc, a horticulturist and plant pathologist specializing in house and garden plants. Provide organic and chemical treatments with exact product names.",
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
        content: `${systemPrompt}\nLanguage: ${lang === "ur" ? "Respond completely in Urdu script." : "English"}. Be thorough, structured, and clinically accurate. Give detailed responses with specific medicine names, dosages, and precautions.`,
      },
      ...messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let reply = "";

    // 1. Try OpenAI (only if genuine sk- key)
    if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-") && !OPENAI_API_KEY.startsWith("sk-or-")) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: fullMessages,
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          reply = openaiData?.choices?.[0]?.message?.content || "";
          if (reply && reply.length > 20) {
            return res.status(200).json({ reply, source: "ai" });
          }
        }
      } catch (openaiErr) {
        console.warn("[api/chat] OpenAI failed:", openaiErr.message);
      }
    }

    // 2. OpenRouter DeepSeek V3 (Authentic DeepSeek Chat)
    if (OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        reply = data?.choices?.[0]?.message?.content || "Thank you for consulting AZdoc AI.";
        if (reply && reply.length > 20) {
          return res.status(200).json({ reply, source: "ai" });
        }
      } else {
        const errText = await response.text();
        console.warn("[api/chat] OpenRouter DeepSeek error, trying gpt-4o-mini:", errText);
        // Fallback to gpt-4o-mini on OpenRouter
        const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: fullMessages,
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          reply = fbData?.choices?.[0]?.message?.content || "Thank you for consulting AZdoc AI.";
          return res.status(200).json({ reply, source: "ai" });
        }
      }
    }

    return res.status(500).json({ error: "no_api_keys", message: "No LLM API keys configured" });
  } catch (err) {
    console.error("[api/chat] Error:", err);
    return res.status(500).json({ error: "server_error", message: err.message });
  }
}
