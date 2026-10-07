/**
 * AZdoc Speech & Multilingual Intelligence Service — v4.0
 * 
 * KEY FIX: Web Speech API (browser) does NOT support Urdu, Punjabi, Sindhi,
 * Balochi properly on most browsers — it terminates immediately.
 * Solution: For all RTL/Urdu-script languages → use ONLY Groq Whisper via MediaRecorder.
 * For English/Spanish → use Web Speech API (interim) + Groq Whisper (final).
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
  whisperCode: string;
  webSpeechSupported: boolean; // Whether Web Speech API works reliably for this lang
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    locale: "ur-PK",
    whisperCode: "ur",
    webSpeechSupported: false, // ❌ Web Speech kills immediately for Urdu
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
    webSpeechSupported: true, // ✅ Works great
    greeting: "Assalam-o-Alaikum! I am your AZdoc AI Medical Consultant. How can I help with your health today?",
    voiceSample: "I have a headache and mild fever since yesterday",
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "پنجابی",
    flag: "🌾",
    locale: "pa-PK",
    whisperCode: "ur",
    webSpeechSupported: false, // ❌ No browser support for pa-PK
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
    webSpeechSupported: false,
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
    webSpeechSupported: false,
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
    webSpeechSupported: false,
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
    webSpeechSupported: true, // ✅ Generally works
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
 * Gets the best supported MIME type for audio recording
 */
function getBestMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "",
  ];
  for (const type of types) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/**
 * Starts voice recording with the best strategy for the selected language:
 * - For Urdu/Punjabi/Sindhi/Pashto/Balochi: ONLY MediaRecorder → Groq Whisper
 *   (Web Speech API fails immediately for these languages in all major browsers)
 * - For English/Spanish: Web Speech API (live interim) + Groq Whisper (final)
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

  // ── Strategy A: RTL/Urdu-script languages → MediaRecorder ONLY ───────────
  // Web Speech API does NOT support Urdu/Punjabi/Sindhi/Pashto/Balochi reliably
  // It starts and immediately fires 'end' event when encountering RTL text
  if (!langInfo.webSpeechSupported) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getBestMimeType();
      const recorderOptions = mimeType ? { mimeType } : undefined;
      mediaRecorder = new MediaRecorder(stream, recorderOptions);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      // Collect data every 2 seconds for potential live preview
      mediaRecorder.start(2000);
      onListeningStart?.();

      return {
        stop: async () => {
          if (stopped) return;
          stopped = true;
          
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          // Wait for remaining audio data
          await new Promise<void>((res) => setTimeout(res, 600));
          stream?.getTracks().forEach((t) => t.stop());
          onListeningEnd?.();

          if (audioChunks.length > 0 && GROQ_API_KEY) {
            const actualMime = mediaRecorder?.mimeType || "audio/webm";
            const audioBlob = new Blob(audioChunks, { type: actualMime });
            const text = await transcribeWithGroqWhisper(audioBlob, lang, actualMime);
            if (text && text.trim().length > 1) {
              onFinalTranscript?.(text.trim());
            } else {
              onError?.("آواز نہیں پکڑی جا سکی۔ دوبارہ کوشش کریں۔ (Voice not captured, please try again)");
            }
          }
        },
      };
    } catch (err) {
      console.error("[Voice/RTL] Microphone error:", err);
      onError?.("مائیکروفون تک رسائی نہیں۔ براہ کرم براؤزر میں مائیکروفون اجازت دیں۔");
      return { stop: () => {} };
    }
  }

  // ── Strategy B: Web Speech API (EN/ES) + Groq Whisper (final) ──────────
  const SpeechRecognitionCtor =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (SpeechRecognitionCtor) {
    try {
      recognition = new SpeechRecognitionCtor();
      recognition.lang = langInfo.locale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        onListeningStart?.();
      };

      recognition.onresult = (e: any) => {
        let interim = "";
        let finalPart = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalPart += transcript + " ";
          } else {
            interim += transcript;
          }
        }
        if (interim) {
          interimText = interim;
          onInterimTranscript?.(interim);
        }
        if (finalPart.trim()) {
          interimText = finalPart.trim();
          onInterimTranscript?.(finalPart.trim());
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        console.warn("[SpeechAPI] Error:", e.error);
      };

      recognition.onend = () => {
        if (!stopped) {
          // Restart for continuous listening
          try { recognition?.start(); } catch { /* ok, already stopped */ }
        }
      };

      recognition.start();

      // Also start MediaRecorder in parallel for Groq Whisper final pass
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getBestMimeType();
        const recorderOptions = mimeType ? { mimeType } : undefined;
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.start(250);
      } catch {
        // MediaRecorder optional; Web Speech alone is fine for EN/ES
      }

      return {
        stop: async () => {
          if (stopped) return;
          stopped = true;
          try { recognition?.stop(); } catch { /* ok */ }

          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            await new Promise<void>((res) => setTimeout(res, 500));
          }
          stream?.getTracks().forEach((t) => t.stop());
          onListeningEnd?.();

          // Final transcription via Groq Whisper if audio available
          if (audioChunks.length > 0 && GROQ_API_KEY) {
            const actualMime = mediaRecorder?.mimeType || "audio/webm";
            const audioBlob = new Blob(audioChunks, { type: actualMime });
            const whisperText = await transcribeWithGroqWhisper(audioBlob, lang, actualMime);
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
      console.warn("[Voice] Web Speech init failed, falling back to MediaRecorder:", err);
    }
  }

  // ── Strategy C: Pure MediaRecorder fallback ────────────────────────────────
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getBestMimeType();
    const recorderOptions = mimeType ? { mimeType } : undefined;
    mediaRecorder = new MediaRecorder(stream, recorderOptions);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.start();
    onListeningStart?.();

    return {
      stop: async () => {
        if (stopped) return;
        stopped = true;
        mediaRecorder?.stop();
        await new Promise<void>((res) => setTimeout(res, 600));
        stream?.getTracks().forEach((t) => t.stop());
        onListeningEnd?.();

        if (audioChunks.length > 0) {
          const actualMime = mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunks, { type: actualMime });
          const text = await transcribeWithGroqWhisper(audioBlob, lang, actualMime);
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
  return transcribeWithGroqWhisper(audioBlob, targetLang, audioBlob.type);
}

async function transcribeWithGroqWhisper(
  audioBlob: Blob,
  lang: SupportedLanguage,
  mimeType?: string
): Promise<string> {
  if (!GROQ_API_KEY) return "";

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  try {
    const formData = new FormData();
    
    // Determine file extension from mime type
    const actualMime = mimeType || audioBlob.type || "audio/webm";
    let ext = "webm";
    if (actualMime.includes("ogg")) ext = "ogg";
    else if (actualMime.includes("mp4") || actualMime.includes("m4a")) ext = "mp4";
    else if (actualMime.includes("wav")) ext = "wav";
    else if (actualMime.includes("mp3")) ext = "mp3";

    formData.append("file", audioBlob, `recording.${ext}`);
    formData.append("model", "whisper-large-v3-turbo");
    
    // For Urdu and related languages, explicitly hint language for better accuracy
    if (langInfo.whisperCode && ["ur", "ps", "es", "en"].includes(langInfo.whisperCode)) {
      formData.append("language", langInfo.whisperCode);
    }
    
    // Add a medical context prompt for better transcription accuracy
    const promptByLang: Partial<Record<SupportedLanguage, string>> = {
      ur: "طبی مشاورت۔ مریض اردو میں بیماری، دوائی، یا علامات کے بارے میں بات کر رہے ہیں۔",
      pa: "طبی مشاورت۔ مریض پنجابی یا اردو میں بات کر رہے ہیں۔",
      en: "Medical consultation. Patient describing symptoms, medications, or health concerns.",
      es: "Consulta médica. El paciente describe síntomas o preguntas de salud.",
    };
    formData.append(
      "prompt",
      promptByLang[lang] || "Medical consultation in any language. Transcribe accurately."
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
  if (ELEVENLABS_API_KEY && ELEVENLABS_API_KEY.length > 20) {
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
