/**
 * AZdoc AI Doctor — Complete Multilingual Health Assistant
 * Features:
 *  • Camera photo capture + AI image analysis (DeepSeek)
 *  • 7-language voice input (Urdu, English, Punjabi, Sindhi, Pashto, Balochi, Spanish)
 *  • DeepSeek LLM for accurate, detailed medical responses
 *  • ElevenLabs TTS audio playback
 *  • Domain-specific AI personas (Human, Livestock, Pet, Plant, Crop)
 *  • Prescription slips & pharmacy linking
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useDomain } from "../context/DomainContext";
import { generateLocalId } from "../lib/db";
import { askDeepSeekDoctor } from "../lib/deepseekClient";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  playTextToSpeech,
  stopTextToSpeech,
  transcribeAudioBlob,
} from "../lib/speechService";
import {
  Send, Mic, MicOff, Volume2, VolumeX,
  Languages, FileText, Sparkles, X,
  Camera, CameraOff, Image as ImageIcon, Upload,
  AlertCircle, RotateCcw, ChevronDown,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  lang?: SupportedLanguage;
  imageUrl?: string;
  prescription?: {
    diagnosis: string;
    medicines: string[];
    precautions: string[];
    doctorName: string;
  };
}

const CHIPS_BY_LANG: Record<string, Record<string, { label: string; query: string }[]>> = {
  en: {
    human: [
      { label: "🤒 Fever & Body Pain", query: "I have had a fever and body pain since yesterday. Please provide the diagnosis, causes, and recommended medication dosage." },
      { label: "🧴 Skin Rash & Itching", query: "I have red patches on my skin with severe itching. What is the diagnosis and recommended cream?" },
      { label: "💊 Paracetamol Dosage", query: "What is the safe Paracetamol dosage for adults and children?" },
      { label: "🩸 Blood Pressure Care", query: "What are the recommended medicines and lifestyle guidance for high blood pressure?" },
      { label: "🤢 Vomiting & Diarrhea", query: "What is the immediate treatment for vomiting and diarrhea and how to prepare ORS?" },
      { label: "🫁 Cough & Phlegm", query: "What is the best medicine and home remedy for chest cough and phlegm?" },
    ],
    livestock: [
      { label: "🐄 Cow High Fever", query: "My cow has high fever and is not feeding. Please provide diagnosis and veterinary treatment." },
      { label: "🔴 Foot & Mouth (FMD)", query: "My cattle has mouth blisters and hoof sores. What is the treatment for FMD?" },
      { label: "🥛 Mastitis (Udder Swelling)", query: "Udder swelling and abnormal milk in cow. How to treat mastitis?" },
      { label: "💨 Bloat Emergency", query: "Goat's stomach is bloated. What is the immediate first aid treatment?" },
    ],
    pet: [
      { label: "🐕 Dog Mange & Itching", query: "My dog is scratching continuously and losing hair. What medicine should I use?" },
      { label: "🕷️ Ticks & Fleas", query: "How to safely remove ticks and fleas from my pet dog and cat?" },
      { label: "💉 Rabies Vaccine", query: "When and where should I get my pet vaccinated against rabies?" },
    ],
    plant: [
      { label: "🍂 Yellow Leaves", query: "My houseplant leaves are turning yellow and falling off. What is the cause and cure?" },
      { label: "🐛 Whiteflies & Pests", query: "How to eliminate whiteflies and mealybugs from indoor plants organically?" },
    ],
    crop: [
      { label: "🌾 Wheat Yellow Rust", query: "What is the recommended fungicide spray and dosage for wheat yellow rust?" },
      { label: "🌱 Fertilizer Per Acre", query: "What is the recommended Urea and DAP fertilizer per acre for wheat crop?" },
    ],
  },
  ur: {
    human: [
      { label: "🤒 بخار و جسم درد", query: "مجھے کل سے بخار ہے اور پورے جسم میں درد ہے، علامات اور علاج بتائیں" },
      { label: "🧴 جلد پر خارش", query: "جلد پر لال دھبے اور شدید خارش ہے، اسباب اور دوائی بتائیں" },
      { label: "💊 پیراسیٹامول خوراک", query: "بڑوں اور بچوں کے لیے پیراسیٹامول کی محفوظ خوراک کیا ہے؟" },
      { label: "🩸 بلڈ پریشر", query: "ہائی بلڈ پریشر کی دوائیں اور گھریلو علاج بتائیں" },
      { label: "🤢 الٹی و دست", query: "الٹی اور دست کے لیے فوری علاج اور ORS بنانے کا طریقہ" },
      { label: "🫁 کھانسی و بلغم", query: "کھانسی اور بلغم کے لیے بہترین دوائی اور گھریلو علاج" },
    ],
    livestock: [
      { label: "🐄 گائے کا بخار", query: "میری گائے کو تیز بخار ہے، چارہ نہیں کھا رہی، علاج بتائیں" },
      { label: "🔴 منہ کھر", query: "بھینس میں منہ کھر کے چھالے ہیں، دوا اور خوراک بتائیں" },
      { label: "🥛 سڑو (ماسٹائٹس)", query: "گائے کے تھن میں سوجن اور دودھ میں تبدیلی — سڑو کا علاج" },
      { label: "💨 افارہ", query: "بکری کا پیٹ پھول گیا ہے، فوری گھریلو علاج کیا ہے؟" },
    ],
    pet: [
      { label: "🐕 کتے کی خارش", query: "کتا بہت خارش کر رہا ہے اور بال جھڑ رہے ہیں، کیا کروں؟" },
      { label: "🕷️ چیچر پسو", query: "بلی اور کتے کے چیچر اور پسو ختم کرنے کا طریقہ" },
      { label: "💉 ریبز ویکسین", query: "کتے کو ریبز کا ٹیکہ کب اور کہاں لگوانا چاہیے؟" },
    ],
    plant: [
      { label: "🍂 پیلے پتے", query: "میرے پودے کے پتے پیلے ہو کر گر رہے ہیں، کیا مسئلہ ہے؟" },
      { label: "🐛 سفید کیڑے", query: "پودوں سے سفید کیڑے اور ملی بگ ختم کرنے کا دیسی طریقہ" },
    ],
    crop: [
      { label: "🌾 گندم کنگی", query: "گندم کی پیلی کنگی کا بہترین اسپرے اور خوراک بتائیں" },
      { label: "🌱 فی ایکڑ کھاد", query: "گندم کے لیے یوریا اور ڈی اے پی کی فی ایکڑ مقدار" },
    ],
  },
};

function getLanguageChips(domainId: string, lang: string) {
  const langDict = CHIPS_BY_LANG[lang] || CHIPS_BY_LANG.en;
  return langDict[domainId] || CHIPS_BY_LANG.en[domainId] || CHIPS_BY_LANG.ur.human;
}

const ASSISTANT_CONTENT: Record<string, {
  greetingEn: string; greetingUr: string;
  placeholderEn: string; placeholderUr: string;
}> = {
  human: {
    greetingEn: "🩺 **Assalam-o-Alaikum! I am the AZdoc AI Health Doctor.**\n\nYou can speak or type in **Urdu, English, Punjabi, Sindhi, Pashto, Balochi or Spanish**. You can also 📷 **send a photo** of any skin condition, rash, wound, or prescription — I will analyze it.\n\nAsk me about fever, infections, chronic diseases, medications, child care, or any medical concern. I give **detailed, accurate clinical answers** with medicine names and dosages.",
    greetingUr: "🩺 **السلام علیکم! میں اے زیڈ ڈاک AI ہیلتھ ڈاکٹر ہوں۔**\n\nآپ **اردو، پنجابی، سندھی، پشتو، بلوچی، انگریزی یا ہسپانوی** میں بول یا لکھ سکتے ہیں۔ آپ 📷 **تصویر بھی بھیج سکتے ہیں** — جلد کی بیماری، زخم یا نسخے کی۔\n\nبخار، انفیکشن، دوائیں، بچوں کی صحت یا کوئی بھی طبی سوال پوچھیں — میں تفصیلی جواب دیتا ہوں۔",
    placeholderEn: "Describe symptoms, ask any medical question, or send a photo…",
    placeholderUr: "علامات بیان کریں، کوئی بھی طبی سوال پوچھیں یا تصویر بھیجیں…",
  },
  livestock: {
    greetingEn: "🐄 **Assalam-o-Alaikum! I'm the AZdoc Livestock Vet.**\n\nAsk me about cattle, buffalo, goat, sheep, camel diseases — FMD, mastitis, bloat, LSD, vaccination, feed, milk drop — in any language. I give **detailed veterinary treatment with medicine doses per kg**.",
    greetingUr: "🐄 **السلام علیکم! میں اے زیڈ ڈاک لائیوسٹاک ویٹ ہوں۔**\n\nگائے، بھینس، بکری کی بیماریوں کے بارے میں پوچھیں — منہ کھر، سڑو، افارہ، لمپی، ویکسین، خوراک — کسی بھی زبان میں۔",
    placeholderEn: "Ask livestock health questions in your language…",
    placeholderUr: "مویشیوں کی بیماری کا سوال پوچھیں…",
  },
  pet: {
    greetingEn: "🐾 **Assalam-o-Alaikum! I'm the AZdoc Pet Vet.**\n\nAsk about dogs, cats, birds — mange, ticks, nutrition, parvo, vaccination. Send a 📷 **photo** for visual diagnosis.",
    greetingUr: "🐾 **السلام علیکم! میں اے زیڈ ڈاک پیٹ ویٹ ہوں۔**\n\nبلی، کتے اور پرندوں کی خارش، چیچر، ویکسین کے بارے میں پوچھیں۔ تصویر بھیج کر بھی تشخیص کروائیں۔",
    placeholderEn: "Ask pet health question in any language…",
    placeholderUr: "پالتو جانور کا سوال پوچھیں…",
  },
  plant: {
    greetingEn: "🪴 **Assalam-o-Alaikum! I'm the AZdoc Plant Doctor.**\n\nAsk about garden & indoor plants — yellow leaves, pests, fungus, watering. Send a 📷 **photo** of your plant for instant diagnosis.",
    greetingUr: "🪴 **السلام علیکم! میں اے زیڈ ڈاک پلانٹ ڈاکٹر ہوں۔**\n\nپودوں کے مسائل پوچھیں یا تصویر بھیجیں — پیلے پتے، کیڑے، پانی کی کمی — فوری تشخیص کروائیں۔",
    placeholderEn: "Ask about your plants or send a photo…",
    placeholderUr: "پودوں کا سوال پوچھیں یا تصویر بھیجیں…",
  },
  crop: {
    greetingEn: "🌾 **Assalam-o-Alaikum! I'm the AZdoc Crop Doctor.**\n\nAsk about wheat, rice, cotton, sugarcane — diseases, spray dosages per acre, fertilizer schedules.",
    greetingUr: "🌾 **السلام علیکم! میں اے زیڈ ڈاک کراپ ڈاکٹر ہوں۔**\n\nگندم کی کنگی، دھان کا جھلساؤ، کپاس کے کیڑے، کھادوں کی مقدار — ہر فصل کا علاج بتاتا ہوں۔",
    placeholderEn: "Ask crop doctor in your language…",
    placeholderUr: "فصلوں کی بیماری کا سوال پوچھیں…",
  },
};

// Extract structured prescription from AI response
function extractPrescription(aiReply: string, domainId: string, domainName: string) {
  const lower = aiReply.toLowerCase();
  const hasMedicine = lower.includes("tab.") || lower.includes("mg") || lower.includes("ml") ||
    lower.includes("paracetamol") || lower.includes("پیراسیٹامول") || lower.includes("علاج") ||
    lower.includes("treatment") || lower.includes("syrup") || lower.includes("cream") ||
    lower.includes("injection") || lower.includes("ٹیکہ");

  if (!hasMedicine) return undefined;

  // Extract medicine lines
  const lines = aiReply.split("\n");
  const medicines: string[] = [];
  const precautions: string[] = [];

  for (const line of lines) {
    const stripped = line.replace(/^[•\-*\d.]\s*/, "").trim();
    if (!stripped || stripped.length < 5) continue;
    if (
      stripped.toLowerCase().includes("tab.") || stripped.toLowerCase().includes("mg") ||
      stripped.toLowerCase().includes("syrup") || stripped.toLowerCase().includes("cream") ||
      stripped.toLowerCase().includes("ml/") || stripped.includes("پیراسیٹامول") ||
      stripped.includes("دوا")
    ) {
      if (medicines.length < 5) medicines.push(stripped.slice(0, 80));
    } else if (
      stripped.toLowerCase().includes("avoid") || stripped.toLowerCase().includes("rest") ||
      stripped.toLowerCase().includes("drink") || stripped.includes("پرہیز") ||
      stripped.includes("آرام") || stripped.toLowerCase().includes("doctor") ||
      stripped.includes("ڈاکٹر")
    ) {
      if (precautions.length < 4) precautions.push(stripped.slice(0, 80));
    }
  }

  if (medicines.length === 0) medicines.push(domainId === "human" ? "Tab. Paracetamol 500mg — 1 TDS after meals" : "Consult local veterinary store for appropriate medication");
  if (precautions.length === 0) precautions.push("Consult a licensed doctor/vet if condition worsens", "Maintain hydration and adequate rest");

  return {
    diagnosis: domainId === "human" ? "Clinical Assessment — AZdoc AI" : `${domainName} Health Evaluation`,
    medicines,
    precautions,
    doctorName: "Dr. AZdoc AI Medical Board",
  };
}

export default function AssistantScreen() {
  const { lang: appLang } = useLanguage();
  const { user } = useAuth();
  const { domainId, domain } = useDomain();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(appLang === "ur" ? "ur" : "en");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const personality = ASSISTANT_CONTENT[domainId] ?? ASSISTANT_CONTENT.human;

  const getGreeting = (lang: SupportedLanguage) => {
    const greetings: Partial<Record<SupportedLanguage, string>> = {
      ur: personality.greetingUr,
      pa: `🩺 **ست سری اکال! میں اے زیڈ ڈاک AI ڈاکٹر واں۔**\n\nتصویر یا آواز نال سوال پوچھو — بخار، دواواں، چمڑی یا کوئی وی مسئلہ۔`,
      sd: `🩺 **اسلام عليڪم! مان اوھان جو AI ڊاڪٽر آھيان۔**\n\nتصوير موڪليو يا صوتي سوال ڪريو — تپ، دوائون، چمڙي — ڪھڙي به مدد گھربل آھي؟`,
      ps: `🩺 **سلامونه! زه ستاسو AZdoc AI ډاکټر یم۔**\n\nانځور واستوئ یا غږ ورکړئ — تبه، درمل، هر ډول روغتیايي پوښتنه.`,
      bal: `🩺 **سلام! من شمئے AI ڈاکٹر آں۔**\n\nعکس بیارت کن یا گوش کن — تاب، دارو، ہر چیزاں مدد کنت.`,
      es: `🩺 **¡Hola! Soy tu médico de IA de AZdoc.**\n\nPuedes enviar una foto o hablar en tu idioma — fiebre, medicamentos, enfermedades de la piel, cualquier pregunta médica.`,
    };
    return greetings[lang] || personality.greetingEn;
  };

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: getGreeting(selectedLang),
    lang: selectedLang,
  }]);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [activePrescription, setActivePrescription] = useState<any | null>(null);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { stopTextToSpeech(); stopCamera(); }, []);

  // When language changes, update greeting
  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setShowLangMenu(false);
    setMessages([{ role: "assistant", content: getGreeting(lang), lang }]);
  };

  // ─── CAMERA ────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setCameraError("Camera access denied. Please allow camera in browser settings.");
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const flipCamera = async () => {
    stopCamera();
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    setTimeout(startCamera, 300);
  };

  const sendImageMessage = async () => {
    if (!capturedImage) return;
    const base64 = capturedImage.split(",")[1];
    const userMsg: Message = {
      role: "user",
      content: input.trim() || (selectedLang === "ur" ? "اس تصویر کی طبی تشخیص کریں" : "Please analyze this image and provide a medical diagnosis."),
      imageUrl: capturedImage,
      lang: selectedLang,
    };
    setMessages(prev => [...prev, userMsg]);
    setCapturedImage(null);
    setInput("");
    setIsTyping(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const aiReply = await askDeepSeekDoctor({
        userMessage: userMsg.content,
        history,
        lang: selectedLang as any,
        domain: domainId,
        imageBase64: base64,
      });
      const prescription = extractPrescription(aiReply, domainId, domain.name);
      setMessages(prev => [...prev, { role: "assistant", content: aiReply, lang: selectedLang, prescription }]);
      playTextToSpeech(aiReply, selectedLang, () => setSpeakingMsgId(messages.length + 2), () => setSpeakingMsgId(null), () => setSpeakingMsgId(null));
    } catch (err) {
      console.error("[sendImage]", err);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── VOICE ─────────────────────────────────────────────────
  const startRecording = async () => {
    const SpeechRecognition = typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = langObj?.locale || "ur-PK";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e: any) => {
          const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
          if (transcript) setInput(transcript);
        };
        recognition.onerror = () => { setIsListening(false); };
        recognition.onend = () => setIsListening(false);
        recognition.start();
        recognitionRef.current = recognition;
        return;
      } catch { /* fall through */ }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        const transcribed = await transcribeAudioBlob(audioBlob, selectedLang);
        if (transcribed) setInput(transcribed);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch { /* ok */ }
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  };

  const handlePlayVoice = (text: string, index: number) => {
    if (speakingMsgId === index) { stopTextToSpeech(); setSpeakingMsgId(null); return; }
    setSpeakingMsgId(index);
    playTextToSpeech(text, selectedLang, () => setSpeakingMsgId(index), () => setSpeakingMsgId(null), () => setSpeakingMsgId(null));
  };

  // ─── SEND MESSAGE ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !capturedImage) return;
    if (capturedImage) { sendImageMessage(); return; }

    const userMsg: Message = { role: "user", content: text, lang: selectedLang };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (!activeSession) setActiveSession(generateLocalId());

    try {
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const aiReply = await askDeepSeekDoctor({
        userMessage: text,
        history,
        lang: selectedLang as any,
        domain: domainId,
      });

      const prescription = extractPrescription(aiReply, domainId, domain.name);
      const aiMsg: Message = { role: "assistant", content: aiReply, lang: selectedLang, prescription };
      setMessages(prev => [...prev, aiMsg]);

      playTextToSpeech(aiReply, selectedLang,
        () => setSpeakingMsgId(messages.length + 1),
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    } catch (err) {
      console.error("[sendMessage]", err);
    } finally {
      setIsTyping(false);
    }
  }, [input, capturedImage, activeSession, messages, selectedLang, domainId, domain.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border bg-bg-elevated/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-heading font-bold text-text-primary leading-tight">AZdoc AI Doctor</h1>
            <p className="text-[10px] text-text-muted">DeepSeek · ElevenLabs · 7 Languages · Camera</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button onClick={() => setShowLangMenu(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all">
            <span>{activeLangObj.flag}</span>
            <span>{activeLangObj.nativeName}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-border rounded-2xl shadow-2xl z-50 p-1.5 animate-scaleIn">
              <p className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase">Select Language:</p>
              {SUPPORTED_LANGUAGES.map(l => (
                <button key={l.code} onClick={() => handleLangChange(l.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${selectedLang === l.code ? "bg-primary text-white font-bold" : "text-text-primary hover:bg-bg-secondary"}`}>
                  <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                  <span className="text-[11px] opacity-80">{l.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Language pills ── */}
      <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-bg-secondary/40 border-b border-border/40">
        <Languages className="w-3.5 h-3.5 text-text-muted shrink-0" />
        {SUPPORTED_LANGUAGES.map(l => (
          <button key={l.code} onClick={() => handleLangChange(l.code)}
            className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${selectedLang === l.code ? "bg-primary text-white shadow-xs" : "bg-bg-elevated text-text-muted border border-border hover:text-text-primary"}`}>
            {l.flag} {l.nativeName}
          </button>
        ))}
      </div>

      {/* ── Camera View ── */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col justify-between overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-10">
            <button
              onClick={stopCamera}
              className="text-white p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md active:scale-95 transition-all min-touch"
              title="Close Camera"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
              <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                {selectedLang === "ur" ? "اے زیڈ ڈاک کیمرہ" : "AZdoc Camera"}
              </span>
            </div>
            <button
              onClick={flipCamera}
              className="text-white p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md active:scale-95 transition-all min-touch"
              title="Flip Camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Video Viewport & Focus Guidelines */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder crosshairs / focus frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-64 h-64 border-2 border-dashed border-white/40 rounded-3xl relative flex items-center justify-center">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                <span className="text-white/80 text-[11px] font-semibold bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10 shadow-md">
                  {selectedLang === "ur" ? "تشخیص کے لیے یہاں لائیں" : "Center subject in box"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Shutter Capture Bar */}
          <div className="relative z-10 flex flex-col items-center gap-3 p-6 pb-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
            {/* Outer Ring Shutter Button */}
            <button
              onClick={capturePhoto}
              aria-label="Capture Photo"
              className="group relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 bg-black/40 hover:bg-black/60 active:scale-90 transition-all duration-200 shadow-2xl cursor-pointer min-touch"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-inner group-hover:brightness-110 transition-all">
                <Camera className="w-8 h-8 text-white drop-shadow-md group-hover:scale-110 transition-transform" />
              </div>
            </button>

            {/* Clear Text Action Button */}
            <button
              onClick={capturePhoto}
              className="text-white text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-full border border-white/30 shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {selectedLang === "ur" ? "تصویر کھینچیں (کلک کریں)" : "TAP TO CAPTURE PHOTO"}
            </button>
          </div>
        </div>
      )}

      {/* ── Captured image preview ── */}
      {capturedImage && !showCamera && (
        <div className="mx-4 mt-2 bg-bg-elevated border border-primary/30 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
          <img src={capturedImage} className="w-16 h-16 rounded-xl object-cover border border-border" alt="captured" />
          <div className="flex-1">
            <p className="text-xs font-bold text-text-primary">📷 Photo ready to send</p>
            <p className="text-[10px] text-text-muted">Add a message or tap send to analyze</p>
          </div>
          <button onClick={() => setCapturedImage(null)} className="text-text-muted hover:text-danger transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {cameraError && (
        <div className="mx-4 mt-2 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-2 text-danger text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {msg.imageUrl && (
              <img src={msg.imageUrl} className="max-w-[70%] rounded-2xl mb-1 border border-border shadow-sm" alt="user photo" />
            )}
            <div className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
              msg.role === "user"
                ? "bg-gradient-to-br from-primary to-blue-500 text-white rounded-br-md"
                : "bg-bg-elevated border border-border text-text-primary rounded-bl-md"
            }`}>
              {msg.content}

              {msg.prescription && (
                <div className="mt-3 pt-2.5 border-t border-border/60">
                  <button onClick={() => setActivePrescription(msg.prescription)}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center justify-between hover:bg-emerald-500/25 transition-all">
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />View Prescription Slip (Rx)</span>
                    <span className="text-[10px] uppercase underline">Open →</span>
                  </button>
                </div>
              )}
            </div>

            {msg.role === "assistant" && (
              <div className="flex items-center gap-2 mt-1 ml-2">
                <button onClick={() => handlePlayVoice(msg.content, i)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    speakingMsgId === i
                      ? "bg-danger text-white border-danger animate-pulse"
                      : "bg-bg-elevated text-primary border-primary/20 hover:bg-primary/10"
                  }`}>
                  {speakingMsgId === i ? (
                    <><VolumeX className="w-3 h-3" /><span>Stop</span></>
                  ) : (
                    <><Volume2 className="w-3 h-3" /><span>Listen in {activeLangObj.nativeName}</span></>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated border border-border rounded-3xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">AZdoc Doctor analysing</span>
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

      {/* ── Quick Chips ── */}
      <div className="mx-4 mb-2 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {getLanguageChips(domainId, selectedLang).map((chip, idx) => (
          <button key={idx} onClick={() => setInput(chip.query)}
            className="shrink-0 bg-bg-elevated border border-primary/20 text-text-primary hover:border-primary px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shadow-xs">
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Recording banner ── */}
      {isListening && (
        <div className="mx-4 mb-2 p-3 bg-danger/10 border border-danger/30 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-danger font-bold text-xs">
            <Mic className="w-4 h-4 animate-bounce" />
            <span>Listening in {activeLangObj.name} ({activeLangObj.nativeName})… Speak now</span>
          </div>
          <button onClick={stopRecording} className="px-2.5 py-1 rounded-xl bg-danger text-white text-[10px] font-bold">Done</button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="mx-4">
        {/* Hidden File Input for Uploading Photo from Device Gallery */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryUpload}
        />

        <div className="flex items-center gap-1.5 bg-bg-elevated border-2 border-border focus-within:border-primary/50 rounded-3xl px-3 py-1.5 shadow-sm transition-all">
          {/* Mic button */}
          <button onClick={() => { if (isListening) stopRecording(); else startRecording(); }}
            title="Voice Input"
            className={`flex items-center justify-center rounded-2xl p-2 transition-all ${isListening ? "bg-danger text-white shadow-lg animate-pulse scale-105" : "text-text-muted hover:text-primary hover:bg-primary/10"}`}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Live Camera button */}
          <button onClick={() => { if (showCamera) stopCamera(); else startCamera(); }}
            title="Live Camera Photo"
            className={`flex items-center justify-center rounded-2xl p-2 transition-all ${showCamera ? "bg-primary text-white" : capturedImage ? "text-primary bg-primary/10" : "text-text-muted hover:text-primary hover:bg-primary/10"}`}>
            <Camera className="w-5 h-5" />
          </button>

          {/* Upload Photo from Gallery button */}
          <button onClick={() => galleryInputRef.current?.click()}
            title="Upload Photo from Gallery"
            className="flex items-center justify-center rounded-2xl p-2 text-text-muted hover:text-primary hover:bg-primary/10 transition-all">
            <Upload className="w-5 h-5" />
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedLang === "ur" ? personality.placeholderUr : `Type, speak or upload photo…`}
            className="flex-1 py-2 text-xs sm:text-sm bg-transparent outline-none text-text-primary placeholder:text-text-muted/60 min-w-0"
          />

          <button onClick={sendMessage}
            disabled={!input.trim() && !capturedImage}
            className="flex items-center justify-center rounded-2xl p-2.5 text-white bg-primary hover:bg-primary-light transition-all disabled:opacity-40 shadow-md active:scale-95 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Input hint */}
        {!capturedImage && !showCamera && (
          <p className="text-center text-[10px] text-text-muted mt-1.5 flex items-center justify-center gap-2">
            <span>📷 Live Camera</span>
            <span>·</span>
            <span>🖼️ Upload Photo</span>
            <span>·</span>
            <span>🎙️ 7-Lang Voice AI</span>
          </p>
        )}
      </div>

      {/* ── Prescription Slip Modal ── */}
      {activePrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-bg-elevated border border-border rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-scaleIn max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">Rx</div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-text-primary">Medical Prescription Slip</h3>
                  <p className="text-[10px] text-text-muted">{activePrescription.doctorName}</p>
                </div>
              </div>
              <button onClick={() => setActivePrescription(null)} className="w-7 h-7 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-bg-secondary rounded-2xl">
                <p className="text-[10px] font-bold text-text-muted uppercase">Diagnosis / Assessment:</p>
                <p className="font-bold text-text-primary mt-0.5">{activePrescription.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1.5">Prescribed Medicines & Dosage:</p>
                <div className="space-y-1.5">
                  {activePrescription.medicines.map((m: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-text-primary font-medium flex items-center justify-between">
                      <span>💊 {m}</span>
                      <button onClick={() => { setActivePrescription(null); navigate("/pharmacy"); }}
                        className="text-[10px] font-bold text-primary hover:underline shrink-0">Order →</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Precautions & Advice:</p>
                <ul className="list-disc list-inside text-text-muted space-y-1">
                  {activePrescription.precautions.map((p: string, idx: number) => (<li key={idx}>{p}</li>))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button onClick={() => { setActivePrescription(null); navigate("/pharmacy"); }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors">
                Order Medicines Now
              </button>
              <button onClick={() => setActivePrescription(null)}
                className="px-4 py-2.5 rounded-xl bg-bg-secondary text-text-primary text-xs font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}