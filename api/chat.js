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

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    let reply = "";

    // 1. Ultra-Fast: Groq LPU (responds in 500ms - 1000ms)
    if (GROQ_API_KEY) {
      const groqModels = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"];
      for (const model of groqModels) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: fullMessages,
              temperature: 0.3,
              max_tokens: 700,
            }),
            signal: AbortSignal.timeout(6000),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            reply = data?.choices?.[0]?.message?.content || "";
            if (reply && reply.trim().length > 20) {
              return res.status(200).json({ reply: reply.trim(), source: "groq_fast" });
            }
          }
        } catch (groqErr) {
          console.warn(`[api/chat] Groq ${model} error:`, groqErr.message);
        }
      }
    }

    // 2. OpenRouter Fast Track (GPT-4o-mini in 1.1s or DeepSeek V3 in 1.5s)
    if (OPENROUTER_API_KEY) {
      const orModels = ["openai/gpt-4o-mini", "deepseek/deepseek-chat"];
      for (const model of orModels) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://azdoc.vercel.app",
              "X-Title": "AZdoc Fast Doctor",
            },
            body: JSON.stringify({
              model,
              messages: fullMessages,
              temperature: 0.3,
              max_tokens: 700,
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (response.ok) {
            const data = await response.json();
            reply = data?.choices?.[0]?.message?.content || "";
            if (reply && reply.trim().length > 20) {
              return res.status(200).json({ reply: reply.trim(), source: "openrouter" });
            }
          }
        } catch (orErr) {
          console.warn(`[api/chat] OpenRouter ${model} error:`, orErr.message);
        }
      }
    }

    // 3. OpenAI (only if genuine sk- key)
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
            max_tokens: 700,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          reply = openaiData?.choices?.[0]?.message?.content || "";
          if (reply && reply.length > 20) {
            return res.status(200).json({ reply: reply.trim(), source: "openai" });
          }
        }
      } catch (openaiErr) {
        console.warn("[api/chat] OpenAI failed:", openaiErr.message);
      }
    }

    return res.status(500).json({ error: "no_api_keys", message: "No LLM API keys configured" });
  } catch (err) {
    console.error("[api/chat] Error:", err);
    return res.status(500).json({ error: "server_error", message: err.message });
  }
}
