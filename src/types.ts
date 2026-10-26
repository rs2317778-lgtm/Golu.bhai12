export type Language = 'hi-IN' | 'en-IN' | 'en-US' | 'hinglish';

export type Theme = 'cyber-purple' | 'navy-cyan' | 'matrix-green';

export interface MediaAttachment {
  type: 'image' | 'video' | 'file' | 'screen';
  mimeType: string;
  data: string; // base64 data without prefix (sent to Gemini API)
  previewUrl: string; // data URL or blob URL for preview and playback
  name: string;
  size: number; // file size in bytes
  textContent?: string; // for text/document files
  isLiveScreen?: boolean;
}

export interface ScreenVisionState {
  isSharing: boolean;
  stream: MediaStream | null;
  lastCapturedUrl: string | null;
  lastCapturedBase64: string | null;
  captureTimestamp: number | null;
  error: string | null;
}

export interface GeneratedImageDetails {
  url?: string;
  prompt: string;
  createdAt: number;
}

export interface EnhancedImageDetails {
  originalUrl?: string;
  enhancedUrl?: string;
  filtersApplied: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'shadow';
  text: string;
  timestamp: number;
  intentAction?: string | null;
  intentParam?: string | null;
  requiresConfirmation?: boolean;
  status?: 'speaking' | 'executed' | 'cancelled';
  isError?: boolean;
  errorType?: '503_OVERLOAD' | '429_QUOTA' | 'AUTH' | 'NETWORK' | 'BLOCKED_PAYMENT' | 'GENERAL';
  media?: {
    type: 'image' | 'video' | 'file' | 'screen';
    mimeType: string;
    url?: string;
    name?: string;
    size?: number;
    isLiveScreen?: boolean;
  };
  generatedImage?: GeneratedImageDetails;
  enhancedImage?: EnhancedImageDetails;
  blockedPackage?: string;
  reaction?: 'like' | 'dislike' | null;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  isReminder: boolean;
  reminderDate?: string;
  reminderTime?: string;
  createdAt: number;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  autoSpeak: boolean;
  speechRate: number;
  speechPitch: number;
  requireSensitiveConfirmation: boolean;
  hapticFeedback: boolean;
  backendUrl: string;
  blockedPackages: string[];
  blockFinancialApps: boolean;
  wakeWordEnabled?: boolean;
  wakeWordPhrase?: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  packageName: string;
  iconName: string;
  category: 'social' | 'media' | 'utility' | 'system' | 'financial';
  isBlocked: boolean;
  description: string;
}

export interface VoiceTranscriptItem {
  id: string;
  sender: 'user' | 'shadow';
  text: string;
  timestamp: number;
}

export interface VoiceSessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;
  transcripts: VoiceTranscriptItem[];
  language?: string;
  summary?: string;
}

