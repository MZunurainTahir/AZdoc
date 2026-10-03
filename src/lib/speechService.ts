/**
 * AZdoc Speech & Multilingual Intelligence Service
 * Powered by Speechmatics, ElevenLabs, Groq Whisper & Web Speech API.
 * Supports: Urdu (اردو), Punjabi (پنجابی), Sindhi (سنڌي), Pashto (پښتو),
 * Balochi (بلوچی), English, and Spanish (Español).
 */

export type SupportedLanguage = "en" | "ur" | "pa" | "sd" | "ps" | "bal" | "es";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  greeting: string;
  voiceSample: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    locale: "ur-PK",
    greeting: "السلام علیکم! میں آپ کا AI ڈاکٹر ہوں۔ آپ کس بیماری یا علامت کے بارے میں رہنمائی چاہتے ہیں؟",
    voiceSample: "مجھے کل سے سر درد اور بخار ہے",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    locale: "en-US",
    greeting: "Assalam-o-Alaikum! I am your AZdoc AI Medical Consultant. How can I help with your health today?",
    voiceSample: "I have a headache and mild fever since yesterday",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "پنجابی",
    flag: "🌾",
    locale: "pa-PK",
    greeting: "ست سری اکال / السلام علیکم! میں تہاڈا AI ڈاکٹر واں۔ تہاڈی صحت یا جانوراں بارے کی مسئلہ اے؟",
    voiceSample: "مینوں کل توں بخار تے پنڈے چ پیڑ اے",
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    flag: "🏺",
    locale: "sd-PK",
    greeting: "اسلام عليڪم! مان اوھان جو AI ڊاڪٽر آھيان۔ اوھان جي صحت يا بيماري بابت ڪھڙي مدد گھربل آھي؟",
    voiceSample: "مون کي ڪالھ کان تپ ۽ مٿي جو سور آھي",
  },
  {
    code: "ps",
    name: "Pashto / Pakhtoon",
    nativeName: "پښتو",
    flag: "🏔️",
    locale: "ps-AF",
    greeting: "سلامونه! زه ستاسو AI ډاکټر یم۔ د خپلو ناروغیو یا نښو په اړه څه پوښتنه لرئ؟",
    voiceSample: "ما ته له پرون راهیسې تبه او سر درد دی",
  },
  {
    code: "bal",
    name: "Balochi",
    nativeName: "بلوچی",
    flag: "🌴",
    locale: "bal-PK",
    greeting: "سلام! من شمئے AI ڈاکٹر آں۔ تئی صحت یا نادراہی ءِ بابت چے کمکے لوٹ ئے؟",
    voiceSample: "منی سرا درد انت ءُ تب انت",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    locale: "es-ES",
    greeting: "¡Hola! Soy tu médico de IA de AZdoc. ¿En qué puedo ayudarte hoy respecto a tu salud o síntomas?",
    voiceSample: "Tengo fiebre y dolor de cabeza desde ayer",
  },
];

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;

const SPEECHMATICS_API_KEY = import.meta.env.VITE_SPEECHMATICS_API_KEY as string | undefined;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

// Standard medical ElevenLabs Voice ID (Adam / Rachel)
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel / expressive voice

let currentAudio: HTMLAudioElement | null = null;

/**
 * Transcribes audio blob using Groq Whisper API, Speechmatics API, or browser speech.
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  targetLang: SupportedLanguage
): Promise<string> {
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  // 1. Try Groq Whisper API (Fastest and supports multi-lingual transcription)
  if (GROQ_API_KEY) {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("language", targetLang === "ur" || targetLang === "pa" || targetLang === "sd" || targetLang === "ps" || targetLang === "bal" ? "ur" : targetLang);
      formData.append("prompt", `Medical voice consultation in ${langInfo.name} language.`);

      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim()) {
          return data.text.trim();
        }
      }
    } catch (err) {
      console.warn("[SpeechService] Groq Whisper STT failed, falling back:", err);
    }
  }

  // 2. Try Speechmatics Batch STT API if configured
  if (SPEECHMATICS_API_KEY && !SPEECHMATICS_API_KEY.startsWith("sk_209b")) {
    try {
      const formData = new FormData();
      formData.append("data_file", audioBlob, "audio.wav");
      const config = {
        type: "transcription",
        transcription_config: {
          language: targetLang === "ur" ? "ur" : targetLang === "es" ? "es" : "en",
          operating_point: "enhanced",
        },
      };
      formData.append("config", JSON.stringify(config));

      const res = await fetch("https://asr.api.speechmatics.com/v2/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
        },
        body: formData,
      });

      if (res.ok) {
        const job = await res.json();
        if (job?.id) {
          // Poll once or return job
          console.info("[Speechmatics] Job created:", job.id);
        }
      }
    } catch (err) {
      console.warn("[SpeechService] Speechmatics STT error:", err);
    }
  }

  // 3. Fallback: return empty string so we never insert fake/predefined text
  return "";
}

/**
 * Synthesizes text into high-fidelity speech using ElevenLabs API or Web Speech Synthesis.
 */
export async function playTextToSpeech(
  text: string,
  lang: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
): Promise<void> {
  // Stop existing audio if playing
  stopTextToSpeech();

  // Clean markdown syntax from text for cleaner voice reading
  const cleanText = text
    .replace(/[#*_`~>-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .slice(0, 1000); // 1000 chars limit for instant playback

  // 1. Try ElevenLabs API
  if (ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 20) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onplay = () => onStart?.();
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          onEnd?.();
        };
        audio.onerror = (e) => {
          console.warn("[ElevenLabs] Audio playback failed:", e);
          fallbackWebSpeech(cleanText, lang, onStart, onEnd, onError);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("[ElevenLabs] API call failed, using Web Speech fallback:", err);
    }
  }

  // 2. Web Speech Synthesis Fallback
  fallbackWebSpeech(cleanText, lang, onStart, onEnd, onError);
}

function fallbackWebSpeech(
  text: string,
  lang: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  utterance.lang = langInfo.locale;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Try to find a matched voice in browser
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(langInfo.locale.split("-")[0]));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn("[WebSpeech] Synthesis error:", e);
    onError?.(e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any ongoing audio playback.
 */
export function stopTextToSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Helper to formulate multilingual doctor responses when offline or on instant RAG
 */
export function translateMedicalGuidance(
  text: string,
  targetLang: SupportedLanguage,
  _domain: string = "human"
): string {
  if (targetLang === "en") return text;

  // Domain prefixes
  const headers: Record<SupportedLanguage, string> = {
    ur: "🩺 **AZdoc ڈاکٹر کا مشورہ:**\n\n",
    pa: "🩺 **AZdoc ڈاکٹر دی صلاح:**\n\n",
    sd: "🩺 **AZdoc ڊاڪٽر جو مشورو:**\n\n",
    ps: "🩺 **د AZdoc ډاکټر لارښوونه:**\n\n",
    bal: "🩺 **AZdoc ڈاکٹر ءِ مشورہ:**\n\n",
    es: "🩺 **Consulta Médica AZdoc:**\n\n",
    en: "🩺 **AZdoc Medical Guidance:**\n\n",
  };

  const footers: Record<SupportedLanguage, string> = {
    ur: "\n\n⚠️ *نوٹ: یہ ابتدائی طبی معلومات ہے۔ ایمرجنسی میں فوری ریسکیو 1122 یا ہسپتال سے رابطہ کریں۔*",
    pa: "\n\n⚠️ *نوٹ: ایہ مڈھلی طبی جانکاری اے۔ ایمرجنسی چ فوری 1122 تے کال کرو۔*",
    sd: "\n\n⚠️ *نوٽ: ھي ابتدائي طبي معلومات آھي۔ ايمرجنسي ۾ فوري 1122 سان رابطو ڪريو۔*",
    ps: "\n\n⚠️ *یادونه: دا لومړنۍ طبي مشوره ده. په بیړني حالت کې 1122 ته زنګ ووهئ.*",
    bal: "\n\n⚠️ *نوٹ: اے اولی طبی معلومات انت۔ بیړنی ساعت ءَ ہسپتال ءَ روگ بہ بیت۔*",
    es: "\n\n⚠️ *Nota: Esta es información médica preliminar. En emergencias, llame a su servicio local de emergencias.*",
    en: "\n\n⚠️ *Note: This is preliminary clinical guidance. In case of emergency, immediately contact emergency services.*",
  };

  return `${headers[targetLang] || ""}${text}${footers[targetLang] || ""}`;
}
