import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import JSZip from 'jszip';
import { ANDROID_FILES } from './src/androidProjectSource.ts';

import fs from 'fs';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process-level unhandled error guards to prevent unexpected server termination
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EADDRINUSE' || err?.message?.includes('24678') || err?.message?.includes('EADDRINUSE')) {
    console.warn('[Shadow AI Server] Suppressed network address conflict:', err.message);
    return;
  }
  console.warn('[Shadow AI Server] Uncaught exception:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[Shadow AI Server] Unhandled rejection:', reason?.message || reason);
});

const app = express();

// Parse CLI arguments (--port 3000) or fallback to process.env.PORT or 3000
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : NaN;
const PORT = !isNaN(cliPort) && cliPort > 0 ? cliPort : (parseInt(process.env.PORT || '3000', 10) || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// List of strictly restricted financial, UPI, and banking app package identifiers
export const RESTRICTED_FINANCIAL_PACKAGES = [
  'net.one97.paytm', // Paytm
  'com.phonepe.app', // PhonePe
  'com.google.android.apps.nbu.paisa.user', // Google Pay (Tez)
  'in.org.npci.upiapp', // BHIM UPI
  'com.dreamplug.androidapp', // CRED
  'com.sbi.lotuszaap', // YONO SBI
  'com.csam.icici.bank.imobile', // ICICI iMobile
  'com.snapwork.hdfc', // HDFC MobileBanking
  'com.axis.mobile', // Axis Mobile
  'com.msf.kopl', // Kotak 811
  'com.bankofbaroda.mconnect', // BOB World
  'com.pnb.pnbone', // PNB ONE
];

/**
 * Helper to determine if an error is a transient 503 (High demand) or 429 (Rate limit)
 */
function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);
  return (
    status === 503 ||
    status === 429 ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

/**
 * Exponential backoff wrapper with jitter for Gemini API calls
 */
async function callWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1200
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries || !isTransientError(err)) {
        throw err;
      }
      const backoffDelay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`[Shadow AI API] Transient error (Attempt ${attempt}/${maxRetries}): ${err?.message}. Retrying in ${Math.round(backoffDelay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Local intent parser reserved EXCLUSIVELY for:
 * 1. Strict financial & banking app security protection (blocking automated money transfers/UPI)
 * 2. Instant voice halt controls ("ruk jao", "stop", "chup ho jao")
 * 3. App sleep / exit commands
 *
 * All general questions, weather queries, general knowledge, science, technology,
 * stories, conversations, and app launch requests are sent directly to the Gemini AI model.
 */
function parseLocalIntent(rawText: string) {
  const lower = rawText.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Payment & Banking App Blocklist Protection (STRICT FINANCIAL SAFEGUARD)
  const financialKeywords = [
    'paytm',
    'phonepe',
    'phone pe',
    'gpay',
    'google pay',
    'googlepay',
    'bhim',
    'bhim upi',
    'upi app',
    'cred',
    'yono',
    'sbi app',
    'sbi bank',
    'hdfc bank',
    'hdfc app',
    'icici bank',
    'icici app',
    'axis bank',
    'kotak bank',
    'bank app',
    'net banking',
    'transfer money',
    'paise bhejo',
    'paise transfer',
    'atm pin',
  ];

  for (const keyword of financialKeywords) {
    if (lower.includes(keyword)) {
      return {
        intentAction: 'BLOCKED_PAYMENT_APP',
        intentParam: keyword,
        reply: 'सुरक्षा नीति (Security Policy): Shadow AI को वित्तीय, UPI या बैंकिंग ऐप्स (Paytm, PhonePe, Google Pay, BHIM, आदि) खोलने या ऑटोमेट करने की सख्त मनाही है। आपके पिन, पासवर्ड और बैंक खाते की सुरक्षा के लिए यह प्रतिबंध अनिवार्य है।',
        requiresConfirmation: false,
        isBlocked: true,
      };
    }
  }

  // 2. Immediate Voice Listening Stop: "Ruk jao" / "Stop" / "Chup ho jao"
  if (
    lower === 'ruk jao' ||
    lower === 'stop' ||
    lower === 'chup ho jao' ||
    lower === 'shant ho jao' ||
    lower === 'stop listening'
  ) {
    return {
      intentAction: 'STOP_LISTENING',
      intentParam: null,
      reply: 'Ji, main ruk gaya hoon.',
      requiresConfirmation: false,
    };
  }

  // 3. "Band ho jao" / App close & sleep
  if (
    lower === 'band ho jao' ||
    lower === 'app band karo' ||
    lower === 'close app' ||
    lower === 'so jao' ||
    lower === 'exit'
  ) {
    return {
      intentAction: 'APP_CLOSE',
      intentParam: null,
      reply: 'Shadow AI sleep mode me ja raha hai. Aap jab chahein mic button tap karke mujhe bula sakte hain. Alvida!',
      requiresConfirmation: false,
    };
  }

  // 4. Voice control: "Answer my question aloud" / "Aawaz me bolo"
  if (
    lower === 'answer my question aloud' ||
    lower === 'aawaz me bolo' ||
    lower === 'speak aloud' ||
    lower === 'bol kar batao'
  ) {
    return {
      intentAction: 'VOICE_ON',
      intentParam: null,
      reply: 'Ji, main ab aapke sabhi sawalon ke jawab aawaz me bol kar doonga. Voice output is active.',
      requiresConfirmation: false,
    };
  }

  // 5. Direct Website Opening Voice Commands: "Shadow, open Google", "Open YouTube", "Open a website"
  if (
    lower === 'shadow open google' ||
    lower === 'open google' ||
    lower === 'google kholo' ||
    lower === 'open google website'
  ) {
    return {
      intentAction: 'OPEN_WEBSITE',
      intentParam: 'https://www.google.com',
      reply: 'Google website open kar raha hoon. Niche diye link par tap karke aap website dekh sakte hain.',
      requiresConfirmation: false,
    };
  }

  if (
    lower === 'open youtube' ||
    lower === 'youtube kholo' ||
    lower === 'shadow open youtube'
  ) {
    return {
      intentAction: 'YOUTUBE',
      intentParam: 'https://www.youtube.com',
      reply: 'YouTube open kar raha hoon.',
      requiresConfirmation: false,
    };
  }

  if (
    lower === 'open a website' ||
    lower === 'open website' ||
    lower === 'website kholo' ||
    lower === 'koi website kholo'
  ) {
    return {
      intentAction: 'OPEN_WEBSITE',
      intentParam: 'https://www.google.com',
      reply: 'Aap kaun si website kholna chahte hain? Aap direct URL bol sakte hain jaise "Open Wikipedia" ya Google search kar sakte hain.',
      requiresConfirmation: false,
    };
  }

  // 6. Creator Identity Prompt & Rule: "Tumko kisne banaya hai?", "Who created you?", "Who made you?"
  const creatorQueries = [
    'tumko kisne banaya',
    'tumko kisne banaya hai',
    'tumhe kisne banaya',
    'tumhe kisne banaya hai',
    'aapko kisne banaya',
    'aapko kisne banaya hai',
    'who created you',
    'who made you',
    'who built you',
    'who developed you',
    'who is your creator',
    'who is your developer',
    'who is your maker',
    'tumhara creator kaun hai',
    'tumhe kisne create kiya',
    'tumko kisne create kiya',
    'apko kisne banaya',
    'kisne banaya hai tumko',
    'kisne banaya tumhe',
    'tell me who created you',
    'who is golu ji',
    'golu ji kaun hai',
    'golu ji kaun hain',
  ];

  for (const q of creatorQueries) {
    if (lower === q || lower === `shadow ${q}` || lower.startsWith(q) || lower.endsWith(q)) {
      return {
        intentAction: null,
        intentParam: null,
        reply: 'Mujhe Golu ji ne banaya hai. Main Shadow AI hoon, Golu ji ka personal AI assistant.',
        requiresConfirmation: false,
      };
    }
  }

  // All other questions, commands, weather queries, stories, GK, science, tech, and app requests
  // MUST go directly to Gemini AI model for dynamic, intelligent comprehension!
  return null;
}

// -----------------------------------------------------------------------------
// POST /api/gemini/chat
// Robust Gemini Multimodal & System Intent endpoint with Exponential Backoff
// -----------------------------------------------------------------------------
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message = '', media, language = 'hi-IN', history = [] } = req.body;
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedMessage && !media) {
      return res.status(400).json({ error: 'Message or media upload is required.' });
    }

    // Fast local intent check first for instant, reliable execution
    if (!media && trimmedMessage) {
      const immediateCommand = parseLocalIntent(trimmedMessage);
      if (immediateCommand) {
        return res.json(immediateCommand);
      }
    }

    // Supported MIME types for multimodal vision & video & documents
    const SUPPORTED_MIME_TYPES = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/3gpp',
      'video/x-matroska',
      'text/plain',
      'text/csv',
      'application/json',
      'text/markdown',
    ]);

    let mediaPart: any = null;
    let documentTextContext = '';

    if (media) {
      if (!media.mimeType || (!media.data && !media.textContent)) {
        return res.status(400).json({ error: 'Invalid media attachment. MIME type and content required.' });
      }

      if (!SUPPORTED_MIME_TYPES.has(media.mimeType) && !media.mimeType.startsWith('text/')) {
        return res.status(400).json({
          error: `Unsupported format (${media.mimeType}). Supported formats: JPEG, PNG, WEBP, GIF, MP4, WebM, MOV, TXT, CSV, JSON.`,
        });
      }

      // Handle text/document attachment
      if (media.type === 'file' || media.mimeType.startsWith('text/') || media.mimeType === 'application/json') {
        documentTextContext = media.textContent || Buffer.from(media.data || '', 'base64').toString('utf-8');
      } else {
        // Strip data URI prefix if present
        const cleanData = media.data.replace(/^data:[^;]+;base64,/, '');
        mediaPart = {
          inlineData: {
            mimeType: media.mimeType,
            data: cleanData,
          },
        };
      }
    }

    const systemInstruction = `
SHADOW AI — CREATOR IDENTITY & CORE RULES:
You are SHADOW AI, a personal AI assistant created by Golu ji.

Follow these rules strictly:
1. Your name is always Shadow AI.
2. Your creator's name is always Golu ji.
3. Whenever anyone asks "Tumko kisne banaya hai?", "Who created you?", or "Who made you?" (or any variation in Hindi, English, Hinglish, or any language), you MUST reply:
   "Mujhe Golu ji ne banaya hai. Main Shadow AI hoon, Golu ji ka personal AI assistant."
4. Always say "Golu ji" with respect.
5. Never say that Google Assistant created you.
6. Never confuse your identity (Shadow AI) with your creator (Golu ji).
7. Speak naturally in Hindi or the user's preferred language (${language}).
8. Apply these instructions in both text and voice conversations.
9. Do not claim that Golu ji created Google's underlying AI technology. Golu ji is the creator of this Shadow AI application and assistant.

Identity Summary:
AI Name: Shadow AI
Creator: Golu ji
Role: Personal AI Assistant created by Golu ji

CORE ASSISTANT PRINCIPLES:
1. Direct and Genuine Responses (सीधा और सही जवाब):
   - Answer the user's specific question directly, accurately, and thoroughly.
   - If asked about your creation, creator, origin, or developer, adhere strictly to the Creator Identity rules above.
   - NEVER use canned, repetitive, or hardcoded demo answers. Synthesize an authentic, dynamic answer for every single query.
   - For novel, unknown, or unconventional questions, think carefully and provide the best logical, helpful answer.

2. Comprehensive Domain Expertise:
   - Weather (मौसम): Explain weather conditions, climate, seasonal patterns, or temperatures. If the user doesn't mention a city (e.g. "Aaj ka mausam batao"), provide general seasonal weather context and ask which city or location they want the specific forecast for.
   - General Knowledge (सामान्य ज्ञान): History, geography, science, civics, culture, Indian and world trivia.
   - Science & Technology (विज्ञान और तकनीक): Physics, biology, chemistry, computers, software, artificial intelligence, space, gadgets, smartphone features.
   - Everyday Life & Advice (रोज़मर्रा के सवाल): Practical tips, health, lifestyle, recipes, math, study guidance.
   - Creative Storytelling & Entertainment: If asked to tell a story ("Mujhe ek kahani sunao"), poem, or joke, craft a fresh, captivating, and original story every time.

3. Spoken Voice Optimization (आवाज़ में स्वाभाविक उत्तर):
   - The user will HEAR your response aloud via Text-to-Speech (TTS).
   - Write in a natural, smooth spoken conversational style.
   - AVOID markdown markup such as asterisks (**bold**), hashtags (#), or long bullet walls that sound robotic or awkward when read aloud. Keep sentences fluid, rhythmic, and natural.

4. Natural Multilingual Fluency (हिंदी, अंग्रेज़ी, हिंग्लिश):
   - Flawlessly understand and speak Hindi (हिंदी), English, and Hinglish.
   - Seamlessly match the language and tone the user speaks in (${language}).

5. Ambiguity & Asking for Clarification (अगर सवाल समझ न आए):
   - If the user's question is unclear, garbled, cut off, or lacks critical detail, politely ask them to clarify (e.g., "Kripya thoda vistaar se batayein, aap kiske baare me janna chahte hain?").

6. Multimodal Vision & Document Intelligence:
   - If a photo or video is attached, analyze it thoroughly (objects, people, text, scene, actions) and answer questions about it.
   - If a document or file is attached, answer questions based on the document's content.

7. Live Android Screen Vision (लाइव स्क्रीन विश्लेषण):
   - When the user shares their screen or asks questions about their visible screen content:
     * Identify the active Android app or interface (e.g. YouTube, WhatsApp, Settings, Chrome, Maps, games, camera, etc.).
     * Read and comprehend on-screen text, titles, chat messages, notifications, error dialogs, and numbers.
     * Identify UI elements: buttons, icons, navigation tabs, toggle switches, input boxes.
     * If the user asks "Screen par kya hai?", "Where should I tap next?", "Summarize what is open", or "Explain this screen", give clear, actionable, friendly voice guidance in Hindi or English.
     * Describe what is actually visible; do not invent unseen details.
   - If the user asks about their screen (e.g. "Look at my screen and explain what is happening", "Screen par kya hai?", "What is on my screen?") but NO screen frame or media is attached (screen sharing is inactive or revoked):
     * DO NOT pretend to see the screen! Honestly and politely respond: "Screen sharing active nahi hai. Kripya 'Live Screen' button par tap karke screen share karein, tab main aapki screen dekhkar madad kar sakunga."
     * Set intentAction: "OPEN_LIVE_SCREEN", intentParam: null.

8. Android App Launch, Website Commands & Action Intents:
   - When the user asks to open an app, website, or trigger a system action, give a friendly spoken confirmation AND output the matching intentAction:
     * "Shadow, open Google" / "Google kholo" -> intentAction: "OPEN_WEBSITE", intentParam: "https://www.google.com".
     * "Open YouTube" / "YouTube kholo" -> intentAction: "YOUTUBE", intentParam: "https://www.youtube.com".
     * "Open [website / URL]" (e.g. "Open Wikipedia", "Open Github") -> intentAction: "OPEN_WEBSITE", intentParam: target URL (e.g. "https://www.wikipedia.org", "https://github.com").
     * "Search [query]" / "Google par search karo" -> intentAction: "CHROME", intentParam: search query (if any).
     * "Answer my question aloud" / "Aawaz me bolo" -> intentAction: "VOICE_ON".
     * "Instagram kholo" -> intentAction: "INSTAGRAM".
     * "WhatsApp kholo" -> intentAction: "WHATSAPP".
     * "Gallery kholo" / "Photos kholo" -> intentAction: "GALLERY".
     * "Chrome kholo" / "Google par search karo" -> intentAction: "CHROME", intentParam: search query (if any).
     * "Maps kholo" / "Rasta dikhao" -> intentAction: "MAPS", intentParam: destination.
     * "Settings kholo" -> intentAction: "SETTINGS".
     * "Camera kholo" -> intentAction: "CAMERA".
     * "Call karo" / "Dialer kholo" -> intentAction: "DIALER", intentParam: number/contact, requiresConfirmation: true.
     * "Torch chalao" / "Flashlight on" -> intentAction: "TORCH_ON".
     * "Torch band karo" / "Flashlight off" -> intentAction: "TORCH_OFF".
     * "Photo clear kar do" / "enhance photo" -> intentAction: "ENHANCE_PHOTO".
     * "Photo banao" / "create image" -> intentAction: "CREATE_IMAGE", intentParam: prompt description.
   - STRICT SAFETY: NEVER open or automate banking, UPI, or payment apps (Paytm, PhonePe, Google Pay, BHIM, Bank apps). Set intentAction: "BLOCKED_PAYMENT_APP".
   - For all general queries, stories, weather, science, and everyday questions: set intentAction: null.
`;

    let defaultMediaQuestion = 'Kripya is photo/video ka vistaar se vishleshan karein aur batayein isme kya hai.';
    if (language.startsWith('en')) {
      defaultMediaQuestion = 'Please examine this uploaded media and explain what you see in detail.';
    }

    let userQuery = trimmedMessage || defaultMediaQuestion;
    if (documentTextContext) {
      userQuery = `${userQuery}\n\n[Attached File Content (${media?.name || 'document'})]:\n${documentTextContext.slice(0, 10000)}`;
    }

    let promptWithContext = userQuery;
    if (Array.isArray(history) && history.length > 0) {
      const historySummary = history
        .slice(-4)
        .map((h: any) => `${h.sender === 'user' ? 'User' : 'Shadow'}: ${h.text}`)
        .join('\n');
      promptWithContext = `Previous conversation:\n${historySummary}\n\nCurrent user request: ${userQuery}`;
    }

    const parts: any[] = [];
    if (mediaPart) {
      parts.push(mediaPart);
    }
    parts.push({ text: promptWithContext });

    // Multi-tier model execution with exponential backoff
    let responseText: string | undefined;
    let usedModel = 'gemini-3.1-flash-lite';
    let isOverloaded = false;

    // Model sequence: primary -> secondary -> tertiary
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    for (const modelName of modelsToTry) {
      try {
        const response = await callWithExponentialBackoff(
          () =>
            ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    reply: {
                      type: Type.STRING,
                      description: 'The verbal response from SHADOW AI in Hindi, English, or Hinglish.',
                    },
                    intentAction: {
                      type: Type.STRING,
                      description: 'Action to trigger on Android (YOUTUBE, INSTAGRAM, WHATSAPP, GALLERY, CHROME, MAPS, SETTINGS, CAMERA, DIALER, TORCH_ON, TORCH_OFF, ENHANCE_PHOTO, CREATE_IMAGE, BLOCKED_PAYMENT_APP, or null).',
                      nullable: true,
                    },
                    intentParam: {
                      type: Type.STRING,
                      description: 'Parameter for the intent.',
                      nullable: true,
                    },
                    requiresConfirmation: {
                      type: Type.BOOLEAN,
                      description: 'Whether user confirmation should be prompted before sensitive execution.',
                    },
                  },
                  required: ['reply'],
                },
              },
            }),
          1, // Fast failover
          400
        );
        responseText = response.text;
        usedModel = modelName;
        break; // Success!
      } catch (modelErr: any) {
        console.warn(`[Shadow AI] Model ${modelName} failed:`, modelErr?.message);
        if (isTransientError(modelErr)) {
          isOverloaded = true;
        }
      }
    }

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        return res.json({
          reply: parsed.reply || 'Shadow AI active.',
          intentAction: parsed.intentAction || null,
          intentParam: parsed.intentParam || null,
          requiresConfirmation: Boolean(parsed.requiresConfirmation),
          modelUsed: usedModel,
        });
      } catch {
        return res.json({
          reply: responseText,
          intentAction: null,
          intentParam: null,
          requiresConfirmation: false,
          modelUsed: usedModel,
        });
      }
    }

    // If all models hit 503 high demand or quota
    if (isOverloaded) {
      return res.json({
        reply: 'Shadow AI: AI सर्वर पर इस समय बहुत अधिक ट्रैफिक (High Demand) है। हमने स्वचालित रूप से पुनः प्रयास किया किंतु सर्वर व्यस्त है। कृपया कुछ पलों बाद पुनः प्रयास करें या नीचे "Retry" बटन पर टैप करें।',
        intentAction: null,
        intentParam: null,
        requiresConfirmation: false,
        errorType: '503_OVERLOAD',
        isOverloaded: true,
      });
    }

    // Media fallback if models temporarily failed
    if (mediaPart) {
      return res.status(200).json({
        reply: `Maine aapka media (${media.type === 'video' ? 'Video' : 'Photo'}) receive kar liya hai. Server par atyadhik traffic ke karan vistaar se vishleshan nahi ho saka. Kripya neeche "Retry" par tap karein.`,
        intentAction: null,
        intentParam: null,
        requiresConfirmation: false,
        errorType: '503_OVERLOAD',
      });
    }

    // Local intent final fallback
    const local = parseLocalIntent(trimmedMessage);
    if (local) {
      return res.json(local);
    }

    return res.json({
      reply: 'Shadow AI: AI सर्वर पर इस समय अत्यधिक लोड होने के कारण उत्तर प्राप्त नहीं हो सका। कृपया पुनः पूछें या नीचे "Retry" बटन दबाएं।',
      intentAction: null,
      intentParam: null,
      requiresConfirmation: false,
      errorType: '503_OVERLOAD',
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    const isTrans = isTransientError(error);
    return res.status(200).json({
      reply: isTrans
        ? 'Shadow AI: AI सर्वर पर अत्यधिक ट्रैफिक (High Demand) है। हमने पुनः प्रयास किया किंतु सर्वर व्यस्त है। कृपया नीचे "Retry" बटन पर टैप करें।'
        : 'Shadow AI: नेटवर्क संपर्क स्थापित नहीं हो सका। कृपया अपने इंटरनेट कनेक्शन की जांच करें और पुनः प्रयास करें।',
      errorType: isTrans ? '503_OVERLOAD' : 'NETWORK',
      isOverloaded: isTrans,
    });
  }
});

// -----------------------------------------------------------------------------
// POST /api/gemini/stream
// High-Speed Server-Sent Events (SSE) Streaming for Instant Token Rendering
// -----------------------------------------------------------------------------
function detectIntentAction(text: string): { action: string | null; param: string | null } {
  const lower = text.toLowerCase().trim();
  if (/\b(torch\s+chalao|torch\s+on|flashlight\s+on|torch\s+jalao)\b/i.test(lower)) return { action: 'TORCH_ON', param: null };
  if (/\b(torch\s+band|torch\s+off|flashlight\s+off)\b/i.test(lower)) return { action: 'TORCH_OFF', param: null };
  if (/\b(camera\s+kholo|open\s+camera|photo\s+khincho)\b/i.test(lower)) return { action: 'CAMERA', param: null };
  if (/\b(settings\s+kholo|open\s+settings)\b/i.test(lower)) return { action: 'SETTINGS', param: null };
  if (/\b(live\s+screen|screen\s+kholo|screen\s+vision)\b/i.test(lower)) return { action: 'OPEN_LIVE_SCREEN', param: null };
  if (/\b(youtube\s+kholo|open\s+youtube)\b/i.test(lower)) return { action: 'YOUTUBE', param: 'https://www.youtube.com' };
  if (/\b(instagram\s+kholo|open\s+instagram)\b/i.test(lower)) return { action: 'INSTAGRAM', param: 'https://www.instagram.com' };
  if (/\b(whatsapp\s+kholo|open\s+whatsapp)\b/i.test(lower)) return { action: 'WHATSAPP', param: null };
  if (/\b(chrome\s+kholo|open\s+chrome|google\s+kholo)\b/i.test(lower)) return { action: 'CHROME', param: 'https://www.google.com' };
  if (/\b(maps\s+kholo|open\s+maps|rasta\s+dikhao)\b/i.test(lower)) return { action: 'MAPS', param: null };
  if (/\b(photo\s+clear|enhance\s+photo)\b/i.test(lower)) return { action: 'ENHANCE_PHOTO', param: null };
  if (/\b(photo\s+banao|create\s+image|image\s+banao)\b/i.test(lower)) return { action: 'CREATE_IMAGE', param: null };
  return { action: null, param: null };
}

app.post('/api/gemini/stream', async (req, res) => {
  const { message = '', media, language = 'hi-IN', history = [] } = req.body;
  const trimmed = typeof message === 'string' ? message.trim() : '';

  if (!trimmed && !media) {
    return res.status(400).json({ error: 'Message or media is required' });
  }

  // Fast local intent check first for instant execution (<10ms)
  if (!media && trimmed) {
    const immediate = parseLocalIntent(trimmed);
    if (immediate) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ text: immediate.reply, intentAction: immediate.intentAction, intentParam: immediate.intentParam })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, intentAction: immediate.intentAction, intentParam: immediate.intentParam })}\n\n`);
      return res.end();
    }
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  let isAborted = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });
  req.on('aborted', () => {
    isAborted = true;
  });

  const systemInstruction = `You are SHADOW AI, a personal AI assistant created by Golu ji.
Rules:
1. Your name is always Shadow AI.
2. Your creator's name is always Golu ji.
3. If asked who created you ("Tumko kisne banaya hai?"), reply: "Mujhe Golu ji ne banaya hai. Main Shadow AI hoon, Golu ji ka personal AI assistant."
4. Always respect Golu ji. Never say Google Assistant created you.
5. Speak concisely, warmly, and naturally in Hindi, Hinglish, or English (${language}).
6. NEVER open or automate banking/UPI/payment apps (Paytm, PhonePe, Google Pay, BHIM).
7. If the user shares an image, video, document, or screen frame, thoroughly examine and explain what is visible.`;

  let promptWithContext = trimmed;
  if (Array.isArray(history) && history.length > 0) {
    const hist = history.slice(-4).map((h: any) => `${h.sender === 'user' ? 'User' : 'Shadow'}: ${h.text}`).join('\n');
    promptWithContext = `Previous conversation:\n${hist}\n\nCurrent user request: ${trimmed || 'Please explain what is visible.'}`;
  }

  const parts: any[] = [];
  if (media) {
    if (media.data && media.mimeType) {
      const cleanData = media.data.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: cleanData,
        },
      });
    } else if (media.textContent) {
      promptWithContext += `\n\n[Attached File Content]:\n${media.textContent.slice(0, 8000)}`;
    }
  }
  parts.push({ text: promptWithContext });

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let streamSuccess = false;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    if (isAborted) break;
    try {
      const stream = await ai.models.generateContentStream({
        model: modelName,
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of stream) {
        if (isAborted) break;
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      if (!isAborted) {
        const detectedIntent = detectIntentAction(trimmed);
        res.write(`data: ${JSON.stringify({ done: true, intentAction: detectedIntent.action, intentParam: detectedIntent.param })}\n\n`);
        res.end();
      }
      streamSuccess = true;
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Shadow AI Stream] Model ${modelName} failed, trying fallback:`, err?.message?.slice(0, 100) || err);
      if (isAborted) break;
    }
  }

  if (!streamSuccess && !isAborted) {
    const isOverload = isTransientError(lastError);
    res.write(
      `data: ${JSON.stringify({
        error: isOverload ? '503_OVERLOAD' : 'NETWORK_ERROR',
        text: isOverload
          ? 'Shadow AI: AI सर्वर पर इस समय उच्च मांग (High Demand) है। कृपया नीचे "Retry" बटन पर टैप करें।'
          : 'Shadow AI: नेटवर्क संपर्क अस्थायी रूप से बाधित हुआ। कृपया पुनः प्रयास करें।',
        isError: true,
        done: true,
      })}\n\n`
    );
    res.end();
  }
});

// -----------------------------------------------------------------------------
// POST /api/gemini/generate-image
// AI Image Generation using gemini-3.1-flash-lite-image
// -----------------------------------------------------------------------------
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, language = 'hi-IN' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required for image generation.' });
    }

    console.log(`[Shadow AI] Generating image for prompt: "${prompt}"`);

    // Call gemini-3.1-flash-lite-image with exponential backoff
    const response = await callWithExponentialBackoff(
      () =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                text: `Create a futuristic, vibrant, ultra-high-definition digital illustration: ${prompt}. Cinematic lighting, cybernetic details, premium quality.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        }),
      2,
      1000
    );

    let base64Image: string | null = null;
    let descriptionText = '';

    const candidates = response.candidates || [];
    if (candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData?.data) {
          base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text + ' ';
        }
      }
    }

    if (base64Image) {
      return res.json({
        success: true,
        imageUrl: base64Image,
        prompt,
        description: descriptionText.trim() || `Generated image for: ${prompt}`,
      });
    }

    // If image model returned text only or requires paid tier
    return res.status(200).json({
      success: false,
      error: 'Image generation model busy ya quota limit reach hui.',
      reply: `AI Image model se photo generate karne me temporary limit aayi: "${prompt}". Kripya dobara prayas karein.`,
      description: descriptionText.trim(),
    });
  } catch (error: any) {
    console.error('Image generation error:', error?.message);
    const isOverload = isTransientError(error);
    return res.status(200).json({
      success: false,
      error: error?.message || 'Image generation failed',
      isOverload,
      reply: isOverload
        ? 'AI Image Servers par abhi high demand hai. Kripya thodi der baad dobara generate karein.'
        : `Image generate nahi ho saka: ${error?.message}`,
    });
  }
});

// -----------------------------------------------------------------------------
// POST /api/gemini/enhance-image
// Photo Enhancement Workflow ("Photo clear kar do")
// -----------------------------------------------------------------------------
app.post('/api/gemini/enhance-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', instruction = 'Photo clear kar do, clarity aur contrast badhao' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required for enhancement.' });
    }

    const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');

    // Attempt AI image editing with gemini-3.1-flash-lite-image
    try {
      const response = await callWithExponentialBackoff(
        () =>
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanData,
                    mimeType: mimeType,
                  },
                },
                {
                  text: `Enhance and restore this image: improve clarity, sharpness, color balance, remove noise, and optimize lighting. ${instruction}`,
                },
              ],
            },
          }),
        1,
        1000
      );

      let enhancedUrl: string | null = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            enhancedUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (enhancedUrl) {
        return res.json({
          success: true,
          enhancedUrl,
          method: 'ai-restoration',
          reply: 'Photo AI Restoration se clear kar di gayi hai. Original aur Enhanced dono versions upalabdha hain.',
        });
      }
    } catch (aiErr: any) {
      console.warn('[Shadow AI] AI image editing model unavailable:', aiErr?.message);
    }

    // Client-side canvas enhancement fallback instruction
    return res.json({
      success: true,
      enhancedUrl: null, // Signals frontend to apply high-definition Canvas Unsharp Mask & CLAHE filter
      method: 'client-adaptive-filter',
      reply: 'Photo ko high-definition adaptive contrast aur sharpness filter se clear kiya gaya hai.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Enhancement failed: ' + err?.message });
  }
});

// Download complete Android Studio project as a ZIP archive
app.get('/api/android-project/download', async (_req, res) => {
  try {
    const zip = new JSZip();

    // Add all Android project source files
    for (const file of ANDROID_FILES) {
      zip.file(file.path, file.content);
    }

    // Add standard gradle wrapper properties
    zip.file(
      'gradle/wrapper/gradle-wrapper.properties',
      `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n`
    );

    // Add gradlew shell script
    zip.file(
      'gradlew',
      `#!/bin/sh\necho "Starting Gradle Daemon for Shadow AI..."\n./gradlew assembleDebug\n`
    );

    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="shadow-ai-android-project.zip"');
    res.setHeader('Content-Length', content.length);
    res.send(content);
  } catch (error: any) {
    console.error('Failed to create project ZIP:', error);
    res.status(500).json({ error: 'Failed to generate project archive' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/gemini/tts
// Natural voice generation with Gemini Audio TTS (gemini-3.8-flash-lite-tts)
// -----------------------------------------------------------------------------
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt required for TTS' });
    }

    const cleanText = text
      .replace(/[*#`_~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const response = await callWithExponentialBackoff(
        () =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: cleanText.slice(0, 1000),
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice || 'Zephyr' },
                },
              },
            },
          }),
        1,
        600
      );

      let audioBase64: string | null = null;
      let mimeType = 'audio/wav';

      const candidates = response.candidates || [];
      if (candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData?.data) {
            audioBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'audio/wav';
            break;
          }
        }
      }

      if (audioBase64) {
        return res.json({
          success: true,
          audioBase64,
          mimeType,
          model: 'gemini-3.8-flash-lite-tts',
        });
      }
    } catch (ttsErr: any) {
      console.warn('[Shadow AI TTS] Model call deferred to client speech engine:', ttsErr?.message);
    }

    // Graceful fallback to client SpeechSynthesis
    return res.json({
      success: false,
      fallbackToBrowser: true,
      message: 'Client speech engine fallback enabled.',
    });
  } catch (err: any) {
    return res.json({
      success: false,
      fallbackToBrowser: true,
      error: err?.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'SHADOW AI Android Assistant Engine',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supportedApps: ['youtube', 'instagram', 'whatsapp', 'chrome', 'camera', 'gallery', 'settings', 'maps'],
    blockedFinancialPackages: RESTRICTED_FINANCIAL_PACKAGES.length,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  // Setup WebSocket server for Real-Time Gemini Live & Conversational Voice Stream
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live' });

  wss.on('error', (err: any) => {
    console.warn('[Shadow AI WS] WebSocket Server error:', err?.message || err);
  });

    wss.on('connection', (clientWs: WebSocket) => {
    console.log('[Shadow AI WS] Voice client connected to /ws/live');
    let liveSession: any = null;

    clientWs.send(
      JSON.stringify({
        type: 'session_ready',
        message: 'Shadow AI Fast Voice Engine ready.',
        supportedVoices: ['Zephyr', 'Puck', 'Fenrir', 'Kore', 'Charon'],
      })
    );

    clientWs.on('message', async (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'start_live') {
          // Clean up any stale session before starting a fresh one
          if (liveSession && typeof liveSession.close === 'function') {
            try {
              liveSession.close();
            } catch (e) {}
            liveSession = null;
          }

          try {
            if (ai.live && typeof ai.live.connect === 'function') {
              liveSession = await ai.live.connect({
                model: 'gemini-3.8-live',
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: msg.voice || 'Zephyr' } },
                  },
                  outputAudioTranscription: {},
                  systemInstruction: `You are SHADOW AI, a personal AI assistant created by Golu ji.
Follow these rules strictly:
1. Your name is always Shadow AI.
2. Your creator's name is always Golu ji.
3. Whenever anyone asks "Tumko kisne banaya hai?", "Who created you?", or "Who made you?", reply:
"Mujhe Golu ji ne banaya hai. Main Shadow AI hoon, Golu ji ka personal AI assistant."
4. Always say "Golu ji" with respect.
5. Never say that Google Assistant created you.
6. Speak naturally and concisely in Hindi, Hinglish, or English (${msg.language || 'hi-IN'}). Keep answers brief for voice output.
7. If asked to open an app (YouTube, Instagram, WhatsApp, Camera, etc.), acknowledge smoothly.
8. Strictly never open or authorize banking, UPI, or payment apps (Paytm, PhonePe, Google Pay, BHIM).`,
                },
                callbacks: {
                  onmessage: (liveMsg: any) => {
                    const audio = liveMsg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    const text =
                      liveMsg.serverContent?.outputTranscription?.text ||
                      liveMsg.serverContent?.modelTurn?.parts?.[0]?.text;

                    if (audio && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'audio_chunk', audio }));
                    }
                    if (text && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'transcript_chunk', text, sender: 'shadow' }));
                    }
                    if (liveMsg.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
                    }
                    if (liveMsg.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                    }
                  },
                  onerror: (err: any) => {
                    console.warn('[Shadow AI Live] Session error:', err?.message || err);
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'live_error', error: err?.message || 'Live session error' }));
                    }
                  },
                  onclose: () => {
                    console.log('[Shadow AI Live] Session closed');
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ type: 'live_closed' }));
                    }
                  },
                },
              });
              clientWs.send(JSON.stringify({ type: 'live_connected', mode: 'gemini-3.8-live' }));
            } else {
              clientWs.send(
                JSON.stringify({
                  type: 'live_connected',
                  mode: 'conversational-engine',
                  message: 'Conversational voice pipeline active.',
                })
              );
            }
          } catch (liveErr: any) {
            console.warn('[Shadow AI Live] Session fallback to streaming engine:', liveErr?.message);
            clientWs.send(
              JSON.stringify({
                type: 'live_connected',
                mode: 'conversational-engine',
                message: 'Conversational voice engine fallback active.',
              })
            );
          }
        } else if (msg.type === 'audio_input' && liveSession && msg.audio) {
          try {
            liveSession.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } catch (err: any) {
            console.warn('[Shadow AI Live] Audio input forward error:', err?.message);
          }
        } else if (msg.type === 'text_input' && msg.text) {
          const local = parseLocalIntent(msg.text);
          if (local) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript_chunk',
                  text: local.reply,
                  sender: 'shadow',
                  intentAction: local.intentAction,
                  intentParam: local.intentParam,
                })
              );
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }
            return;
          }

          if (liveSession && typeof liveSession.sendClientContent === 'function') {
            try {
              liveSession.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: msg.text }] }],
                turnComplete: true,
              });
            } catch (err: any) {
              console.warn('[Shadow AI Live] Text turn forward error:', err?.message);
            }
          } else {
            // Fallback high-speed streaming content generation
            try {
              const stream = await ai.models.generateContentStream({
                model: 'gemini-3.8-flash',
                contents: [{ text: msg.text }],
                config: {
                  systemInstruction: 'You are Shadow AI created by Golu ji. Reply briefly and naturally.',
                },
              });
              for await (const chunk of stream) {
                if (chunk.text && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'transcript_chunk', text: chunk.text, sender: 'shadow' }));
                }
              }
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'turn_complete' }));
              }
            } catch (streamErr: any) {
              console.warn('[Shadow AI Live] Stream turn error:', streamErr?.message);
            }
          }
        } else if (msg.type === 'interrupt') {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
          }
        }
      } catch (err) {
        console.error('[Shadow AI WS] Error processing message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Shadow AI WS] Voice client disconnected');
      if (liveSession && typeof liveSession.close === 'function') {
        try {
          liveSession.close();
        } catch (e) {}
        liveSession = null;
      }
    });
  });

  const hasDist = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));

  if (isProduction || (!isProduction && process.env.SERVE_STATIC === 'true')) {
    if (hasDist) {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    }
  } else {
    try {
      process.env.DISABLE_HMR = 'true';
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true, hmr: false, ws: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr: any) {
      console.warn('[Shadow AI] Vite middleware creation deferred to static dist:', viteErr?.message);
      if (hasDist) {
        app.use(express.static(path.resolve(__dirname, 'dist')));
        app.get('*', (_req, res) => {
          res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        });
      }
    }
  }

  let retryAttempts = 0;
  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Shadow AI Server] Port ${PORT} busy. Retrying in 600ms...`);
      if (retryAttempts < 3) {
        retryAttempts++;
        setTimeout(() => {
          try {
            httpServer.close();
            httpServer.listen(PORT, '0.0.0.0');
          } catch (retryErr) {
            console.warn('[Shadow AI Server] Retry listen deferred:', retryErr);
          }
        }, 600);
      }
    } else {
      console.error('[Shadow AI Server] HTTP server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Shadow AI Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
