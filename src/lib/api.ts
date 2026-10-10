/**
 * Client for the AZdoc backend (real AI diagnosis + chat).
 * All calls degrade gracefully: if the backend is unreachable (offline,
 * not deployed yet, cold start, etc.) callers fall back to the local
 * mock logic already used elsewhere in the app — the UI never breaks.
 */
import { isOnline } from "./db";
import type { DomainId } from "./domains";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

const REQUEST_TIMEOUT_MS = 45_000;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = API_URL ? `${API_URL}${path}` : path;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

export interface DiagnoseResponse {
  disease: string;
  matchedKey: string | null;
  confidence: number;
  isHealthy: boolean;
  description: string;
  remedy?: string;
  source: "ai" | "mock";
}

/**
 * Build the vision prompt for diagnosis
 */
function buildVisionPrompt(params: {
  mode: DomainId;
  lang: "en" | "ur";
  symptoms?: Record<string, unknown>;
}): string {
  return `You are a lead medical, veterinary, and agricultural multi-modal AI vision specialist for domain: ${params.mode}.
Language requested: ${params.lang === "ur" ? "Urdu script" : "English"}.
User symptoms: ${params.symptoms ? JSON.stringify(params.symptoms) : "None specified"}.

STRICT ACCURACY & MULTI-MODAL DIAGNOSTIC INSTRUCTIONS:
1. Examine the visual features of the provided image in detail (color, lesion shape, anatomical location, texture, species/organ). DO NOT output generic or repetitive diagnoses!
2. HUMAN DIAGNOSTICS:
   - Eye photos (redness, discharge, sclera) -> Prescribe Moxifloxacin drops / cool compress. NEVER prescribe skin creams/Clotrimazole for eyes!
   - Throat photos (exudate, swollen tonsils) -> Prescribe gargles, Paracetamol, Amoxicillin. NEVER prescribe skin creams for throats!
   - Skin Fungal (circular ring rash) -> Prescribe Clotrimazole 1% Cream or Terbinafine 1%.
   - Skin Eczema (dry flexor rash) -> Prescribe Hydrocortisone 1% cream and emollients.
3. PET DIAGNOSTICS (PetsDoc):
   - Ticks/Fleas (bugs attached to coat) -> Prescribe Bravecto (Fluralaner) / Simparica / Frontline Plus.
   - Mange (hair loss, crusty skin) -> Prescribe Simparica / NexGard / Benzoyl Peroxide baths.
   - Cat Ear Mites (coffee ground ear wax) -> Prescribe Selamectin (Revolution Spot-on) & Surolan drops. NEVER prescribe Permethrin to cats!
   - Hotspot (wet oozing lesion) -> Prescribe E-collar, Chlorhexidine wash, Cephalexin.

Return ONLY a valid JSON object in this exact format:
{
  "disease": "Exact clinical or botanical name of condition specific to this image",
  "matchedKey": null,
  "confidence": 0.92,
  "isHealthy": false,
  "description": "2-3 sentences describing unique visual signs seen in this specific image",
  "remedy": "Anatomy and species safe step-by-step treatment plan with exact medicine names, dosage, care tips, and precautions.${params.lang === "ur" ? " (Write in Urdu)" : ""}"
}`;
}

/**
 * Parse the raw LLM vision JSON response
 */
function parseVisionResponse(rawContent: string): DiagnoseResponse | null {
  try {
    const cleaned = rawContent.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return {
      disease: parsed.disease || "Diagnosed Condition",
      matchedKey: parsed.matchedKey || null,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.85)),
      isHealthy: Boolean(parsed.isHealthy),
      description: parsed.description || "",
      remedy: parsed.remedy || parsed.description || "",
      source: "ai",
    };
  } catch (err) {
    console.warn("[api] Failed to parse vision JSON:", err);
    return null;
  }
}

async function callVisionDirect(params: {
  imageBase64: string;
  mode: DomainId;
  lang: "en" | "ur";
  symptoms?: Record<string, unknown>;
}): Promise<DiagnoseResponse | null> {
  const imageDataUrl = params.imageBase64.startsWith("data:")
    ? params.imageBase64
    : `data:image/jpeg;base64,${params.imageBase64}`;
  const promptText = buildVisionPrompt(params);

  // 1. Try OpenAI GPT-4o-mini Vision (only if genuine OpenAI key, not DeepSeek)
  if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith("sk-") && OPENAI_API_KEY !== (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined)) {
    try {
      console.log("[api/vision] Attempting OpenAI GPT-4o-mini...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
          max_tokens: 1000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data?.choices?.[0]?.message?.content || "";
        const parsed = parseVisionResponse(rawContent);
        if (parsed) {
          console.log("[api/vision] ✅ OpenAI response parsed");
          return parsed;
        }
      } else {
        const errText = await res.text();
        console.warn("[api/vision] OpenAI error:", res.status, errText);
      }
    } catch (err) {
      console.warn("[api/vision] OpenAI call failed:", err);
    }
  }

  // 2. Try OpenRouter Vision (fallback)
  if (OPENROUTER_API_KEY) {
    try {
      console.log("[api/vision] Attempting OpenRouter...");
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          max_tokens: 1000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data?.choices?.[0]?.message?.content || "";
        const parsed = parseVisionResponse(rawContent);
        if (parsed) {
          console.log("[api/vision] ✅ OpenRouter response parsed");
          return parsed;
        }
      } else {
        const errText = await res.text();
        console.warn("[api/vision] OpenRouter error:", res.status, errText);
      }
    } catch (err) {
      console.warn("[api/vision] OpenRouter call failed:", err);
    }
  }

  return null;
}

export async function requestDiagnosis(params: {
  imageBase64: string;
  mode: DomainId;
  lang: "en" | "ur";
  symptoms?: Record<string, unknown>;
}): Promise<DiagnoseResponse | null> {
  if (!isOnline()) return null;

  // Try direct LLM vision first (faster, no backend needed)
  const directResult = await callVisionDirect(params);
  if (directResult) return directResult;

  // Fall back to backend API
  try {
    const backendRes = await postJson<DiagnoseResponse>("/api/diagnose", params);
    if (backendRes && backendRes.disease) return backendRes;
  } catch (err) {
    console.warn("[api] diagnosis request to backend also failed:", err);
  }

  return null;
}

export interface ChatResponse {
  reply: string;
  source: "ai" | "mock";
}

export async function requestChatReply(params: {
  messages: { role: "user" | "assistant"; content: string }[];
  lang: "en" | "ur";
  /** Active AZdoc domain — switches the AI persona & knowledge focus */
  domain?: DomainId;
}): Promise<ChatResponse | null> {
  if (!isOnline()) return null;
  try {
    return await postJson<ChatResponse>("/api/chat", params);
  } catch (err) {
    console.warn("[api] chat request failed, will use local fallback:", err);
    return null;
  }
}

export function isBackendConfigured(): boolean {
  return Boolean(API_URL);
}
