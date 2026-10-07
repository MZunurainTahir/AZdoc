/**
 * AZdoc Speech & Multilingual Intelligence Service — v3.0
 * Gemini-like continuous real-time voice input with auto language detection.
 * Powered by: Web Speech API (live interim) → Groq Whisper (final) → ElevenLabs TTS
 * Supports: Urdu, English, Punjabi, Sindhi, Pashto, Balochi, Spanish + ANY language via Whisper
 */

export type SupportedLanguage = "ur" | "en" | "pa" | "sd" | "ps" | "bal" | "es";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  greeting: string;
  voiceSample: string;
  whisperCode: string; // ISO 639-1 for Whisper
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    locale: "ur-PK",
    whisperCode: "ur",
    greeting: "السلام علیکم! میں آپ کا AI ڈاکٹر ہوں۔ آپ کس بیماری یا علامت کے بارے میں رہنمائی چاہتے ہیں؟",
    voiceSample: "مجھے کل سے سر درد اور بخار ہے",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    locale: "en-US",
    whisperCode: "en",
    greeting: "Assalam-o-Alaikum! I am your AZdoc AI Medical Consultant. How can I help with your health today?",
    voiceSample: "I have a headache and mild fever since yesterday",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "پنجابی",
    flag: "🌾",
    locale: "pa-PK",
    whisperCode: "ur", // Groq uses ur for Punjabi (Arabic script)
    greeting: "ست سری اکال / السلام علیکم! میں تہاڈا AI ڈاکٹر واں۔",
    voiceSample: "مینوں کل توں بخار تے پنڈے چ پیڑ اے",
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي",
    flag: "🏺",
    locale: "sd-PK",
    whisperCode: "ur",
    greeting: "اسلام عليڪم! مان اوھان جو AI ڊاڪٽر آھيان۔",
    voiceSample: "مون کي ڪالھ کان تپ ۽ مٿي جو سور آھي",
  },
  {
    code: "ps",
    name: "Pashto",
    nativeName: "پښتو",
    flag: "🏔️",
    locale: "ps-AF",
    whisperCode: "ps",
    greeting: "سلامونه! زه ستاسو AI ډاکټر یم۔",
    voiceSample: "ما ته له پرون راهیسې تبه او سر درد دی",
  },
  {
    code: "bal",
    name: "Balochi",
    nativeName: "بلوچی",
    flag: "🌴",
    locale: "bal-PK",
    whisperCode: "ur",
    greeting: "سلام! من شمئے AI ڈاکٹر آں۔",
    voiceSample: "منی سرا درد انت ءُ تب انت",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    locale: "es-ES",
    whisperCode: "es",
    greeting: "¡Hola! Soy tu médico de IA de AZdoc.",
    voiceSample: "Tengo fiebre y dolor de cabeza desde ayer",
  },
];

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

// High-quality multilingual ElevenLabs voice
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

let currentAudio: HTMLAudioElement | null = null;

// ─── VOICE RECORDING STATE ────────────────────────────────────────────────────

export interface VoiceRecordingOptions {
  lang: SupportedLanguage;
  onInterimTranscript?: (text: string) => void; // live interim (Gemini-like)
  onFinalTranscript?: (text: string) => void;   // final confirmed result
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  onError?: (err: string) => void;
}

export interface VoiceRecorder {
  stop: () => void;
}

/**
 * Starts Gemini-like continuous voice recording:
 * 1. Uses Web Speech API for live interim transcripts (real-time display)
 * 2. Falls back to Groq Whisper for final high-accuracy multilingual transcription
 */
export async function startVoiceRecording(
  options: VoiceRecordingOptions
): Promise<VoiceRecorder> {
  const { lang, onInterimTranscript, onFinalTranscript, onListeningStart, onListeningEnd, onError } = options;
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  let stopped = false;
  let recognition: any = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let interimText = "";

  const SpeechRecognitionCtor =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // ── Strategy 1: Web Speech API (live interim) + Groq Whisper (final) ──────
  if (SpeechRecognitionCtor) {
    try {
      recognition = new SpeechRecognitionCtor();
      // Use 'ur-PK' for all Urdu-script languages (Punjabi, Sindhi, Balochi)
      const recognitionLocale =
        lang === "pa" || lang === "sd" || lang === "bal" ? "ur-PK" : langInfo.locale;
      recognition.lang = recognitionLocale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        onListeningStart?.();
      };

      recognition.onresult = (e: any) => {
        let interim = "";
        let finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalText += transcript + " ";
          } else {
            interim += transcript;
          }
        }
        if (interim) {
          interimText = interim;
          onInterimTranscript?.(interim);
        }
        if (finalText.trim()) {
          onInterimTranscript?.(finalText.trim());
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        console.warn("[SpeechAPI] Error:", e.error);
        // Don't call onError for common transient errors
      };

      recognition.onend = () => {
        if (!stopped) return;
        onListeningEnd?.();
      };

      recognition.start();

      // Also start MediaRecorder in parallel for Groq Whisper final pass
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.start(250);
      } catch {
        // MediaRecorder optional; Web Speech alone is fine
      }

      return {
        stop: async () => {
          stopped = true;
          try { recognition?.stop(); } catch { /* ok */ }

          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            // Wait for data
            await new Promise<void>((res) => setTimeout(res, 500));
          }
          stream?.getTracks().forEach((t) => t.stop());
          onListeningEnd?.();

          // Final transcription via Groq Whisper if audio available
          if (audioChunks.length > 0 && GROQ_API_KEY) {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const whisperText = await transcribeWithGroqWhisper(audioBlob, lang);
            if (whisperText && whisperText.length > 2) {
              onFinalTranscript?.(whisperText);
              return;
            }
          }
          // Fallback to Web Speech interim result
          if (interimText.trim()) {
            onFinalTranscript?.(interimText.trim());
          }
        },
      };
    } catch (err) {
      console.warn("[Voice] Web Speech init failed, falling back to Groq-only:", err);
    }
  }

  // ── Strategy 2: MediaRecorder → Groq Whisper only (no Web Speech) ─────────
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.start();
    onListeningStart?.();

    return {
      stop: async () => {
        stopped = true;
        mediaRecorder?.stop();
        await new Promise<void>((res) => setTimeout(res, 600));
        stream?.getTracks().forEach((t) => t.stop());
        onListeningEnd?.();

        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const text = await transcribeWithGroqWhisper(audioBlob, lang);
          if (text) onFinalTranscript?.(text);
        }
      },
    };
  } catch (err) {
    onError?.("Microphone access denied. Please allow microphone in browser settings.");
    return { stop: () => {} };
  }
}

/**
 * Transcribes audio blob using Groq Whisper API — supports ANY language automatically.
 * Whisper-large-v3-turbo can detect and transcribe any spoken language.
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  targetLang: SupportedLanguage
): Promise<string> {
  return transcribeWithGroqWhisper(audioBlob, targetLang);
}

async function transcribeWithGroqWhisper(
  audioBlob: Blob,
  lang: SupportedLanguage
): Promise<string> {
  if (!GROQ_API_KEY) return "";

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  try {
    const formData = new FormData();
    // Determine optimal mime type
    const ext = audioBlob.type.includes("webm") ? "webm" : audioBlob.type.includes("ogg") ? "ogg" : "wav";
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-large-v3-turbo");
    // Let Whisper auto-detect language for best accuracy across all languages
    // Only hint the language for known supported ones
    if (["en", "ur", "ps", "es"].includes(langInfo.whisperCode)) {
      formData.append("language", langInfo.whisperCode);
    }
    formData.append(
      "prompt",
      `Medical voice consultation. The user may speak in Urdu, Punjabi, Sindhi, Pashto, Balochi, English or any other language. Transcribe exactly what is said including medical terms.`
    );
    formData.append("response_format", "json");
    formData.append("temperature", "0");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.text?.trim();
      if (text && text.length > 1) return text;
    } else {
      const errBody = await res.text();
      console.warn("[Groq Whisper] API error:", res.status, errBody);
    }
  } catch (err) {
    console.warn("[Groq Whisper] Request failed:", err);
  }
  return "";
}

/**
 * Synthesizes text into high-fidelity speech using ElevenLabs or Web Speech.
 */
export async function playTextToSpeech(
  text: string,
  lang: SupportedLanguage,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
): Promise<void> {
  stopTextToSpeech();

  // Clean markdown syntax for cleaner voice reading
  const cleanText = text
    .replace(/[#*_`~>-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .slice(0, 1200);

  // 1. Try ElevenLabs API (best quality, multilingual)
  if (ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 20 && !ELEVENLABS_API_KEY.startsWith("sk_209b")) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.8,
              style: 0.1,
              use_speaker_boost: true,
            },
          }),
        }
      );

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
        audio.onerror = () => {
          fallbackWebSpeech(cleanText, lang, onStart, onEnd, onError);
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("[ElevenLabs] Failed, using Web Speech:", err);
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
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const langPrefix = langInfo.locale.split("-")[0];
  const matchedVoice =
    voices.find((v) => v.lang === langInfo.locale) ||
    voices.find((v) => v.lang.startsWith(langPrefix)) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (matchedVoice) utterance.voice = matchedVoice;

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
 * Helper to formulate multilingual doctor responses
 */
export function translateMedicalGuidance(
  text: string,
  targetLang: SupportedLanguage,
  _domain: string = "human"
): string {
  if (targetLang === "en") return text;

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
    ur: "\n\n⚠️ *نوٹ: یہ ابتدائی طبی معلومات ہے۔ ایمرجنسی میں فوری 1122 یا ہسپتال سے رابطہ کریں۔*",
    pa: "\n\n⚠️ *نوٹ: ایہ مڈھلی طبی جانکاری اے۔ ایمرجنسی چ فوری 1122 تے کال کرو۔*",
    sd: "\n\n⚠️ *نوٽ: ھي ابتدائي طبي معلومات آھي۔ ايمرجنسي ۾ فوري 1122 سان رابطو ڪريو۔*",
    ps: "\n\n⚠️ *یادونه: دا لومړنۍ طبي مشوره ده. بیړني حالت کې 1122 ته زنګ ووهئ.*",
    bal: "\n\n⚠️ *نوٹ: اے اولی طبی معلومات انت۔ بیړنی ساعت ءَ ہسپتال ءَ روگ بہ بیت۔*",
    es: "\n\n⚠️ *Nota: Esta es información médica preliminar. En emergencias, llame al 112.*",
    en: "\n\n⚠️ *Note: This is preliminary clinical guidance. In case of emergency, call 1122.*",
  };

  return `${headers[targetLang] || ""}${text}${footers[targetLang] || ""}`;
}
