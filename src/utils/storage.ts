import { ChatMessage, NoteItem, AppSettings, VoiceSessionRecord } from '../types.ts';

const MESSAGES_KEY = 'shadow_ai_messages';
const NOTES_KEY = 'shadow_ai_notes';
const SETTINGS_KEY = 'shadow_ai_settings';
const VOICE_SESSIONS_KEY = 'shadow_ai_voice_sessions';

/**
 * Sanitizes messages for localStorage storage so that large base64 media,
 * generated images, and photos do not trigger DOMException: QuotaExceededError.
 */
function sanitizeMessageForStorage(msg: ChatMessage): ChatMessage {
  const sanitized: ChatMessage = { ...msg };

  // If user uploaded media with large base64, keep metadata and placeholder
  if (sanitized.media) {
    const isLargeUrl = Boolean(sanitized.media.url && sanitized.media.url.length > 500);
    sanitized.media = {
      ...sanitized.media,
      // For large media, do not store huge base64 in localStorage (5MB limit)
      url: isLargeUrl || !sanitized.media.url ? undefined : sanitized.media.url,
    };
  }

  // If generated image has huge base64 data, strip large payload for storage
  if (sanitized.generatedImage) {
    const isHttp = Boolean(sanitized.generatedImage.url && sanitized.generatedImage.url.startsWith('http'));
    sanitized.generatedImage = {
      ...sanitized.generatedImage,
      url: isHttp ? sanitized.generatedImage.url : undefined,
    };
  }

  // If enhanced photo has large base64
  if (sanitized.enhancedImage) {
    sanitized.enhancedImage = {
      ...sanitized.enhancedImage,
      enhancedUrl: sanitized.enhancedImage.enhancedUrl?.startsWith('http')
        ? sanitized.enhancedImage.enhancedUrl
        : undefined,
      originalUrl: sanitized.enhancedImage.originalUrl?.startsWith('http')
        ? sanitized.enhancedImage.originalUrl
        : undefined,
    };
  }

  return sanitized;
}

export function saveMessagesSafely(messages: ChatMessage[]): void {
  try {
    // Keep at most 30 recent messages for persistence
    const recent = messages.slice(-30).map(sanitizeMessageForStorage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(recent));
  } catch (err: any) {
    console.warn('Storage quota warning when saving messages:', err?.message || err);

    // Level 1 Fallback: Keep last 15 messages with text only
    try {
      const minimal = messages.slice(-15).map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
        intentAction: m.intentAction,
        isError: m.isError,
        errorType: m.errorType,
      }));
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(minimal));
    } catch (fallbackErr) {
      console.warn('Level 1 quota fallback failed, keeping last 5 text messages:', fallbackErr);

      // Level 2 Fallback: Keep last 5 messages minimal
      try {
        const ultraMinimal = messages.slice(-5).map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        }));
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(ultraMinimal));
      } catch (finalErr) {
        // As an absolute last resort, clear the key to avoid unhandled exception crashes
        try {
          localStorage.removeItem(MESSAGES_KEY);
        } catch {
          // ignore
        }
      }
    }
  }
}

export function loadMessagesSafely(fallbackGreeting: ChatMessage): ChatMessage[] {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (!saved) return [fallbackGreeting];

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Clean up any empty string "" URLs to prevent <img src="" /> warnings
      return parsed.map((m: any, index: number) => {
        if (!m || typeof m !== 'object') return fallbackGreeting;
        const cleaned: ChatMessage = {
          id: m.id || `msg-${Date.now()}-${index}`,
          sender: m.sender === 'user' ? 'user' : 'shadow',
          text: typeof m.text === 'string' ? m.text : '',
          timestamp: typeof m.timestamp === 'number' && !isNaN(m.timestamp) ? m.timestamp : Date.now(),
          ...m,
        };
        // Re-enforce guaranteed primitives
        cleaned.id = m.id || `msg-${Date.now()}-${index}`;
        cleaned.sender = m.sender === 'user' ? 'user' : 'shadow';
        cleaned.text = typeof m.text === 'string' ? m.text : '';
        cleaned.timestamp = typeof m.timestamp === 'number' && !isNaN(m.timestamp) ? m.timestamp : Date.now();

        if (cleaned.media) {
          cleaned.media = {
            ...cleaned.media,
            url: cleaned.media.url && cleaned.media.url.trim() !== '' ? cleaned.media.url : undefined,
          };
        }
        if (cleaned.generatedImage) {
          cleaned.generatedImage = {
            ...cleaned.generatedImage,
            url: cleaned.generatedImage.url && cleaned.generatedImage.url.trim() !== '' ? cleaned.generatedImage.url : undefined,
          };
        }
        if (cleaned.enhancedImage) {
          cleaned.enhancedImage = {
            ...cleaned.enhancedImage,
            enhancedUrl: cleaned.enhancedImage.enhancedUrl && cleaned.enhancedImage.enhancedUrl.trim() !== '' ? cleaned.enhancedImage.enhancedUrl : undefined,
            originalUrl: cleaned.enhancedImage.originalUrl && cleaned.enhancedImage.originalUrl.trim() !== '' ? cleaned.enhancedImage.originalUrl : undefined,
          };
        }
        return cleaned;
      });
    }
    return [fallbackGreeting];
  } catch (e) {
    console.warn('Error reading messages from localStorage, resetting:', e);
    try {
      localStorage.removeItem(MESSAGES_KEY);
    } catch {
      // ignore
    }
    return [fallbackGreeting];
  }
}

export function saveNotesSafely(notes: NoteItem[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes.slice(-50)));
  } catch (e) {
    console.warn('Failed to save notes to localStorage:', e);
  }
}

export function loadNotesSafely(defaultNotes: NoteItem[]): NoteItem[] {
  try {
    const saved = localStorage.getItem(NOTES_KEY);
    if (!saved) return defaultNotes;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return parsed;
    return defaultNotes;
  } catch {
    return defaultNotes;
  }
}

export function saveSettingsSafely(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

export function loadSettingsSafely(defaultSettings: AppSettings): AppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

/**
 * Persists voice assistant session transcripts separately from the main chat history.
 * Allows users to review past voice-only conversations with timestamps and turn details.
 */
export function saveVoiceSessionsSafely(sessions: VoiceSessionRecord[]): void {
  try {
    // Keep at most 40 recent sessions, sanitize each session to protect quota
    const cleaned: VoiceSessionRecord[] = sessions.slice(-40).map((session) => ({
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
      language: session.language,
      summary: session.summary,
      transcripts: (session.transcripts || []).slice(-60).map((t) => ({
        id: t.id || `vt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: t.sender === 'user' ? 'user' : 'shadow',
        text: typeof t.text === 'string' ? t.text.slice(0, 1000) : '',
        timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
      })),
    }));
    localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(cleaned));
  } catch (err: any) {
    console.warn('Storage quota warning when saving voice sessions:', err?.message || err);
    try {
      // Fallback: keep only last 10 sessions with 15 transcripts each
      const trimmed = sessions.slice(-10).map((s) => ({
        ...s,
        transcripts: (s.transcripts || []).slice(-15),
      }));
      localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }
}

export function loadVoiceSessionsSafely(): VoiceSessionRecord[] {
  try {
    const saved = localStorage.getItem(VOICE_SESSIONS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s: any) => s && typeof s === 'object' && Array.isArray(s.transcripts) && s.transcripts.length > 0)
        .map((s: any) => ({
          id: s.id || `voice-session-${s.startedAt || Date.now()}`,
          startedAt: typeof s.startedAt === 'number' ? s.startedAt : Date.now(),
          endedAt: typeof s.endedAt === 'number' ? s.endedAt : undefined,
          durationSeconds: typeof s.durationSeconds === 'number' ? s.durationSeconds : undefined,
          language: typeof s.language === 'string' ? s.language : undefined,
          summary: typeof s.summary === 'string' ? s.summary : undefined,
          transcripts: s.transcripts.map((t: any) => ({
            id: t.id || `vt-${Date.now()}`,
            sender: t.sender === 'user' ? 'user' : 'shadow',
            text: typeof t.text === 'string' ? t.text : '',
            timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
          })),
        }));
    }
    return [];
  } catch (e) {
    console.warn('Error reading voice sessions from localStorage:', e);
    return [];
  }
}

export function appendVoiceSessionSafely(newSession: VoiceSessionRecord): VoiceSessionRecord[] {
  if (!newSession || !newSession.transcripts || newSession.transcripts.length === 0) {
    return loadVoiceSessionsSafely();
  }
  const existing = loadVoiceSessionsSafely();
  const filtered = existing.filter((s) => s.id !== newSession.id);
  const updated = [newSession, ...filtered].slice(0, 40);
  saveVoiceSessionsSafely(updated);
  return updated;
}

export function deleteVoiceSessionSafely(sessionId: string): VoiceSessionRecord[] {
  const existing = loadVoiceSessionsSafely();
  const updated = existing.filter((s) => s.id !== sessionId);
  saveVoiceSessionsSafely(updated);
  return updated;
}

export function clearVoiceSessionsSafely(): void {
  try {
    localStorage.removeItem(VOICE_SESSIONS_KEY);
  } catch {}
}
