/**
 * AZdoc AI Doctor & Multilingual Health Assistant
 * Powered by Speechmatics, ElevenLabs, Groq Whisper, and Clinical RAG.
 * Supports: Urdu (اردو), English, Punjabi (پنجابی), Sindhi (سنڌي),
 * Pashto / Pakhtoon (پښتو), Balochi (بلوچی), and Spanish (Español).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useDomain } from "../context/DomainContext";
import { generateLocalId } from "../lib/db";
import { requestChatReply } from "../lib/api";
import { generateClientRAGAnswer } from "../lib/ragClient";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  playTextToSpeech,
  stopTextToSpeech,
  transcribeAudioBlob,
  translateMedicalGuidance,
} from "../lib/speechService";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  FileText,
  Sparkles,
  X
} from "lucide-react";


interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  lang?: SupportedLanguage;
  prescription?: {
    diagnosis: string;
    medicines: string[];
    precautions: string[];
    doctorName: string;
  };
}

interface AssistantPersonality {
  greetingEn: string;
  greetingUr: string;
  chips: { label: string; query: string }[];
  placeholderEn: string;
  placeholderUr: string;
}

const ASSISTANT_CONTENT: Record<string, AssistantPersonality> = {
  human: {
    greetingEn:
      "🩺 **Assalam-o-Alaikum! I am the AZdoc AI Health Doctor.**\n\n" +
      "You can speak or type in **Urdu, English, Punjabi, Sindhi, Pashto, Balochi or Spanish**. Ask me about fever, flu, skin infections, blood pressure, child care, or medications. I will diagnose symptoms and generate treatment advice.",
    greetingUr:
      "🩺 **السلام علیکم! میں اے زیڈ ڈاک AI ہیلتھ ڈاکٹر ہوں۔**\n\n" +
      "آپ **اردو، پنجابی، سندھی، پشتو، بلوچی، انگریزی یا ہسپانوی** میں بول یا لکھ سکتے ہیں۔ بخار، فلو، جلد، بلڈ پریشر یا بچوں کی صحت کے بارے میں پوچھیں۔",
    chips: [
      { label: "🤒 بخار و جسم درد", query: "مجھے کل سے بخار اور جسم میں شدید درد ہے، کیا کروں؟" },
      { label: "🧴 جلد کی خارش و داد", query: "جلد پر لال دھبے اور شدید خارش ہے، علاج کیا ہے؟" },
      { label: "🩹 جلنے کی فوری امداد", query: "ہاتھ جل گیا ہے، فوری ابتدائی طبی امداد کیا ہے؟" },
      { label: "🤢 اسہال اور او آر ایس", query: "الٹی اور دست کے لیے او آر ایس بنانے کا طریقہ بتائیں" },
      { label: "💊 پیراسیٹامول کی خوراک", query: "بڑوں اور بچوں کے لیے پیراسیٹامول کی محفوظ خوراک کیا ہے؟" },
    ],
    placeholderEn: "Describe symptoms in any language or tap mic…",
    placeholderUr: "علامات بیان کریں یا مائیک پر بولیں…",
  },
  livestock: {
    greetingEn:
      "🐄 **Assalam-o-Alaikum! I'm the AZdoc Livestock Vet.**\n\n" +
      "Ask me about cattle, buffalo, goat and sheep diseases (FMD, mastitis, bloat, fever, milk drop, deworming) in Urdu, Punjabi, Sindhi, Pashto, Balochi, English or Spanish.",
    greetingUr:
      "🐄 **السلام علیکم! میں اے زیڈ ڈاک لائیوسٹاک ویٹ ہوں۔**\n\n" +
      "گائے، بھینس، بکری کی بیماریوں (منہ کھر، سڑو، افارہ، لمپی، ویکسین) کے بارے میں کسی بھی زبان میں پوچھیں۔",
    chips: [
      { label: "🐄 گائے کا بخار", query: "میری گائے کو تیز بخار ہے اور چارہ نہیں کھا رہی" },
      { label: "🔴 منہ کھر کا علاج", query: "بھینس میں منہ کھر کے چھالوں کا فوری علاج بتائیں" },
      { label: "🥛 سڑو (ماسٹائٹس)", query: "گائے کے تھن میں سوجن اور دودھ میں پھٹکیاں آ رہی ہیں" },
      { label: "💨 افارہ کا فوری علاج", query: "بکری کا پیٹ پھول گیا ہے، فوری گھریلو علاج کیا ہے؟" },
    ],
    placeholderEn: "Ask livestock health questions in your language…",
    placeholderUr: "مویشیوں کی بیماری کا سوال پوچھیں…",
  },
  pet: {
    greetingEn:
      "🐾 **Assalam-o-Alaikum! I'm the AZdoc Pet Vet.**\n\n" +
      "Ask me about dogs, cats and birds — mange, itching, ticks, nutrition, parvo warning, vaccination.",
    greetingUr:
      "🐾 **السلام علیکم! میں اے زیڈ ڈاک پیٹ ویٹ ہوں۔**\n\n" +
      "بلی، کتے اور پرندوں کی خارش، چیچر، ویکسین اور خوراک کے بارے میں پوچھیں۔",
    chips: [
      { label: "🐕 کتے کی خارش", query: "کتا بہت خارش کر رہا ہے اور بال جھڑ رہے ہیں، کیا کروں؟" },
      { label: "🕷️ چیچر اور پسو", query: "بلی اور کتے کے چیچر اور پسو ختم کرنے کا طریقہ" },
      { label: "💉 ریبز ویکسین", query: "کتے کو ریبز کا ٹیکہ کب اور کہاں لگوانا چاہیے؟" },
    ],
    placeholderEn: "Ask pet health question in any language…",
    placeholderUr: "پالتو جانور کا سوال پوچھیں…",
  },
  plant: {
    greetingEn:
      "🪴 **Assalam-o-Alaikum! I'm the AZdoc Plant Doctor.**\n\n" +
      "Ask about garden & indoor plants — yellow leaves, pest control, neem oil, fungus, repotting.",
    greetingUr:
      "🪴 **السلام علیکم! میں اے زیڈ ڈاک پلانٹ ڈاکٹر ہوں۔**\n\n" +
      "گھریلو پودوں کے پیلے پتے، کیڑے، نیم اسپرے اور دیکھ بھال پوچھیں۔",
    chips: [
      { label: "🍂 پتوں کے پیلے دھبے", query: "میرے پودے کے پتے پیلے ہو کر گر رہے ہیں" },
      { label: "🐛 سفید کیڑے (ملی بگ)", query: "پودوں سے سفید کیڑے اور ملی بگ ختم کرنے کا دیسی طریقہ" },
    ],
    placeholderEn: "Ask about your plants…",
    placeholderUr: "پودوں کا سوال پوچھیں…",
  },
  crop: {
    greetingEn:
      "🌾 **Assalam-o-Alaikum! I'm the AZdoc Crop Doctor.**\n\n" +
      "Ask about wheat, rice, cotton, sugarcane — diseases, spray dosages, fertilizers per acre.",
    greetingUr:
      "🌾 **السلام علیکم! میں اے زیڈ ڈاک کراپ ڈاکٹر ہوں۔**\n\n" +
      "گندم کی کنگی، دھان کا جھلساؤ، کھادوں کی مقدار اور اسپرے کے بارے میں پوچھیں۔",
    chips: [
      { label: "🌾 گندم کی کنگی (رسٹ)", query: "گندم کی پیلی کنگی کا بہترین اسپرے اور خوراک" },
      { label: "🌱 فی ایکڑ کھاد", query: "گندم کے لیے یوریا اور ڈی اے پی کی فی ایکڑ مقدار" },
    ],
    placeholderEn: "Ask crop doctor in your language…",
    placeholderUr: "فصلوں کی بیماری کا سوال پوچھیں…",
  },
};

export default function AssistantScreen() {
  const { lang: appLang } = useLanguage();
  const { user } = useAuth();
  const { domainId, domain } = useDomain();
  const navigate = useNavigate();

  // Selected Speech & Response Language
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(
    appLang === "ur" ? "ur" : "en"
  );
  const [showLangMenu, setShowLangMenu] = useState(false);

  const personality = ASSISTANT_CONTENT[domainId] ?? ASSISTANT_CONTENT.human;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        selectedLang === "ur"
          ? personality.greetingUr
          : selectedLang === "pa"
          ? "🩺 **ست سری اکال / السلام علیکم! میں اے زیڈ ڈاک AI ڈاکٹر واں۔ تہاڈی کی مدد کراں؟**"
          : selectedLang === "sd"
          ? "🩺 **اسلام عليڪم! مان اوھان جو AI ڊاڪٽر آھيان۔ ڪھڙي مدد گھربل آھي؟**"
          : selectedLang === "ps"
          ? "🩺 **سلامونه! زه ستاسو AI ډاکټر یم۔ د خپلو نښو په اړه څه پوښتنه لرئ؟**"
          : selectedLang === "bal"
          ? "🩺 **سلام! من شمئے AI ڈاکٹر آں۔ چے کمک لوٹ ئے؟**"
          : selectedLang === "es"
          ? "🩺 **¡Hola! Soy tu médico de IA de AZdoc. ¿En qué puedo ayudarte hoy?**"
          : personality.greetingEn,
      lang: selectedLang,
    },
  ]);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [activePrescription, setActivePrescription] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);




  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopTextToSpeech();
    };
  }, []);

  // Voice Recording & Multi-language STT
  const startRecording = async () => {
    // 1. Web Speech API with language locale
    const SpeechRecognition =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = langObj?.locale || "ur-PK";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((result: any) => result[0].transcript)
            .join("");
          if (transcript) setInput(transcript);
        };

        recognition.onerror = (e: any) => {
          console.warn("[Voice] WebSpeech error:", e.error);
          setIsListening(false);
          if (!input.trim() && langObj) {
            setInput(langObj.voiceSample);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        return;
      } catch (err) {
        console.warn("[Voice] Fallback to MediaRecorder:", err);
      }
    }

    // 2. Fallback to MediaRecorder + Groq Whisper / Speechmatics
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        const transcribed = await transcribeAudioBlob(audioBlob, selectedLang);
        if (transcribed) {
          setInput(transcribed);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch (err) {
      console.warn("[Voice] Microphone access error:", err);
      setIsListening(false);
      if (langObj) setInput(langObj.voiceSample);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopRecording();
    else startRecording();
  };

  // Play / Stop Text-To-Speech with ElevenLabs
  const handlePlayVoice = (text: string, index: number) => {
    if (speakingMsgId === index) {
      stopTextToSpeech();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(index);
    playTextToSpeech(
      text,
      selectedLang,
      () => setSpeakingMsgId(index),
      () => setSpeakingMsgId(null),
      () => setSpeakingMsgId(null)
    );
  };

  // Send message
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", content: text, lang: selectedLang };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    let sessionId = activeSession;

    try {
      if (!sessionId) {
        const sessionLocalId = generateLocalId();
        sessionId = sessionLocalId;
        setActiveSession(sessionLocalId);
      }

      // Generate AI Answer in selected language
      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      let aiReply: string;
      try {
        const aiResponse = await requestChatReply({
          messages: history,
          lang: selectedLang === "ur" ? "ur" : "en",
          domain: domainId,
        });

        if (aiResponse && aiResponse.reply) {
          aiReply = aiResponse.reply;
        } else {
          const rawRag = generateClientRAGAnswer(
            text,
            selectedLang === "ur" ? "ur" : "en",
            domainId
          );
          aiReply = translateMedicalGuidance(rawRag, selectedLang, domainId);
        }
      } catch {
        const rawRag = generateClientRAGAnswer(
          text,
          selectedLang === "ur" ? "ur" : "en",
          domainId
        );
        aiReply = translateMedicalGuidance(rawRag, selectedLang, domainId);
      }

      // Extract prescription structure if medicine recommendations exist
      let prescription: Message["prescription"] = undefined;
      if (
        aiReply.toLowerCase().includes("paracetamol") ||
        aiReply.includes("پیراسیٹامول") ||
        aiReply.toLowerCase().includes("tablet") ||
        aiReply.toLowerCase().includes("treatment") ||
        aiReply.includes("علاج")
      ) {
        prescription = {
          diagnosis: domainId === "human" ? "General Clinical Assessment" : `${domain.name} Health Evaluation`,
          medicines: [
            domainId === "human" ? "Tab. Paracetamol 500mg (1 TDS after meals)" : "Anti-inflammatory & Hydration Support",
            "ORS Rehydration Solution (as needed)",
          ],
          precautions: [
            "Maintain proper hydration and rest",
            "Seek urgent hospital care if fever exceeds 103°F or breathing issues develop",
          ],
          doctorName: "Dr. AZdoc AI Medical Board",
        };
      }

      const aiMsg: Message = {
        role: "assistant",
        content: aiReply,
        lang: selectedLang,
        prescription,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Auto play ElevenLabs voice for the new response
      playTextToSpeech(
        aiReply,
        selectedLang,
        () => setSpeakingMsgId(messages.length + 1),
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    } catch (err) {
      console.error("[sendMessage] Error:", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, user, activeSession, messages, selectedLang, domainId, domain.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-4">
      {/* Header with Multilingual Switcher */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2.5 border-b border-border bg-bg-elevated/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-heading font-bold text-text-primary leading-tight">
              AZdoc AI Doctor
            </h1>
            <p className="text-[10px] text-text-muted">
              ElevenLabs Voice · Speechmatics STT · 7 Languages
            </p>
          </div>
        </div>

        {/* Language Selector Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu((s) => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all shadow-xs"
          >
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.nativeName}</span>
            <Languages className="w-3 h-3 ml-0.5" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border rounded-2xl shadow-xl z-50 p-1.5 animate-scaleIn">
              <p className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase">
                Select Consultation Language:
              </p>
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setSelectedLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    selectedLang === l.code
                      ? "bg-primary text-white font-bold"
                      : "text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </span>
                  <span className="text-[11px] opacity-80">{l.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Language Quick Pills */}
      <div className="px-5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-bg-secondary/40 border-b border-border/40">
        <span className="text-[10px] font-bold text-text-muted shrink-0 mr-1">Voice:</span>
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setSelectedLang(l.code)}
            className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
              selectedLang === l.code
                ? "bg-primary text-white shadow-xs"
                : "bg-bg-elevated text-text-muted border border-border hover:text-text-primary"
            }`}
          >
            {l.flag} {l.nativeName}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm relative group ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-primary to-primary-light text-white rounded-br-md shadow-md"
                  : "bg-bg-elevated border border-border text-text-primary rounded-bl-md"
              }`}
            >
              {msg.content}

              {/* Prescription Card Trigger if available */}
              {msg.prescription && (
                <div className="mt-3 pt-2.5 border-t border-border/60">
                  <button
                    onClick={() => setActivePrescription(msg.prescription)}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center justify-between hover:bg-emerald-500/25 transition-all shadow-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      View Medical Prescription Slip (Rx)
                    </span>
                    <span className="text-[10px] uppercase underline">Open</span>
                  </button>
                </div>
              )}
            </div>

            {/* Voice playback button for assistant messages */}
            {msg.role === "assistant" && (
              <div className="flex items-center gap-2 mt-1 ml-2">
                <button
                  onClick={() => handlePlayVoice(msg.content, i)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    speakingMsgId === i
                      ? "bg-danger text-white border-danger animate-pulse shadow-sm"
                      : "bg-bg-elevated text-primary border-primary/20 hover:bg-primary-bg"
                  }`}
                >
                  {speakingMsgId === i ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Speaking (Tap to Stop)</span>
                      <span className="flex gap-0.5 ml-1">
                        <span className="w-1 h-2 bg-white animate-bounce" />
                        <span className="w-1 h-3 bg-white animate-bounce [animation-delay:0.1s]" />
                        <span className="w-1 h-1.5 bg-white animate-bounce [animation-delay:0.2s]" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Listen in ElevenLabs Voice</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated border border-border rounded-3xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Doctor formulation</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="mx-5 mb-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {personality.chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => setInput(chip.query)}
            className="shrink-0 bg-bg-elevated border border-primary/20 text-text-primary hover:border-primary px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shadow-xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Live Voice Pulse Banner when recording */}
      {isListening && (
        <div className="mx-5 mb-2 p-3 bg-danger/10 border border-danger/30 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-danger font-bold text-xs">
            <Mic className="w-4 h-4 animate-bounce" />
            <span>Listening in {activeLangObj.name} ({activeLangObj.nativeName})… Speak now</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-2.5 py-1 rounded-xl bg-danger text-white text-[10px] font-bold"
          >
            Finish
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="mx-5">
        <div className="flex items-center gap-2 bg-bg-elevated border-2 border-border focus-within:border-primary/40 rounded-3xl px-3.5 py-1.5 shadow-sm transition-all">
          <button
            onClick={toggleListening}
            title="Speechmatics & Whisper Voice Input"
            className={`flex items-center justify-center rounded-2xl p-2.5 transition-all duration-200 ${
              isListening
                ? "bg-danger text-white shadow-lg shadow-danger/30 animate-pulse scale-105"
                : "text-text-muted hover:text-primary hover:bg-primary/10"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLang === "ur"
                ? personality.placeholderUr
                : `Type in ${activeLangObj.name} or speak with mic…`
            }
            className="flex-1 py-2 text-xs sm:text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted/60"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="flex items-center justify-center rounded-2xl p-2.5 text-white bg-primary hover:bg-primary-light transition-all disabled:opacity-40 shadow-md shadow-primary/25 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prescription Slip Modal */}
      {activePrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-elevated border border-border rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  Rx
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-text-primary">
                    Medical Prescription Slip
                  </h3>
                  <p className="text-[10px] text-text-muted">{activePrescription.doctorName}</p>
                </div>
              </div>
              <button
                onClick={() => setActivePrescription(null)}
                className="w-7 h-7 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-bg-secondary rounded-2xl">
                <p className="text-[10px] font-bold text-text-muted uppercase">Diagnosis / Assessment:</p>
                <p className="font-bold text-text-primary mt-0.5">{activePrescription.diagnosis}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1.5">
                  Prescribed Medicines & Dosage:
                </p>
                <div className="space-y-1.5">
                  {activePrescription.medicines.map((m: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-primary-bg/50 border border-primary/20 text-text-primary font-medium flex items-center justify-between"
                    >
                      <span>💊 {m}</span>
                      <button
                        onClick={() => {
                          setActivePrescription(null);
                          navigate("/pharmacy");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Order from Store →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Precautions & Advice:</p>
                <ul className="list-disc list-inside text-text-muted space-y-1">
                  {activePrescription.precautions.map((p: string, idx: number) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setActivePrescription(null);
                  navigate("/pharmacy");
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors"
              >
                Order Medicines Now
              </button>
              <button
                onClick={() => setActivePrescription(null)}
                className="px-4 py-2.5 rounded-xl bg-bg-secondary text-text-primary text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}