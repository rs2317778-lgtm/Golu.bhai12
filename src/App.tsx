import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  NoteItem,
  AppSettings,
  Language,
  Theme,
  MediaAttachment,
  GeneratedImageDetails,
  EnhancedImageDetails,
  ScreenVisionState,
  VoiceSessionRecord,
  VoiceTranscriptItem,
} from './types.ts';
import { ShadowLogo } from './components/ShadowLogo.tsx';
import { VoiceVisualizer } from './components/VoiceVisualizer.tsx';
import { ConfirmationDialog } from './components/ConfirmationDialog.tsx';
import { NotesRemindersModal } from './components/NotesRemindersModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AndroidProjectHubModal } from './components/AndroidProjectHubModal.tsx';
import { AndroidSimulatedApps, SimulatedAppType } from './components/AndroidSimulatedApps.tsx';
import { AndroidWakeWordInfoModal } from './components/AndroidWakeWordInfoModal.tsx';
import { CameraCaptureModal } from './components/CameraCaptureModal.tsx';
import { MediaPreviewTray } from './components/MediaPreviewTray.tsx';
import { ImageWorkflowModal } from './components/ImageWorkflowModal.tsx';
import { VoiceAssistantOrbModal } from './components/VoiceAssistantOrbModal.tsx';
import { LiveScreenVisionModal } from './components/LiveScreenVisionModal.tsx';
import { VoiceSessionsHistoryModal } from './components/VoiceSessionsHistoryModal.tsx';
import { AssistantMessageToolbar, extractCleanText } from './components/AssistantMessageToolbar.tsx';
import {
  saveMessagesSafely,
  loadMessagesSafely,
  saveNotesSafely,
  loadNotesSafely,
  saveSettingsSafely,
  loadSettingsSafely,
  saveVoiceSessionsSafely,
  loadVoiceSessionsSafely,
  appendVoiceSessionSafely,
  deleteVoiceSessionSafely,
  clearVoiceSessionsSafely,
} from './utils/storage.ts';
import { validateIntentBeforeLaunch, validateAndSanitizeUrl } from './utils/security.ts';
import { floatTo16BitPCM, scheduleAudioChunk, stopAllAudioSources } from './utils/audio.ts';
import {
  Brain,
  Mic,
  MicOff,
  Send,
  Download,
  Settings as SettingsIcon,
  FileText,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  ExternalLink,
  Search,
  Sparkles,
  Shield,
  Layers,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  CheckCircle,
  ShieldAlert,
  Flashlight,
  Zap,
  Radio,
  Square,
  Image as ImageIcon,
  Camera,
  Film,
  Play,
  AlertCircle,
  X,
  Eye,
  Plus,
  Wand2,
  Paperclip,
  RefreshCw,
  PhoneCall,
  Youtube,
  Instagram,
  MessageCircle,
  Monitor,
  MonitorOff,
  ScreenShare,
  StopCircle,
  Battery,
  BatteryCharging,
  BatteryWarning,
  History,
} from 'lucide-react';

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  sender: 'shadow',
  text: `Namaste! Main SHADOW AI hoon — Golu ji dwara banaya gaya personal AI assistant.

Aap mujhse Hindi ya English me baat kar sakte hain. Boliye ya try karein:
• "Tumko kisne banaya hai?" (Creator identity)
• "YouTube kholo" / "Instagram kholo" / "WhatsApp kholo"
• "Camera kholo" / "Gallery kholo" / "Settings kholo"
• "Torch chalao" / "Torch band karo"
• 📸 Photo upload karein aur bolein: "Photo clear kar do"
• 🎨 Plus (+) button tap karke "Create Image" chunein
• "Ruk jao" (voice listening stop karne ke liye)

⚠️ सुरक्षा सूचना: Paytm, PhonePe, Google Pay aur Banking apps suraksha neeti ke antargat blocked hain.`,
  timestamp: Date.now(),
};

export default function App() {
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    return loadSettingsSafely({
      language: 'hinglish',
      theme: 'cyber-purple',
      autoSpeak: true,
      speechRate: 1.0,
      speechPitch: 1.0,
      requireSensitiveConfirmation: true,
      hapticFeedback: true,
      backendUrl: '',
      blockedPackages: [],
      blockFinancialApps: true,
      wakeWordEnabled: true,
      wakeWordPhrase: 'Hey Shadow',
    });
  });

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return loadMessagesSafely(INITIAL_GREETING);
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Plus Menu Popover state
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Image Generation & Photo Clear Workflow Modal
  const [isImageWorkflowOpen, setIsImageWorkflowOpen] = useState(false);
  const [imageWorkflowMode, setImageWorkflowMode] = useState<'create_image' | 'enhance_photo'>('create_image');
  const [workflowInitialPrompt, setWorkflowInitialPrompt] = useState('');
  const [workflowInitialImage, setWorkflowInitialImage] = useState<string | undefined>(undefined);

  // Notes & Reminders
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    return loadNotesSafely([
      {
        id: 'note-1',
        title: 'Android Project Build',
        content: 'Compile signed release APK in Android Studio using Build > Generate Signed APK.',
        isReminder: false,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'note-2',
        title: 'Voice Commands in Hindi',
        content: 'Test voice: "YouTube kholo", "WhatsApp kholo", "Photo clear kar do".',
        isReminder: true,
        reminderTime: '18:00',
        reminderDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now() - 7200000,
      },
    ]);
  });

  // Speech Recognition & TTS States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Media Upload States
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [expandedMediaUrl, setExpandedMediaUrl] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Simulated Intent Apps
  const [activeSimulatedApp, setActiveSimulatedApp] = useState<SimulatedAppType>(null);
  const [simulatedAppParam, setSimulatedAppParam] = useState<string | null>(null);

  // Modals
  const [isProjectHubOpen, setIsProjectHubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isWakeWordModalOpen, setIsWakeWordModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isVoiceHistoryOpen, setIsVoiceHistoryOpen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isContinuousVoiceActive, setIsContinuousVoiceActive] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [liveConnectionStatus, setLiveConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
  const [liveMode, setLiveMode] = useState<'gemini-3.8-live' | 'fast-stream'>('gemini-3.8-live');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Separately Persisted Voice Assistant Sessions & Transcripts
  const [voiceSessions, setVoiceSessions] = useState<VoiceSessionRecord[]>(() => loadVoiceSessionsSafely());
  const currentVoiceSessionRef = useRef<VoiceSessionRecord | null>(null);

  // Feature: Dynamic Device Battery Percentage Indicator (Battery Status API + Periodic Refresh)
  const [batteryState, setBatteryState] = useState<{
    level: number;
    charging: boolean;
    supported: boolean;
  }>({
    level: 95,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    let batteryObj: any = null;
    let fallbackInterval: any = null;

    const syncBatteryState = (battery: any) => {
      try {
        const lvl = Math.round((battery.level ?? 1) * 100);
        const chg = Boolean(battery.charging);
        setBatteryState({
          level: Math.min(100, Math.max(1, lvl)),
          charging: chg,
          supported: true,
        });
      } catch (err) {
        console.warn('Battery state sync error:', err);
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          batteryObj = battery;
          syncBatteryState(battery);
          battery.addEventListener('levelchange', () => syncBatteryState(battery));
          battery.addEventListener('chargingchange', () => syncBatteryState(battery));
        })
        .catch(() => {
          runBatterySimulation();
        });
    } else {
      runBatterySimulation();
    }

    function runBatterySimulation() {
      // Periodic update simulating realistic subtle battery change
      fallbackInterval = setInterval(() => {
        setBatteryState((prev) => {
          const shift = prev.charging ? 1 : -1;
          const apply = Math.random() > 0.65;
          const nextLvl = apply ? Math.min(100, Math.max(12, prev.level + shift)) : prev.level;
          return { ...prev, level: nextLvl, supported: false };
        });
      }, 30000);
    }

    return () => {
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('levelchange', syncBatteryState);
          batteryObj.removeEventListener('chargingchange', syncBatteryState);
        } catch {}
      }
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // PWA Android Install Prompt State & Handlers
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
      handleShowFeedbackToast('Shadow AI Android ऍप सफलतापूर्वक इंस्टॉल हो गया! 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    triggerHaptic(20);
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          handleShowFeedbackToast('Installing Shadow AI on Android...');
        }
        setDeferredInstallPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
        setIsProjectHubOpen(true);
      }
    } else {
      setIsProjectHubOpen(true);
    }
  };

  // Feature: Haptic Feedback Engine (navigator.vibrate) guarded by settings.hapticFeedback
  const triggerHaptic = (pattern: number | number[] = 25) => {
    if (!settings.hapticFeedback) return;
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors if restricted by browser security policies
      }
    }
  };

  const handleDeleteVoiceSession = (sessionId: string) => {
    triggerHaptic(20);
    const updated = deleteVoiceSessionSafely(sessionId);
    setVoiceSessions(updated);
  };

  const handleClearAllVoiceSessions = () => {
    triggerHaptic([30, 40, 30]);
    clearVoiceSessionsSafely();
    setVoiceSessions([]);
  };

  // Feature 1: Live Screen Vision (Android MediaProjection / Web displayMedia) State
  const [isLiveScreenOpen, setIsLiveScreenOpen] = useState(false);
  const [screenVision, setScreenVision] = useState<ScreenVisionState>({
    isSharing: false,
    stream: null,
    lastCapturedUrl: null,
    lastCapturedBase64: null,
    captureTimestamp: null,
    error: null,
  });
  const screenVisionRef = useRef<ScreenVisionState>(screenVision);
  useEffect(() => {
    screenVisionRef.current = screenVision;
  }, [screenVision]);

  // Assistant Message Toolbar: Read Aloud tracking & Action feedback toasts
  const [currentlyReadingMessageId, setCurrentlyReadingMessageId] = useState<string | null>(null);
  const [actionToastMessage, setActionToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (actionToastMessage) {
      const timer = setTimeout(() => setActionToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [actionToastMessage]);

  // Feature 2: Wake Word Assistant ("Hey Shadow") Notification State
  const [wakeWordIndicator, setWakeWordIndicator] = useState<string | null>(null);
  const wakeWordTimeoutRef = useRef<any>(null);

  // Synthesized Web Audio wake chime for immediate voice feedback
  const playWakeChime = () => {
    triggerHaptic([45, 60, 45]);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.log('[Wake Word] Audio chime error:', e);
    }
  };

  const isVoiceAssistantOpenRef = useRef<boolean>(false);
  const isContinuousVoiceActiveRef = useRef<boolean>(false);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const isManualStopRef = useRef<boolean>(true); // Initial state: manual stop active until user explicitly initiates listening
  const isMicMutedRef = useRef<boolean>(false);
  const speechStatusRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const consecutiveVoiceErrorsRef = useRef<number>(0);
  const autoResumeTimerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastAssistantSpokenTextRef = useRef<string>('');
  const lastAssistantSpokenTimeRef = useRef<number>(0);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef<boolean>(false);

  // Synchronous state + ref updater to prevent async state race conditions during voice turn transitions
  const updateSpeechStatus = (status: 'idle' | 'listening' | 'thinking' | 'speaking') => {
    speechStatusRef.current = status;
    setSpeechStatus(status);
  };

  useEffect(() => {
    isVoiceAssistantOpenRef.current = isVoiceAssistantOpen;
  }, [isVoiceAssistantOpen]);

  useEffect(() => {
    isContinuousVoiceActiveRef.current = isContinuousVoiceActive;
  }, [isContinuousVoiceActive]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    speechStatusRef.current = speechStatus;
  }, [speechStatus]);

  // Confirmation Dialog
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    action?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const [viewMode, setViewMode] = useState<'phone' | 'expanded'>('phone');

  // SpeechRecognizer Lifecycle & Dedicated Timeout States
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const maxListeningTimerRef = useRef<any>(null);
  const lastUserPromptRef = useRef<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Close plus menu when clicking outside
  const plusMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  // Save to localStorage safely (with quota protection & base64 pruning)
  useEffect(() => {
    saveMessagesSafely(messages);
  }, [messages]);

  useEffect(() => {
    saveNotesSafely(notes);
  }, [notes]);

  useEffect(() => {
    saveSettingsSafely(settings);
  }, [settings]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Photo or Video Selection
  const handleFileSelected = (file: File, explicitType?: 'image' | 'video' | 'file') => {
    setMediaError(null);
    setIsPlusMenuOpen(false);

    const isVideo = explicitType === 'video' || file.type.startsWith('video/');
    const isImage = explicitType === 'image' || file.type.startsWith('image/');
    const isFile = explicitType === 'file' || (!isVideo && !isImage);

    // Size limits: 25MB videos, 15MB photos, 10MB documents
    const maxBytes = isVideo ? 25 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      const limitMb = isVideo ? '25MB' : '15MB';
      setMediaError(`File size exceeds limit (${limitMb}). Kripya chhota file select karein.`);
      return;
    }

    setUploadProgress(20);
    const progressTimer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return p + 25;
      });
    }, 60);

    const reader = new FileReader();

    if (isFile && (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.md'))) {
      reader.onload = () => {
        clearInterval(progressTimer);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 300);

        const textContent = reader.result as string;
        setSelectedMedia({
          type: 'file',
          mimeType: file.type || 'text/plain',
          data: Buffer.from(textContent).toString('base64'),
          previewUrl: '',
          name: file.name,
          size: file.size,
          textContent,
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        clearInterval(progressTimer);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 300);

        const result = reader.result as string;
        const cleanData = result.replace(/^data:[^;]+;base64,/, '');

        setSelectedMedia({
          type: isVideo ? 'video' : isImage ? 'image' : 'file',
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          data: cleanData,
          previewUrl: result,
          name: file.name || (isVideo ? 'video_upload.mp4' : 'photo_upload.jpg'),
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    }

    reader.onerror = () => {
      clearInterval(progressTimer);
      setUploadProgress(0);
      setMediaError('Failed to read file. Please try again.');
    };
  };

  const handleCameraCapture = (dataUrl: string, file: File) => {
    setMediaError(null);
    const cleanData = dataUrl.replace(/^data:[^;]+;base64,/, '');
    setSelectedMedia({
      type: 'image',
      mimeType: 'image/jpeg',
      data: cleanData,
      previewUrl: dataUrl,
      name: file.name || `shadow_camera_${Date.now()}.jpg`,
      size: file.size,
    });
  };

  const handleSendMessageRef = useRef<(text?: string) => Promise<void>>(async () => {});

  // Dedicated speech watchdog & silence timer clearers
  const clearSpeechTimeouts = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListeningTimerRef.current) {
      clearTimeout(maxListeningTimerRef.current);
      maxListeningTimerRef.current = null;
    }
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
  };

  const stopRecognitionCleanly = (isManual = true) => {
    if (isManual) {
      isManualStopRef.current = true;
    }
    clearSpeechTimeouts();
    isStartingRef.current = false;
    isRecognitionRunningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        try {
          recognitionRef.current.stop();
        } catch (e2) {}
      }
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  // Safe continuous resume helper with strict state validations & acoustic cooldown
  const safelyResumeContinuousListening = (delayMs = 700) => {
    clearSpeechTimeouts();
    // Guard: Only resume if user has NOT manually stopped, mic is NOT muted, and modal is open
    if (
      !isContinuousVoiceActiveRef.current ||
      isManualStopRef.current ||
      isMicMutedRef.current ||
      !isVoiceAssistantOpenRef.current
    ) {
      updateSpeechStatus('idle');
      return;
    }

    updateSpeechStatus('listening');
    autoResumeTimerRef.current = setTimeout(() => {
      if (
        isContinuousVoiceActiveRef.current &&
        !isManualStopRef.current &&
        !isMicMutedRef.current &&
        isVoiceAssistantOpenRef.current &&
        speechStatusRef.current !== 'thinking' &&
        speechStatusRef.current !== 'speaking'
      ) {
        startListeningSafely();
      } else {
        updateSpeechStatus('idle');
      }
    }, delayMs);
  };

  // Safe microphone starter with duplicate-prevention guard and invalid state protection
  const startListeningSafely = () => {
    if (isManualStopRef.current) {
      console.log('[Continuous Voice] User manually stopped listening, skipping start');
      return;
    }
    if (isMicMutedRef.current) {
      console.log('[Continuous Voice] Mic is muted, ignoring start request');
      return;
    }
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not available in this browser.');
      return;
    }
    if (isRecognitionRunningRef.current || isStartingRef.current) {
      console.log('[Continuous Voice] Recognition is already active or starting, skipping duplicate start.');
      return;
    }

    clearSpeechTimeouts();
    stopSpeaking();

    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (err: any) {
      isStartingRef.current = false;
      if (err?.name === 'InvalidStateError') {
        // Recognition was already starting or active in browser engine
        isRecognitionRunningRef.current = true;
        setIsListening(true);
        updateSpeechStatus('listening');
      } else {
        console.warn('[Continuous Voice] start error:', err);
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        setSpeechError('Microphone could not start. Tap to retry.');
        updateSpeechStatus('idle');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // FAST RESPONSE MODE: Gemini 3.8 Live WebSocket & Web Audio Streaming Pipeline
  // ---------------------------------------------------------------------------
  const connectLiveWebSocket = () => {
    if (liveWsRef.current && (liveWsRef.current.readyState === WebSocket.OPEN || liveWsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      setLiveConnectionStatus('connecting');
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        setLiveConnectionStatus('connected');
        setIsLiveConnected(true);
        ws.send(JSON.stringify({
          type: 'start_live',
          voice: 'Zephyr',
          language: settings.language,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'live_connected') {
            setLiveMode(msg.mode === 'gemini-3.8-live' ? 'gemini-3.8-live' : 'fast-stream');
            setLiveConnectionStatus('connected');
            setIsLiveConnected(true);
          } else if (msg.type === 'audio_chunk' && msg.audio) {
            if (!outputAudioCtxRef.current || outputAudioCtxRef.current.state === 'closed') {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
            }
            setIsSpeaking(true);
            updateSpeechStatus('speaking');
            scheduleAudioChunk(
              outputAudioCtxRef.current,
              msg.audio,
              nextAudioStartTimeRef,
              activeAudioSourcesRef
            );
          } else if (msg.type === 'transcript_chunk' && msg.text) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'shadow' && last.id.startsWith('live-stream-')) {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + msg.text,
                };
                return updated;
              } else {
                return [
                  ...prev,
                  {
                    id: 'live-stream-' + Date.now(),
                    sender: 'shadow',
                    text: msg.text,
                    timestamp: Date.now(),
                  },
                ];
              }
            });
          } else if (msg.type === 'turn_complete') {
            setIsSpeaking(false);
            if (isContinuousVoiceActiveRef.current && !isManualStopRef.current && isVoiceAssistantOpenRef.current && !isMicMutedRef.current) {
              updateSpeechStatus('listening');
            } else {
              updateSpeechStatus('idle');
            }
          } else if (msg.type === 'interrupted') {
            stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
            setIsSpeaking(false);
            if (isContinuousVoiceActiveRef.current && !isManualStopRef.current && isVoiceAssistantOpenRef.current && !isMicMutedRef.current) {
              updateSpeechStatus('listening');
            } else {
              updateSpeechStatus('idle');
            }
          } else if (msg.type === 'local_intent') {
            setMessages((prev) => [
              ...prev,
              {
                id: 'reply-' + Date.now(),
                sender: 'shadow',
                text: msg.reply,
                timestamp: Date.now(),
                intentAction: msg.intentAction,
                intentParam: msg.intentParam,
              },
            ]);
            speakText(msg.reply);
          }
        } catch (parseErr) {
          console.warn('[Live WS] Parse error:', parseErr);
        }
      };

      ws.onerror = (err) => {
        console.warn('[Live WS] Error:', err);
        setLiveConnectionStatus('error');
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
        setLiveConnectionStatus('disconnected');
        liveWsRef.current = null;
      };
    } catch (e) {
      console.warn('[Live WS] Connection init error:', e);
      setLiveConnectionStatus('error');
    }
  };

  const startLiveAudioCapture = async () => {
    try {
      if (micStreamRef.current) {
        return;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (
          isMicMutedRef.current ||
          isManualStopRef.current ||
          speechStatusRef.current === 'speaking' ||
          !isVoiceAssistantOpenRef.current
        ) {
          setAudioLevel(0);
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(1, rms * 6));

        if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
          const pcmBase64 = floatTo16BitPCM(inputData);
          liveWsRef.current.send(JSON.stringify({ type: 'audio_input', audio: pcmBase64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      updateSpeechStatus('listening');
    } catch (micErr: any) {
      console.warn('[Live Audio] Mic capture failed, falling back:', micErr);
      startListeningSafely();
    }
  };

  const stopLiveAudioCapture = () => {
    if (micProcessorRef.current) {
      try {
        micProcessorRef.current.disconnect();
      } catch (e) {}
      micProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close().catch(() => {});
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleLiveVoiceCommand = (command: string) => {
    if (!command || !command.trim()) return;
    const cleanCmd = command.trim();
    triggerHaptic(20);

    setMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: cleanCmd,
        timestamp: Date.now(),
      },
    ]);

    if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      updateSpeechStatus('thinking');
      stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
      liveWsRef.current.send(JSON.stringify({ type: 'text_input', text: cleanCmd }));
    } else {
      handleSendMessage(cleanCmd);
    }
  };

  // Continuous Conversation Lifecycle Controllers
  const handleStartContinuousConversation = () => {
    // Explicit user action to initiate Live Voice
    triggerHaptic(30);
    isManualStopRef.current = false;
    consecutiveVoiceErrorsRef.current = 0;
    clearSpeechTimeouts();
    stopSpeaking();
    stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);

    // Initialize fresh separate voice session record
    currentVoiceSessionRef.current = {
      id: 'voice-session-' + Date.now(),
      startedAt: Date.now(),
      transcripts: [],
      language: settings.language,
    };

    setIsContinuousVoiceActive(true);
    isContinuousVoiceActiveRef.current = true;
    setIsMicMuted(false);
    isMicMutedRef.current = false;
    setIsVoiceAssistantOpen(true);

    // Connect to Fast Live Stream & Audio Pipeline
    connectLiveWebSocket();
    startLiveAudioCapture();
  };

  const handlePauseListening = () => {
    isManualStopRef.current = true;
    consecutiveVoiceErrorsRef.current = 0;
    setIsContinuousVoiceActive(false);
    isContinuousVoiceActiveRef.current = false;
    clearSpeechTimeouts();
    stopSpeaking();
    stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
    stopLiveAudioCapture();
    stopRecognitionCleanly(true);
    updateSpeechStatus('idle');
  };

  const handleEndContinuousConversation = () => {
    triggerHaptic(20);
    isManualStopRef.current = true;
    consecutiveVoiceErrorsRef.current = 0;
    setIsContinuousVoiceActive(false);
    isContinuousVoiceActiveRef.current = false;
    clearSpeechTimeouts();
    stopSpeaking();
    stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
    stopLiveAudioCapture();
    stopRecognitionCleanly(true);
    updateSpeechStatus('idle');
    setIsVoiceAssistantOpen(false);

    if (liveWsRef.current) {
      try {
        liveWsRef.current.close();
      } catch (e) {}
      liveWsRef.current = null;
    }
    setIsLiveConnected(false);
    setLiveConnectionStatus('disconnected');

    // Finalize and save current voice session if transcripts exist
    if (currentVoiceSessionRef.current && currentVoiceSessionRef.current.transcripts.length > 0) {
      const durationSec = Math.round((Date.now() - currentVoiceSessionRef.current.startedAt) / 1000);
      const completedSession: VoiceSessionRecord = {
        ...currentVoiceSessionRef.current,
        endedAt: Date.now(),
        durationSeconds: durationSec,
        summary: currentVoiceSessionRef.current.transcripts[0]?.text?.slice(0, 80),
      };
      const updated = appendVoiceSessionSafely(completedSession);
      setVoiceSessions(updated);
      currentVoiceSessionRef.current = null;
    }
  };

  const handleToggleMicMute = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      isMicMutedRef.current = next;
      if (next) {
        // Muted by user
        stopRecognitionCleanly(false);
        updateSpeechStatus('idle');
      } else {
        // Unmuted: resume only if continuous mode was already active and assistant is open
        if (
          isContinuousVoiceActiveRef.current &&
          !isManualStopRef.current &&
          isVoiceAssistantOpenRef.current
        ) {
          updateSpeechStatus('listening');
        }
      }
      return next;
    });
  };

  const handleInterrupt = () => {
    stopSpeaking();
    stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
    if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      try {
        liveWsRef.current.send(JSON.stringify({ type: 'interrupt' }));
      } catch (e) {}
    }
    if (
      isContinuousVoiceActiveRef.current &&
      !isMicMutedRef.current &&
      !isManualStopRef.current &&
      isVoiceAssistantOpenRef.current
    ) {
      updateSpeechStatus('listening');
    } else {
      updateSpeechStatus('idle');
    }
  };

  const handleReconnectMic = () => {
    consecutiveVoiceErrorsRef.current = 0;
    setSpeechError(null);
    stopRecognitionCleanly(true);
    stopSpeaking();
    setTimeout(() => {
      handleStartContinuousConversation();
    }, 250);
  };

  // ---------------------------------------------------------------------------
  // FEATURE 1: Live Screen Vision (Official Screen-Sharing MediaProjection API)
  // ---------------------------------------------------------------------------
  const startScreenShare = async () => {
    try {
      setScreenVision((prev) => ({ ...prev, error: null }));
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setScreenVision((prev) => ({
          ...prev,
          error: 'Screen sharing is not supported in this browser. Use Chrome 107+ or download the native Shadow AI Android APK with MediaProjection.',
        }));
        return;
      }

      // Explicit user consent via official browser/OS screen-share prompt
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as any,
        audio: false,
      });

      // Stop capturing immediately when user halts sharing or revokes permission
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          console.log('[Live Screen Vision] Track ended by user or system.');
          stopScreenShare();
        };
      }

      setScreenVision({
        isSharing: true,
        stream,
        lastCapturedUrl: null,
        lastCapturedBase64: null,
        captureTimestamp: Date.now(),
        error: null,
      });

      // Automatically capture first frame for instant vision readiness
      setTimeout(() => {
        captureScreenFrameHelper(stream);
      }, 400);
    } catch (err: any) {
      console.warn('[Live Screen Vision] Error requesting display media:', err);
      if (err?.name === 'NotAllowedError') {
        setScreenVision((prev) => ({
          ...prev,
          isSharing: false,
          error: 'Screen sharing permission was cancelled. Tap "Start Sharing" to try again.',
        }));
      } else {
        setScreenVision((prev) => ({
          ...prev,
          isSharing: false,
          error: err?.message || 'Failed to initialize screen sharing.',
        }));
      }
    }
  };

  const stopScreenShare = () => {
    if (screenVisionRef.current.stream) {
      try {
        screenVisionRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('[Live Screen Vision] Error stopping media tracks:', e);
      }
    }
    setScreenVision({
      isSharing: false,
      stream: null,
      lastCapturedUrl: null,
      lastCapturedBase64: null,
      captureTimestamp: null,
      error: null,
    });
  };

  // Extracts live JPEG frame from active video stream using offscreen canvas
  const captureScreenFrameHelper = async (
    activeStream?: MediaStream | null
  ): Promise<{ base64: string; dataUrl: string } | null> => {
    const stream = activeStream || screenVisionRef.current.stream;
    if (!stream || (!screenVisionRef.current.isSharing && !activeStream)) {
      return null;
    }

    const track = stream.getVideoTracks()[0];
    if (!track || track.readyState !== 'live') {
      return null;
    }

    return new Promise<{ base64: string; dataUrl: string } | null>((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.pause();
        video.srcObject = null;
        video.remove();
      };

      const grab = () => {
        try {
          const width = video.videoWidth || 1280;
          const height = video.videoHeight || 720;
          const maxDim = 1280;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');

          setScreenVision((prev) => ({
            ...prev,
            lastCapturedUrl: dataUrl,
            lastCapturedBase64: base64,
            captureTimestamp: Date.now(),
          }));

          cleanup();
          resolve({ base64, dataUrl });
        } catch (e) {
          console.warn('[Live Screen Vision] Frame grab error:', e);
          cleanup();
          resolve(null);
        }
      };

      video.onloadedmetadata = () => {
        video.play().then(() => {
          setTimeout(grab, 100);
        }).catch(() => {
          grab();
        });
      };

      setTimeout(() => grab(), 700);
    });
  };

  // Analyzes active screen with Gemini Multimodal Vision and speaks answer aloud
  const handleAnalyzeScreen = async (customPrompt?: string) => {
    if (!screenVisionRef.current.isSharing) {
      setIsLiveScreenOpen(true);
      setScreenVision((prev) => ({
        ...prev,
        error: 'Screen sharing is currently inactive. Tap "Start Sharing" to grant permission.',
      }));
      return;
    }

    const frame = await captureScreenFrameHelper();
    if (!frame) {
      setScreenVision((prev) => ({
        ...prev,
        error: 'Could not capture current screen frame. Check permission.',
      }));
      return;
    }

    const promptText =
      customPrompt ||
      (settings.language.startsWith('en')
        ? 'Analyze and explain what is visible on this screen in detail.'
        : 'Is screen par kya dikh raha hai? Vistaar se samjhao.');

    handleSendMessage(promptText, {
      type: 'screen',
      mimeType: 'image/jpeg',
      data: frame.base64,
      previewUrl: frame.dataUrl,
      name: `live_screen_${Date.now()}.jpg`,
      size: Math.round(frame.base64.length * 0.75),
      isLiveScreen: true,
    });
  };

  // Initialize Speech Recognition cleanly with Single Instance, Ref Guards & No Infinite Loops
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[SpeechRecognition] Web Speech API is not supported in this browser environment.');
      return;
    }

    // Stop and clean up any previous instance before creating a new one
    stopRecognitionCleanly(false);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (settings.language === 'hi-IN') {
        recognition.lang = 'hi-IN';
      } else if (settings.language === 'en-US') {
        recognition.lang = 'en-US';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        clearSpeechTimeouts();
        consecutiveVoiceErrorsRef.current = 0;
        isStartingRef.current = false;
        isRecognitionRunningRef.current = true;
        setIsListening(true);
        updateSpeechStatus('listening');
        setSpeechError(null);
        setAudioLevel(0.85);

        // Safety watchdog: max 15 seconds per single continuous turn
        maxListeningTimerRef.current = setTimeout(() => {
          if (isContinuousVoiceActiveRef.current && isRecognitionRunningRef.current) {
            try {
              recognition.stop();
            } catch (e) {}
          }
        }, 15000);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinalResult = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinalResult = true;
          }
        }
        const clean = transcript.trim();
        if (!clean) return;

        // Acoustic Echo Shield: Discard recognized input if it reflects recent speaker playback
        const now = Date.now();
        const lastSpoken = (lastAssistantSpokenTextRef.current || '').toLowerCase().replace(/[^a-z0-9\s]/gi, '');
        const cleanLower = clean.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
        if (
          now - lastAssistantSpokenTimeRef.current < 2500 &&
          lastSpoken &&
          cleanLower.length > 2 &&
          (lastSpoken.includes(cleanLower) || (cleanLower.length >= 8 && lastSpoken.startsWith(cleanLower)))
        ) {
          console.log('[Echo Shield] Filtered acoustic speaker feedback:', clean);
          return;
        }

        setInputPrompt(clean);
        setAudioLevel(0.9);

        // Immediate stop listening on "Ruk jao" / "Stop" / "Chup ho jao"
        const lower = clean.toLowerCase();
        if (
          lower.includes('ruk jao') ||
          lower === 'stop' ||
          lower.includes('chup ho jao') ||
          lower.includes('shant raho') ||
          lower.includes('shant ho jao')
        ) {
          triggerHaptic(25);
          isManualStopRef.current = true;
          setIsContinuousVoiceActive(false);
          isContinuousVoiceActiveRef.current = false;
          stopRecognitionCleanly(true);
          stopSpeaking();
          setInputPrompt('');
          updateSpeechStatus('idle');

          if (currentVoiceSessionRef.current) {
            currentVoiceSessionRef.current.transcripts.push({
              id: 'vt-' + Date.now() + '-user',
              sender: 'user',
              text: clean,
              timestamp: Date.now(),
            });
            currentVoiceSessionRef.current.transcripts.push({
              id: 'vt-' + (Date.now() + 1) + '-shadow',
              sender: 'shadow',
              text: 'Ji, main ruk gaya hoon.',
              timestamp: Date.now() + 1,
            });
            const durationSec = Math.round((Date.now() - currentVoiceSessionRef.current.startedAt) / 1000);
            const updated = appendVoiceSessionSafely({
              ...currentVoiceSessionRef.current,
              endedAt: Date.now(),
              durationSeconds: durationSec,
              summary: currentVoiceSessionRef.current.transcripts[0]?.text?.slice(0, 80),
            });
            setVoiceSessions(updated);
          }

          setMessages((prev) => [
            ...prev,
            {
              id: 'user-' + Date.now(),
              sender: 'user',
              text: clean,
              timestamp: Date.now(),
            },
            {
              id: 'shadow-' + Date.now(),
              sender: 'shadow',
              text: 'Ji, main ruk gaya hoon.',
              timestamp: Date.now(),
            },
          ]);
          return;
        }

        // Dedicated silence detection timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Feature: Wake Word Detection ("Hey Shadow" / configured phrase)
        const targetWakePhrase = (settings.wakeWordPhrase || 'Hey Shadow').toLowerCase().trim();
        const isWakeWordMatch =
          lower.includes(targetWakePhrase) ||
          lower.includes('hey shadow') ||
          lower.includes('shadow') ||
          lower.includes('sun shadow') ||
          lower.includes('suno shadow') ||
          lower.includes('namaste shadow');

        if (
          settings.wakeWordEnabled !== false &&
          isWakeWordMatch &&
          speechStatusRef.current !== 'thinking' &&
          speechStatusRef.current !== 'speaking' &&
          !isSpeaking &&
          !isLoading
        ) {
          if (!isContinuousVoiceActiveRef.current) {
            playWakeChime();
            setWakeWordIndicator(`✨ "${settings.wakeWordPhrase || 'Hey Shadow'}" Detected!`);
            if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
            wakeWordTimeoutRef.current = setTimeout(() => setWakeWordIndicator(null), 3500);

            const cleanPattern = new RegExp(
              `^(hey\\s+shadow|${targetWakePhrase}|sun\\s+shadow|suno\\s+shadow|namaste\\s+shadow|shadow)[,\\s:]*`,
              'i'
            );
            const commandAfterWake = clean.replace(cleanPattern, '').trim();

            if (commandAfterWake.length > 2) {
              updateSpeechStatus('thinking');
              stopRecognitionCleanly(false);
              handleSendMessageRef.current(commandAfterWake);
              return;
            } else {
              setIsVoiceAssistantOpen(true);
              setIsContinuousVoiceActive(true);
              isContinuousVoiceActiveRef.current = true;
              isManualStopRef.current = false;
              if (!currentVoiceSessionRef.current) {
                currentVoiceSessionRef.current = {
                  id: 'voice-session-' + Date.now(),
                  startedAt: Date.now(),
                  transcripts: [],
                  language: settings.language,
                };
              }
              updateSpeechStatus('speaking');
              stopRecognitionCleanly(false);
              const greetingPrompt = settings.language.startsWith('en')
                ? "Yes, I'm listening! How can I help you?"
                : "Ji, kahiye, main sun raha hoon.";
              speakText(greetingPrompt);
              return;
            }
          }
        }

        // When speech finishes or user pauses, auto-send to AI with visual thinking status
        const dispatchCommand = () => {
          if (!clean) return;
          updateSpeechStatus('thinking');
          stopRecognitionCleanly(false);
          handleSendMessageRef.current(clean);
        };

        if (isFinalResult) {
          silenceTimerRef.current = setTimeout(dispatchCommand, 450);
        } else {
          silenceTimerRef.current = setTimeout(dispatchCommand, 1400);
        }
      };

      recognition.onerror = (event: any) => {
        isStartingRef.current = false;
        clearSpeechTimeouts();

        if (event.error === 'no-speech') {
          // Normal pause in speech
          if (
            isContinuousVoiceActiveRef.current &&
            !isMicMutedRef.current &&
            !isManualStopRef.current &&
            isVoiceAssistantOpenRef.current &&
            speechStatusRef.current !== 'thinking' &&
            speechStatusRef.current !== 'speaking'
          ) {
            // Let onend handle the single, clean restart
            return;
          }
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          updateSpeechStatus('idle');
          return;
        }

        if (event.error === 'aborted') {
          // Expected on programmatic abort
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          return;
        }

        console.warn('[SpeechRecognition] error:', event.error);
        isRecognitionRunningRef.current = false;
        setIsListening(false);

        consecutiveVoiceErrorsRef.current += 1;
        if (consecutiveVoiceErrorsRef.current >= 2) {
          isManualStopRef.current = true;
          setIsContinuousVoiceActive(false);
          isContinuousVoiceActiveRef.current = false;
          updateSpeechStatus('idle');
          setSpeechError('Microphone session ended. Tap Reconnect to restart.');
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic in browser/phone.');
          isManualStopRef.current = true;
          setIsContinuousVoiceActive(false);
          isContinuousVoiceActiveRef.current = false;
          updateSpeechStatus('idle');
        } else {
          setSpeechError(`Voice notice: ${event.error}.`);
          updateSpeechStatus('idle');
        }
        setTimeout(() => setSpeechError(null), 5000);
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        setAudioLevel(0);
        clearSpeechTimeouts();

        // 1. If user manually stopped or modal is closed, NEVER auto-restart!
        if (
          isManualStopRef.current ||
          !isContinuousVoiceActiveRef.current ||
          !isVoiceAssistantOpenRef.current
        ) {
          updateSpeechStatus('idle');
          return;
        }

        // 2. If AI is thinking or speaking, do NOT restart listening yet
        if (speechStatusRef.current === 'thinking' || speechStatusRef.current === 'speaking') {
          return;
        }

        // 3. Only if continuous voice assistant mode is active, modal open, and not muted:
        safelyResumeContinuousListening(400);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[SpeechRecognition] Initialization failed:', e);
    }

    return () => {
      clearSpeechTimeouts();
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      stopRecognitionCleanly(true);
      recognitionRef.current = null;
    };
  }, [settings.language]);

  // Voice Input Toggle for standard chat bar with strict manual toggle handling
  const toggleListening = () => {
    triggerHaptic(20);
    if (!recognitionRef.current) {
      setSpeechError('Speech Recognition is not supported in this browser. You can type in the input box.');
      return;
    }

    if (isListening || speechStatus === 'listening' || isRecognitionRunningRef.current || isStartingRef.current) {
      // User tapped button to turn microphone OFF
      isManualStopRef.current = true;
      setIsContinuousVoiceActive(false);
      isContinuousVoiceActiveRef.current = false;
      stopRecognitionCleanly(true);
      updateSpeechStatus('idle');
    } else {
      // User tapped button to turn microphone ON
      isManualStopRef.current = false;
      setIsContinuousVoiceActive(false);
      isContinuousVoiceActiveRef.current = false;
      stopSpeaking();
      startListeningSafely();
    }
  };

  // Play base64 audio synthesized from Gemini TTS
  const playAudioBase64 = (base64Data: string, mimeType = 'audio/wav') => {
    try {
      if (audioElementRef.current) {
        try {
          audioElementRef.current.onended = null;
          audioElementRef.current.onerror = null;
          audioElementRef.current.pause();
        } catch (e) {}
      }
      const audio = new Audio(`data:${mimeType};base64,${base64Data}`);
      audioElementRef.current = audio;
      setIsSpeaking(true);
      updateSpeechStatus('speaking');

      audio.onended = () => {
        setIsSpeaking(false);
        audioElementRef.current = null;
        safelyResumeContinuousListening(350);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        audioElementRef.current = null;
        if (!isManualStopRef.current) {
          safelyResumeContinuousListening(350);
        } else {
          updateSpeechStatus('idle');
        }
      };

      audio.play().catch((err) => {
        console.warn('Audio play failed, falling back:', err);
        setIsSpeaking(false);
        if (!isManualStopRef.current) {
          safelyResumeContinuousListening(350);
        } else {
          updateSpeechStatus('idle');
        }
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
      setIsSpeaking(false);
      if (!isManualStopRef.current) {
        safelyResumeContinuousListening(350);
      } else {
        updateSpeechStatus('idle');
      }
    }
  };

  // Pure, 100% Free Browser-Native Text-To-Speech with Echo Prevention
  const speakText = (text: string) => {
    if (!settings.autoSpeak) {
      if (
        !isManualStopRef.current &&
        isVoiceAssistantOpenRef.current &&
        isContinuousVoiceActiveRef.current &&
        !isMicMutedRef.current
      ) {
        safelyResumeContinuousListening(700);
      } else {
        updateSpeechStatus('idle');
      }
      return;
    }

    // Immediately cancel any previous speech
    stopSpeaking();

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#+/g, '')
      .replace(/[_~[\]()]/g, ' ')
      .trim();

    if (!cleanText) {
      if (
        !isManualStopRef.current &&
        isVoiceAssistantOpenRef.current &&
        isContinuousVoiceActiveRef.current &&
        !isMicMutedRef.current
      ) {
        safelyResumeContinuousListening(700);
      } else {
        updateSpeechStatus('idle');
      }
      return;
    }

    // Record last spoken text and timestamp for acoustic echo rejection
    lastAssistantSpokenTextRef.current = cleanText;
    lastAssistantSpokenTimeRef.current = Date.now();

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(cleanText);
      activeUtteranceRef.current = utterance;
      utterance.rate = settings.speechRate || 1.0;
      utterance.pitch = settings.speechPitch || 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
      const indianEnglishVoice = voices.find((v) => v.lang === 'en-IN' || v.lang.startsWith('en'));

      if (settings.language === 'hi-IN' && hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
        utterance.lang = 'en-IN';
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        updateSpeechStatus('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        lastAssistantSpokenTimeRef.current = Date.now();
        activeUtteranceRef.current = null;
        if (
          !isManualStopRef.current &&
          isVoiceAssistantOpenRef.current &&
          isContinuousVoiceActiveRef.current &&
          !isMicMutedRef.current
        ) {
          safelyResumeContinuousListening(700);
        } else {
          updateSpeechStatus('idle');
        }
      };

      utterance.onerror = (event: any) => {
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
        if (
          event?.error !== 'canceled' &&
          event?.error !== 'interrupted' &&
          !isManualStopRef.current &&
          isVoiceAssistantOpenRef.current &&
          isContinuousVoiceActiveRef.current &&
          !isMicMutedRef.current
        ) {
          safelyResumeContinuousListening(700);
        } else {
          updateSpeechStatus('idle');
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('[SpeechSynthesis] speak error:', synthErr);
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
        updateSpeechStatus('idle');
      }
      return;
    }

    updateSpeechStatus('idle');
  };

  const stopSpeaking = () => {
    stopAllAudioSources(activeAudioSourcesRef, nextAudioStartTimeRef);
    if (audioElementRef.current) {
      try {
        audioElementRef.current.onended = null;
        audioElementRef.current.onerror = null;
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.src = '';
      } catch (e) {}
      audioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
          activeUtteranceRef.current.onstart = null;
          activeUtteranceRef.current = null;
        }
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
    setCurrentlyReadingMessageId(null);
    if (!isContinuousVoiceActiveRef.current || isManualStopRef.current) {
      updateSpeechStatus('idle');
    }
    if (liveWsRef.current && liveWsRef.current.readyState === WebSocket.OPEN) {
      try {
        liveWsRef.current.send(JSON.stringify({ type: 'interrupt' }));
      } catch (e) {}
    }
  };

  // Assistant Message Toolbar: Read Aloud toggle handler
  const handleToggleReadAloud = (msg: ChatMessage) => {
    if (currentlyReadingMessageId === msg.id) {
      stopSpeaking();
      setCurrentlyReadingMessageId(null);
    } else {
      stopSpeaking();
      if (!('speechSynthesis' in window)) {
        setSpeechError('Speech synthesis is not supported in this browser/device.');
        setCurrentlyReadingMessageId(null);
        return;
      }
      setCurrentlyReadingMessageId(msg.id);
      readAssistantMessageAloud(msg);
    }
  };

  const readAssistantMessageAloud = (msg: ChatMessage) => {
    try {
      window.speechSynthesis.cancel();
      const clean = extractCleanText(msg.text);
      if (!clean) {
        setCurrentlyReadingMessageId(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      activeUtteranceRef.current = utterance;
      utterance.rate = settings.speechRate || 1.0;
      utterance.pitch = settings.speechPitch || 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
      const indianEnglishVoice = voices.find((v) => v.lang === 'en-IN' || v.lang.startsWith('en'));

      if (settings.language === 'hi-IN' && hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
        utterance.lang = 'en-IN';
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        updateSpeechStatus('speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlyReadingMessageId(null);
        activeUtteranceRef.current = null;
        updateSpeechStatus('idle');
      };

      utterance.onerror = (ev: any) => {
        setIsSpeaking(false);
        setCurrentlyReadingMessageId(null);
        activeUtteranceRef.current = null;
        updateSpeechStatus('idle');
        if (ev?.error !== 'canceled' && ev?.error !== 'interrupted') {
          console.warn('[SpeechSynthesis] Read aloud error:', ev?.error);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.warn('[SpeechSynthesis] speak error:', err);
      setCurrentlyReadingMessageId(null);
      setIsSpeaking(false);
      updateSpeechStatus('idle');
    }
  };

  // Assistant Message Toolbar: Like / Dislike reaction toggle handler
  const handleToggleReaction = (messageId: string, reaction: 'like' | 'dislike') => {
    setMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id === messageId) {
          const nextReaction = m.reaction === reaction ? null : reaction;
          return { ...m, reaction: nextReaction };
        }
        return m;
      });
      saveMessagesSafely(updated);
      return updated;
    });
    triggerHaptic();
  };

  const handleShowFeedbackToast = (text: string) => {
    setActionToastMessage(text);
  };

  // Execute Safe Android Intent with pre-check package validation
  const executeIntent = (action: string, param?: string | null) => {
    // 1. Mandatory Pre-check validation for EVERY package before launching!
    const validation = validateIntentBeforeLaunch(action, param, settings.blockedPackages);
    if (!validation.allowed && action.toUpperCase() !== 'BLOCKED_PAYMENT_APP') {
      console.warn(`[Shadow AI Security] Pre-check blocked intent: ${action} (${param}). Reason: ${validation.blockedReason}`);
      setActiveSimulatedApp('blocked_payment');
      setSimulatedAppParam(validation.matchedIdentifier || param || action);
      const refusalVoice = `सुरक्षा चेतावनी: ${validation.matchedIdentifier || 'वित्तीय ऐप'} को सुरक्षा नीति के तहत ब्लॉक किया गया है।`;
      speakText(refusalVoice);
      return;
    }

    const upperAction = action.toUpperCase();

    if (upperAction === 'YOUTUBE') {
      setActiveSimulatedApp('youtube');
      setSimulatedAppParam(param || null);
    } else if (upperAction === 'INSTAGRAM') {
      setActiveSimulatedApp('instagram');
      setSimulatedAppParam(null);
    } else if (upperAction === 'WHATSAPP') {
      setActiveSimulatedApp('whatsapp');
      setSimulatedAppParam(param || null);
    } else if (upperAction === 'GALLERY') {
      setActiveSimulatedApp('gallery');
      setSimulatedAppParam(null);
    } else if (upperAction === 'CHROME' || upperAction === 'OPEN_WEBSITE') {
      const sanitized = validateAndSanitizeUrl(param || 'https://www.google.com');
      setActiveSimulatedApp('chrome');
      setSimulatedAppParam(sanitized.url);
    } else if (upperAction === 'OPEN_LIVE_SCREEN') {
      setIsLiveScreenOpen(true);
    } else if (upperAction === 'MAPS') {
      setActiveSimulatedApp('maps');
      setSimulatedAppParam(param || null);
    } else if (upperAction === 'SETTINGS') {
      setActiveSimulatedApp('settings');
      setSimulatedAppParam(param || null);
    } else if (upperAction === 'CAMERA') {
      setActiveSimulatedApp('camera');
      setSimulatedAppParam(null);
    } else if (upperAction === 'DIALER') {
      setActiveSimulatedApp('dialer');
      setSimulatedAppParam(param || null);
    } else if (upperAction === 'TORCH_ON') {
      setActiveSimulatedApp('torch');
      setSimulatedAppParam('on');
    } else if (upperAction === 'TORCH_OFF') {
      setActiveSimulatedApp('torch');
      setSimulatedAppParam('off');
    } else if (upperAction === 'BLOCKED_PAYMENT_APP') {
      setActiveSimulatedApp('blocked_payment');
      setSimulatedAppParam(param || 'UPI / Payment Application');
    } else if (upperAction === 'ENHANCE_PHOTO') {
      // Find latest user photo or attached media
      const latestImage = selectedMedia?.previewUrl || messages.slice().reverse().find((m) => m.media?.type === 'image')?.media?.url;
      setWorkflowInitialImage(latestImage);
      setImageWorkflowMode('enhance_photo');
      setIsImageWorkflowOpen(true);
    } else if (upperAction === 'CREATE_IMAGE') {
      setWorkflowInitialPrompt(param || '');
      setImageWorkflowMode('create_image');
      setIsImageWorkflowOpen(true);
    } else if (upperAction === 'ADD_NOTE') {
      const noteTitle = param ? (param.length > 25 ? param.substring(0, 25) + '...' : param) : 'Quick Voice Note';
      const newNote: NoteItem = {
        id: 'note-' + Date.now(),
        title: noteTitle,
        content: param || '',
        isReminder: false,
        createdAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    } else if (upperAction === 'SET_REMINDER') {
      const newReminder: NoteItem = {
        id: 'rem-' + Date.now(),
        title: param ? 'Reminder: ' + param : 'Voice Reminder',
        content: param || '',
        isReminder: true,
        reminderTime: '12:00',
        reminderDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
      };
      setNotes((prev) => [newReminder, ...prev]);
    } else if (upperAction === 'VOICE_OFF') {
      setSettings((prev) => ({ ...prev, autoSpeak: false }));
      stopSpeaking();
    } else if (upperAction === 'VOICE_ON') {
      setSettings((prev) => ({ ...prev, autoSpeak: true }));
    } else if (upperAction === 'STOP_LISTENING' || upperAction === 'APP_CLOSE') {
      isManualStopRef.current = true;
      setIsContinuousVoiceActive(false);
      isContinuousVoiceActiveRef.current = false;
      stopSpeaking();
      stopRecognitionCleanly(true);
      updateSpeechStatus('idle');
      if (upperAction === 'APP_CLOSE') {
        setIsVoiceAssistantOpen(false);
      }
    } else if (upperAction === 'SHADOW_LISTEN') {
      isManualStopRef.current = false;
      setIsContinuousVoiceActive(true);
      isContinuousVoiceActiveRef.current = true;
      setIsMicMuted(false);
      isMicMutedRef.current = false;
      safelyResumeContinuousListening(500);
    } else if (upperAction === 'LIVE_SCREEN' || upperAction === 'START_SCREEN_SHARE') {
      setIsLiveScreenOpen(true);
      if (!screenVisionRef.current.isSharing) {
        startScreenShare();
      }
    } else if (upperAction === 'STOP_SCREEN_SHARE') {
      stopScreenShare();
    }
  };

  const toggleVoiceAudio = () => {
    setSettings((prev) => {
      const nextState = !prev.autoSpeak;
      if (!nextState) stopSpeaking();
      return { ...prev, autoSpeak: nextState };
    });
  };

  // Handle User Message Submission with Exponential Backoff Retry & Package Pre-Check
  const handleSendMessage = async (
    textToSend?: string,
    overrideMedia?: MediaAttachment | null
  ) => {
    const text = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    let currentMedia = overrideMedia !== undefined ? overrideMedia : selectedMedia;

    // Feature 1: Live Screen Vision auto-frame capture if sharing is active & user asks about screen
    if (!currentMedia && screenVisionRef.current.isSharing) {
      const isScreenQuery = /\b(screen|dikha|dikh\s+raha|kya\s+hai|padh|read|button|open|kholo|app\s+khula|chal\s+raha|click)\b/i.test(text);
      if (isScreenQuery || isLiveScreenOpen) {
        const frame = await captureScreenFrameHelper();
        if (frame) {
          currentMedia = {
            type: 'screen',
            mimeType: 'image/jpeg',
            data: frame.base64,
            previewUrl: frame.dataUrl,
            name: `live_screen_${Date.now()}.jpg`,
            size: Math.round(frame.base64.length * 0.75),
            isLiveScreen: true,
          };
        }
      }
    }

    // Guard against empty submission or concurrent in-flight requests
    if ((!text && !currentMedia) || isLoading || isSendingRef.current) return;
    isSendingRef.current = true;

    // Abort any existing in-flight text request
    if (chatAbortControllerRef.current) {
      try {
        chatAbortControllerRef.current.abort();
      } catch (e) {}
    }
    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;

    // Safety timeout: 25 seconds
    const timeoutTimer = setTimeout(() => {
      try {
        abortController.abort();
      } catch (e) {}
    }, 25000);

    lastUserPromptRef.current = text;
    setSelectedMedia(null);
    setInputPrompt('');
    stopSpeaking();
    setMediaError(null);
    setIsPlusMenuOpen(false);
    setRetryNotice(null);

    const defaultText = currentMedia
      ? currentMedia.type === 'video'
        ? settings.language.startsWith('en')
          ? 'Analyze this video clip and describe what is happening.'
          : 'Is video ka vistaar se vishleshan karein aur batayein isme kya ho raha hai.'
        : currentMedia.type === 'file'
        ? 'Please examine this attached document and summarize its key insights.'
        : currentMedia.type === 'screen'
        ? settings.language.startsWith('en')
          ? 'Analyze and explain what is visible on this screen in detail.'
          : 'Is screen par kya dikh raha hai? Vistaar se samjhao.'
        : settings.language.startsWith('en')
        ? 'Analyze this image and explain what you see.'
        : 'Is photo me kya-kya dikh raha hai vistaar se batayein.'
      : '';

    triggerHaptic(20);
    const effectiveText = text || defaultText;
    lastUserPromptRef.current = effectiveText;

    // 1. Immediately append user message to chat UI
    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: effectiveText,
      timestamp: Date.now(),
      media: currentMedia
        ? {
            type: currentMedia.type,
            mimeType: currentMedia.mimeType,
            url: currentMedia.previewUrl,
            name: currentMedia.name,
            size: currentMedia.size,
            isLiveScreen: currentMedia.isLiveScreen,
          }
        : undefined,
    };

    // 2. Immediately create assistant response placeholder for real-time streaming
    const shadowMessageId = 'reply-' + Date.now();
    const shadowPlaceholder: ChatMessage = {
      id: shadowMessageId,
      sender: 'shadow',
      text: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, shadowPlaceholder]);
    setIsLoading(true);
    updateSpeechStatus('thinking');

    // Record user transcript in voice session if voice assistant was active
    if (isVoiceAssistantOpenRef.current || isContinuousVoiceActiveRef.current) {
      if (!currentVoiceSessionRef.current) {
        currentVoiceSessionRef.current = {
          id: 'voice-session-' + Date.now(),
          startedAt: Date.now(),
          transcripts: [],
          language: settings.language,
        };
      }
      currentVoiceSessionRef.current.transcripts.push({
        id: 'vt-' + Date.now() + '-user',
        sender: 'user',
        text: effectiveText,
        timestamp: Date.now(),
      });
    }

    let accumulatedText = '';
    let detectedAction: string | null = null;
    let detectedParam: string | null = null;
    let isStreamSuccessful = false;

    try {
      // 3. Initiate SSE Streaming Request to /api/gemini/stream
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveText,
          media: currentMedia
            ? {
                type: currentMedia.type,
                mimeType: currentMedia.mimeType,
                data: currentMedia.data,
                name: currentMedia.name,
                textContent: currentMedia.textContent,
                isLiveScreen: currentMedia.isLiveScreen,
              }
            : undefined,
          language: settings.language,
          history: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: (m.text || '').slice(0, 400),
          })),
        }),
        signal: abortController.signal,
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmedLine = part.trim();
            if (!trimmedLine.startsWith('data:')) continue;
            const jsonPayload = trimmedLine.replace(/^data:\s*/, '');
            try {
              const parsed = JSON.parse(jsonPayload);
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Live streaming state update: append token directly to UI
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === shadowMessageId ? { ...m, text: accumulatedText } : m
                  )
                );
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
              if (parsed.intentAction) detectedAction = parsed.intentAction;
              if (parsed.intentParam) detectedParam = parsed.intentParam;
              if (parsed.isError) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === shadowMessageId
                      ? {
                          ...m,
                          text: parsed.text || accumulatedText,
                          isError: true,
                          errorType: '503_OVERLOAD',
                        }
                      : m
                  )
                );
              }
            } catch (pErr) {
              // Ignore single partial chunk parse errors
            }
          }
        }
        if (accumulatedText.trim().length > 0) {
          isStreamSuccessful = true;
        }
      }

      // 4. Fallback to /api/gemini/chat if stream returned empty without throwing
      if (!isStreamSuccessful && !abortController.signal.aborted) {
        const chatRes = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: effectiveText,
            media: currentMedia
              ? {
                  type: currentMedia.type,
                  mimeType: currentMedia.mimeType,
                  data: currentMedia.data,
                  name: currentMedia.name,
                  textContent: currentMedia.textContent,
                  isLiveScreen: currentMedia.isLiveScreen,
                }
              : undefined,
            language: settings.language,
            history: messages.slice(-4).map((m) => ({
              sender: m.sender,
              text: (m.text || '').slice(0, 400),
            })),
          }),
          signal: abortController.signal,
        });

        const chatJson = await chatRes.json().catch(() => null);
        if (chatJson?.reply) {
          accumulatedText = chatJson.reply;
          detectedAction = chatJson.intentAction || detectedAction;
          detectedParam = chatJson.intentParam || detectedParam;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === shadowMessageId
                ? {
                    ...m,
                    text: accumulatedText,
                    isError: Boolean(chatJson.isOverloaded),
                    errorType: chatJson.isOverloaded ? '503_OVERLOAD' : undefined,
                  }
                : m
            )
          );
          isStreamSuccessful = true;
        }
      }

      // If still empty after fallback
      if (!isStreamSuccessful && !abortController.signal.aborted) {
        throw new Error('503_OVERLOAD');
      }

      // Process intents and security blocklist
      let effectiveAction = detectedAction;
      let effectiveParam = detectedParam;
      let blockedIdentifier: string | undefined = undefined;

      if (detectedAction) {
        const validation = validateIntentBeforeLaunch(detectedAction, detectedParam, settings.blockedPackages);
        if (!validation.allowed) {
          console.warn(`[Shadow AI Pre-Check] Payment package detected and blocked: ${detectedAction} (${detectedParam})`);
          effectiveAction = 'BLOCKED_PAYMENT_APP';
          blockedIdentifier = validation.matchedIdentifier || detectedParam || detectedAction;
          effectiveParam = blockedIdentifier;
        }
      }

      // Finalize the message with intent metadata
      setMessages((prev) =>
        prev.map((m) =>
          m.id === shadowMessageId
            ? {
                ...m,
                intentAction: effectiveAction,
                intentParam: effectiveParam,
                blockedPackage: blockedIdentifier,
              }
            : m
        )
      );

      // Record in voice session if active
      if (isVoiceAssistantOpenRef.current || isContinuousVoiceActiveRef.current) {
        currentVoiceSessionRef.current?.transcripts.push({
          id: 'vt-' + Date.now() + '-shadow',
          sender: 'shadow',
          text: accumulatedText,
          timestamp: Date.now(),
        });
        if (currentVoiceSessionRef.current) {
          const durationSec = Math.round((Date.now() - currentVoiceSessionRef.current.startedAt) / 1000);
          const updated = appendVoiceSessionSafely({
            ...currentVoiceSessionRef.current,
            durationSeconds: durationSec,
            summary: currentVoiceSessionRef.current.transcripts[0]?.text?.slice(0, 80),
          });
          setVoiceSessions(updated);
        }
      }

      if (settings.autoSpeak) {
        updateSpeechStatus('speaking');
        speakText(accumulatedText);
      } else {
        safelyResumeContinuousListening(700);
      }

      // Auto-execute intents for explicit commands
      const isExplicitCommand =
        effectiveAction === 'BLOCKED_PAYMENT_APP' ||
        /\b(kholo|open|launch|chalao|start|band\s+karo|turn\s+on|turn\s+off|call|dial|search|dikh|dikhao|banao|clear)\b/i.test(effectiveText);

      if (effectiveAction && isExplicitCommand) {
        if (effectiveAction === 'BLOCKED_PAYMENT_APP') {
          executeIntent('BLOCKED_PAYMENT_APP', effectiveParam);
        } else if (settings.requireSensitiveConfirmation) {
          setConfirmDialogState({
            isOpen: true,
            title: 'Action Confirmation (सुरक्षा पुष्टि)',
            message: `Shadow AI wants to execute: ${effectiveAction} ${effectiveParam ? `("${effectiveParam}")` : ''}. Do you want to proceed?`,
            confirmLabel: 'Proceed (जारी रखें)',
            action: () => executeIntent(effectiveAction!, effectiveParam),
          });
        } else {
          executeIntent(effectiveAction, effectiveParam);
        }
      }
    } catch (err: any) {
      console.warn('[Shadow AI Chat] Error:', err);
      setRetryNotice(null);
      updateSpeechStatus('idle');

      if (err?.name === 'AbortError') {
        // User clicked "Ruk Jao" or stream timed out
        if (accumulatedText.trim().length === 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === shadowMessageId
                ? {
                    ...m,
                    text: 'Shadow AI: जनरेट करना रोक दिया गया (Cancelled).',
                    isError: false,
                  }
                : m
            )
          );
        }
      } else {
        const friendlyHindiReply =
          'Shadow AI: AI सर्वर पर इस समय बहुत अधिक ट्रैफिक (High Demand) है। कृपया नीचे "Retry" बटन दबाएं या कुछ पलों बाद पुनः प्रयास करें।';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === shadowMessageId
              ? {
                  ...m,
                  text: friendlyHindiReply,
                  isError: true,
                  errorType: '503_OVERLOAD',
                }
              : m
          )
        );
        speakText(friendlyHindiReply);
      }
    } finally {
      // 100% GUARANTEED CLEANUP: Always clears loading state so chat is NEVER stuck in "Generating"!
      clearTimeout(timeoutTimer);
      setIsLoading(false);
      isSendingRef.current = false;
      chatAbortControllerRef.current = null;
      setRetryNotice(null);
      updateSpeechStatus('idle');
      if (!settings.autoSpeak) {
        safelyResumeContinuousListening(350);
      }
    }
  };

  // Keep ref up to date for SpeechRecognizer callback
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  const handleClearHistory = () => {
    triggerHaptic([30, 40, 30]);
    setConfirmDialogState({
      isOpen: true,
      title: 'Clear Chat History',
      message: 'Are you sure you want to clear all conversation messages? This cannot be undone.',
      confirmLabel: 'Clear All',
      isDestructive: true,
      action: () => {
        setMessages([INITIAL_GREETING]);
      },
    });
  };

  const formatMessageTime = (ts: any) => {
    try {
      const num = Number(ts);
      const d = !isNaN(num) && num > 0 ? new Date(num) : new Date();
      return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const visibleMessages = searchFilter
    ? messages.filter((m) => m.text.toLowerCase().includes(searchFilter.toLowerCase()))
    : messages;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Hidden file pickers for Plus menu */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/3gpp,video/x-matroska"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file, 'video');
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv,.json,.md,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file, 'file');
          e.target.value = '';
        }}
      />

      {/* Top Application Header */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#060b18]/90 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2.5">
          <ShadowLogo size={28} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-wider font-display bg-gradient-to-r from-purple-400 via-cyan-300 to-white bg-clip-text text-transparent">
                SHADOW AI
              </h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                AI AGENT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 3.8 Flash • Hindi & English Voice</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Feature 1: Live Screen Vision Button */}
          <button
            onClick={() => setIsLiveScreenOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              screenVision.isSharing
                ? 'bg-red-950/90 border-red-500/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-gradient-to-r from-cyan-950/80 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/70 border-cyan-500/40 text-cyan-300 hover:text-white'
            }`}
            title="Open Live Screen Vision (Android MediaProjection / Screen Sharing)"
          >
            {screenVision.isSharing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Live Screen</span>
                <span className="text-[9px] px-1 rounded bg-red-900 border border-red-500/40 text-red-200 font-mono">REC</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Screen</span>
              </>
            )}
          </button>

          {/* Voice Assistant Orb Launch Button */}
          <button
            onClick={() => {
              setIsVoiceAssistantOpen(true);
              handleStartContinuousConversation();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-cyan-400/50 transition-all active:scale-95 animate-pulse"
            title="Open Futuristic Voice Assistant Orb (Live Voice)"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden sm:inline">Voice Assistant</span>
            <span className="sm:hidden font-mono">Voice</span>
          </button>

          {/* Feature 2: Wake Word Assistant Status & Mic Mute Pill */}
          {settings.wakeWordEnabled !== false && (
            <div className="hidden md:flex items-center rounded-xl bg-slate-900/90 border border-slate-800 text-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsWakeWordModalOpen(true)}
                className="px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 hover:text-white transition-colors"
                title={`Wake Word: "${settings.wakeWordPhrase || 'Hey Shadow'}" • Tap for details`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`} />
                <span>"{settings.wakeWordPhrase || 'Hey Shadow'}"</span>
              </button>
              <button
                type="button"
                onClick={handleToggleMicMute}
                className={`p-1.5 border-l border-slate-800 transition-colors ${
                  isMicMuted
                    ? 'text-red-400 hover:text-red-300 bg-red-950/30'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                title={isMicMuted ? 'Microphone is muted (Unmute karein)' : 'Mute microphone (Mic mute karein)'}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Voice Output Mute / Unmute Toggle */}
          <button
            onClick={toggleVoiceAudio}
            className={`p-2 rounded-xl border transition-all ${
              settings.autoSpeak
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 hover:text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={settings.autoSpeak ? 'Voice output active (Mute karein)' : 'Voice muted (Unmute karein)'}
          >
            {settings.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Install on Android Phone Direct Button */}
          {!isAppInstalled && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              title="Install Shadow AI directly on your Android phone (PWA)"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Install Android App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {/* Android Project Hub Modal Button */}
          <button
            onClick={() => setIsProjectHubOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Download complete Android Kotlin project & APK instructions"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Android Studio & APK</span>
            <span className="sm:hidden">APK Hub</span>
          </button>

          {/* Notes & Reminders */}
          <button
            onClick={() => setIsNotesOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
            title="Notes and Reminders"
          >
            <FileText className="w-4 h-4" />
            {notes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[10px] font-bold text-white flex items-center justify-center">
                {notes.length}
              </span>
            )}
          </button>

          {/* Voice History Modal Trigger */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setIsVoiceHistoryOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-medium transition-all active:scale-95"
            title="Review past voice-only conversation transcripts"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-mono text-[11px]">Voice History</span>
            {voiceSessions.length > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                {voiceSessions.length}
              </span>
            )}
          </button>

          {/* Dynamic Device Battery Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono select-none"
            title={`Device Battery: ${batteryState.level}% ${batteryState.charging ? '(Charging)' : ''}`}
          >
            {batteryState.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : batteryState.level <= 20 ? (
              <BatteryWarning className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            ) : (
              <Battery className={`w-3.5 h-3.5 ${batteryState.level > 50 ? 'text-cyan-400' : 'text-amber-400'}`} />
            )}
            <span
              className={`font-bold text-[11px] ${
                batteryState.charging
                  ? 'text-emerald-300'
                  : batteryState.level <= 20
                  ? 'text-red-400'
                  : 'text-slate-200'
              }`}
            >
              {batteryState.level}%
            </span>
          </div>

          {/* Settings Modal */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="App Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden relative">
        <div
          className={`w-full h-full flex flex-col transition-all duration-300 ${
            viewMode === 'phone'
              ? 'max-w-md sm:max-h-[860px] sm:rounded-3xl sm:border sm:border-purple-500/30 sm:shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-[#050814] overflow-hidden'
              : 'max-w-4xl bg-[#050814]'
          }`}
        >
          {/* Phone Frame Status Bar (in Phone view) */}
          <div className="h-6 bg-[#030611] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/60 select-none">
            <span className="text-cyan-400 font-bold">SHADOW OS</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-300">5G CyberNet</span>
              <div className="flex items-center gap-1 text-[10px]">
                {batteryState.charging ? (
                  <BatteryCharging className="w-3 h-3 text-emerald-400 animate-pulse" />
                ) : batteryState.level <= 20 ? (
                  <BatteryWarning className="w-3 h-3 text-red-400" />
                ) : (
                  <Battery className="w-3 h-3 text-cyan-400" />
                )}
                <span className={batteryState.charging ? 'text-emerald-300' : batteryState.level <= 20 ? 'text-red-400' : 'text-slate-300'}>
                  {batteryState.level}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Voice Bar with Natural Voice Status & Indian Voice Commands */}
          <div className="px-3 py-2 bg-[#080d1e] border-b border-slate-800 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Commands:</span>
              </span>

              {[
                { label: 'Tumko kisne banaya?', icon: '⚡', action: 'CREATOR' },
                { label: 'Live Screen', icon: '🖥️', action: 'LIVE_SCREEN' },
                { label: 'YouTube kholo', icon: '📺', action: 'YOUTUBE' },
                { label: 'Instagram kholo', icon: '📷', action: 'INSTAGRAM' },
                { label: 'WhatsApp kholo', icon: '💬', action: 'WHATSAPP' },
                { label: 'Photo clear kar do', icon: '✨', action: 'ENHANCE_PHOTO' },
                { label: 'Create Image', icon: '🎨', action: 'CREATE_IMAGE' },
                { label: 'Torch chalao', icon: '🔦', action: 'TORCH_ON' },
                { label: 'Settings kholo', icon: '⚙️', action: 'SETTINGS' },
              ].map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    if (cmd.action === 'LIVE_SCREEN') {
                      setIsLiveScreenOpen(true);
                    } else {
                      handleSendMessage(cmd.label);
                    }
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-cyan-950/70 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 shrink-0 transition-all flex items-center gap-1"
                >
                  <span>{cmd.icon}</span>
                  <span>{cmd.label}</span>
                </button>
              ))}
            </div>

            {/* Clear History Button */}
            <button
              onClick={handleClearHistory}
              className="p-1 text-slate-400 hover:text-red-400 transition-colors shrink-0"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conversation History Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 relative scroll-smooth">
            {visibleMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white rounded-br-none border border-purple-400/40'
                        : msg.isError
                        ? 'bg-red-950/60 text-red-200 rounded-bl-none border border-red-500/50'
                        : 'bg-[#0f172a] text-slate-200 rounded-bl-none border border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    {/* Media Attachments Preview */}
                    {msg.media && (
                      <div className="mb-2.5 rounded-xl overflow-hidden bg-black/80 border border-slate-700">
                        {msg.media.type === 'video' ? (
                          msg.media.url && msg.media.url.trim() !== '' ? (
                            <div>
                              <video
                                src={msg.media.url}
                                controls
                                className="w-full max-h-60 rounded-t-xl bg-black"
                                playsInline
                              />
                              <div className="p-1.5 bg-black/90 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Film className="w-3 h-3" />
                                  <span>VIDEO ATTACHMENT</span>
                                </span>
                                <span>{msg.media.name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-black/90 flex items-center gap-2 text-xs text-amber-300 font-mono">
                              <Film className="w-4 h-4 text-amber-400" />
                              <span>[Video: {msg.media.name || 'Attached Clip'}]</span>
                            </div>
                          )
                        ) : msg.media.type === 'file' ? (
                          <div className="p-3 bg-purple-950/40 flex items-center gap-2.5 text-xs">
                            <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-white truncate">{msg.media.name}</p>
                              <p className="text-[10px] text-slate-400">{msg.media.mimeType}</p>
                            </div>
                          </div>
                        ) : msg.media.url && msg.media.url.trim() !== '' ? (
                          <div className="relative group">
                            <img
                              src={msg.media.url}
                              alt={msg.media.name || 'Attached photo'}
                              className="w-full max-h-64 object-cover rounded-t-xl cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => setExpandedMediaUrl(msg.media!.url || null)}
                            />
                            <div className="p-1.5 bg-black/90 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                              <span className="flex items-center gap-1 text-cyan-400">
                                <ImageIcon className="w-3 h-3" />
                                <span>PHOTO ATTACHMENT</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (msg.media?.url) {
                                      setWorkflowInitialImage(msg.media.url);
                                      setImageWorkflowMode('enhance_photo');
                                      setIsImageWorkflowOpen(true);
                                    }
                                  }}
                                  className="text-purple-300 hover:text-white underline text-[10px] flex items-center gap-1"
                                >
                                  <Wand2 className="w-2.5 h-2.5 text-purple-400" />
                                  <span>Clear Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedMediaUrl(msg.media!.url || null)}
                                  className="text-cyan-300 hover:text-white underline text-[10px] flex items-center gap-1"
                                >
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Expand</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-black/90 flex items-center gap-2 text-xs text-cyan-300 font-mono">
                            <ImageIcon className="w-4 h-4 text-cyan-400" />
                            <span>[Photo: {msg.media.name || 'Attached Image'}]</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Generated Image Card */}
                    {msg.generatedImage && (
                      msg.generatedImage.url && msg.generatedImage.url.trim() !== '' ? (
                        <div className="mb-2.5 rounded-xl overflow-hidden bg-black/90 border border-cyan-500/50 shadow-xl">
                          <img
                            src={msg.generatedImage.url}
                            alt={msg.generatedImage.prompt}
                            className="w-full max-h-64 object-cover rounded-t-xl"
                          />
                          <div className="p-2 bg-slate-900 flex items-center justify-between text-[10px]">
                            <span className="text-cyan-300 truncate max-w-[150px]">
                              🎨 {msg.generatedImage.prompt}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (msg.generatedImage?.url) {
                                    const a = document.createElement('a');
                                    a.href = msg.generatedImage.url;
                                    a.download = `shadow-image-${Date.now()}.png`;
                                    a.click();
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1"
                              >
                                <Download className="w-2.5 h-2.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => {
                                  setWorkflowInitialPrompt(msg.generatedImage!.prompt);
                                  setImageWorkflowMode('create_image');
                                  setIsImageWorkflowOpen(true);
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-900 hover:bg-cyan-800 text-cyan-200 flex items-center gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Regenerate</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2.5 p-2.5 bg-slate-900/90 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-mono flex items-center justify-between">
                          <span>🎨 Image prompt: "{msg.generatedImage.prompt}"</span>
                          <button
                            onClick={() => {
                              setWorkflowInitialPrompt(msg.generatedImage!.prompt);
                              setImageWorkflowMode('create_image');
                              setIsImageWorkflowOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-900 text-cyan-200 text-[10px]"
                          >
                            Generate
                          </button>
                        </div>
                      )
                    )}

                    {/* Enhanced Image Card */}
                    {msg.enhancedImage && (
                      <div className="mb-2.5 rounded-xl overflow-hidden bg-black/90 border border-purple-500/50 shadow-xl p-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">Original</span>
                            {msg.enhancedImage.originalUrl && msg.enhancedImage.originalUrl.trim() !== '' ? (
                              <img src={msg.enhancedImage.originalUrl} alt="Original" className="h-28 w-full object-cover rounded-lg" />
                            ) : (
                              <div className="h-28 w-full bg-slate-900 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-mono">
                                Original Photo
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">Enhanced Clarity</span>
                            {msg.enhancedImage.enhancedUrl && msg.enhancedImage.enhancedUrl.trim() !== '' ? (
                              <img src={msg.enhancedImage.enhancedUrl} alt="Enhanced" className="h-28 w-full object-cover rounded-lg border border-cyan-500/50" />
                            ) : (
                              <div className="h-28 w-full bg-slate-900 rounded-lg flex items-center justify-center text-[10px] text-cyan-500 font-mono">
                                Enhanced Photo
                              </div>
                            )}
                          </div>
                        </div>
                        {msg.enhancedImage.enhancedUrl && msg.enhancedImage.enhancedUrl.trim() !== '' && (
                          <button
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = msg.enhancedImage!.enhancedUrl!;
                              a.download = `shadow-enhanced-${Date.now()}.jpg`;
                              a.click();
                            }}
                            className="w-full py-1 text-[11px] bg-purple-900/60 hover:bg-purple-800 rounded-lg text-purple-200 flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save Enhanced Photo</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.text ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : isLoading && !isUser ? (
                      <div className="flex items-center gap-2 text-cyan-300 py-1 font-mono text-xs">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>Shadow AI सोच रहा है... (Thinking...)</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* 503 High Demand Retry Action Button */}
                    {(msg.errorType === '503_OVERLOAD' || msg.isError) && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/40 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1 font-mono">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>सर्वर व्यस्त (High Traffic)</span>
                        </span>
                        <button
                          onClick={() => {
                            const lastPrompt =
                              lastUserPromptRef.current ||
                              messages.slice().reverse().find((m) => m.sender === 'user')?.text ||
                              'Namaste';
                            handleSendMessage(lastPrompt);
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>पुनः प्रयास करें (Retry)</span>
                        </button>
                      </div>
                    )}

                    {/* Blocked Financial App Warning Card */}
                    {msg.blockedPackage && (
                      <div className="mt-2.5 pt-2 border-t border-red-500/40 flex items-center justify-between">
                        <span className="text-[10px] text-red-300 font-mono flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          <span>Blocked: {msg.blockedPackage}</span>
                        </span>
                        <button
                          onClick={() => {
                            setActiveSimulatedApp('blocked_payment');
                            setSimulatedAppParam(msg.blockedPackage || null);
                          }}
                          className="text-[10px] text-red-300 underline font-semibold"
                        >
                          Security Info
                        </button>
                      </div>
                    )}

                    {/* Intent Trigger & User-Initiated Website/App Action */}
                    {msg.intentAction && msg.intentAction !== 'BLOCKED_PAYMENT_APP' && (() => {
                      const isWebIntent = ['OPEN_WEBSITE', 'CHROME', 'YOUTUBE', 'MAPS'].includes(msg.intentAction);
                      const rawTarget = msg.intentAction === 'YOUTUBE'
                        ? (msg.intentParam ? `https://www.youtube.com/results?search_query=${encodeURIComponent(msg.intentParam)}` : 'https://www.youtube.com')
                        : msg.intentAction === 'MAPS'
                        ? (msg.intentParam ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.intentParam)}` : 'https://www.google.com/maps')
                        : (msg.intentParam || 'https://www.google.com');
                      const urlData = isWebIntent ? validateAndSanitizeUrl(rawTarget) : null;
                      const isOpenScreen = msg.intentAction === 'OPEN_LIVE_SCREEN';

                      return (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                              <CheckCircle className="w-3 h-3" />
                              Intent: {msg.intentAction}
                            </span>
                            <button
                              onClick={() => executeIntent(msg.intentAction!, msg.intentParam)}
                              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline"
                            >
                              Simulate in Android
                            </button>
                          </div>

                          {/* Direct User-Initiated Safe Web Action */}
                          {urlData?.isValid && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <a
                                href={urlData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Destination ({urlData.domain})</span>
                              </a>
                            </div>
                          )}

                          {/* Direct User-Initiated Screen Sharing Action */}
                          {isOpenScreen && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                onClick={() => setIsLiveScreenOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                              >
                                <Monitor className="w-3.5 h-3.5" />
                                <span>Start Live Screen Vision</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 opacity-70">
                      <span>{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  </div>

                  {/* Action Toolbar directly below every AI response */}
                  {!isUser && msg.text.trim() !== '' && (
                    <AssistantMessageToolbar
                      message={msg}
                      isSpeaking={currentlyReadingMessageId === msg.id}
                      onToggleSpeak={handleToggleReadAloud}
                      reaction={msg.reaction}
                      onToggleReaction={handleToggleReaction}
                      onShowFeedbackToast={handleShowFeedbackToast}
                    />
                  )}
                </div>
              );
            })}

            {/* Visual Thinking & Loading Status Indicator */}
            {(isLoading || speechStatus === 'thinking' || retryNotice) && (
              <div className="flex items-center gap-2.5 text-xs text-amber-300 font-mono py-2 pl-2 animate-pulse bg-amber-950/20 rounded-xl px-3 border border-amber-500/20 max-w-md">
                <Brain className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <span className="truncate">
                  {retryNotice || 'Shadow AI सोच रहा है... (Thinking & Processing command...)'}
                </span>
              </div>
            )}

            {/* Error Message Toast */}
            {speechError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between animate-in fade-in">
                <span>{speechError}</span>
                <button onClick={() => setSpeechError(null)} className="text-red-300 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Visualizer HUD with Thinking Mode Support */}
          {(isListening || isSpeaking || speechStatus === 'thinking') && (
            <div className="px-4 pb-2 z-20">
              <VoiceVisualizer
                mode={
                  speechStatus === 'thinking'
                    ? 'thinking'
                    : isListening
                    ? 'listening'
                    : isSpeaking
                    ? 'speaking'
                    : 'idle'
                }
                audioLevel={audioLevel}
                label={
                  speechStatus === 'thinking'
                    ? 'Shadow AI सोच रहा है... (Thinking...)'
                    : isListening
                    ? settings.language === 'hi-IN'
                      ? 'Listening in Hindi (Sun raha hoon... "Ruk jao" bolein)'
                      : 'Listening (Mic Active... Say "Ruk jao" to cancel)'
                    : 'Shadow AI Speaking...'
                }
                onCancel={() => {
                  isManualStopRef.current = true;
                  setIsContinuousVoiceActive(false);
                  isContinuousVoiceActiveRef.current = false;
                  stopSpeaking();
                  stopRecognitionCleanly(true);
                  updateSpeechStatus('idle');
                  setIsLoading(false);
                }}
              />
            </div>
          )}

          {/* ChatGPT-Inspired Bottom Rounded Composer */}
          <div className="p-3 bg-[#050a16] border-t border-slate-800/80 z-20 relative">
            {/* Visual Thinking & Backoff Retry Status Banner */}
            {(speechStatus === 'thinking' || retryNotice) && (
              <div className="mx-2 mb-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/60 to-cyan-950/40 border border-amber-500/40 backdrop-blur-md flex items-center justify-between text-xs text-amber-200 animate-pulse">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-semibold font-mono text-[11px] tracking-wide">
                    {retryNotice || 'Shadow AI सोच रहा है... (Thinking & Processing command...)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(false);
                    setSpeechStatus('idle');
                    setRetryNotice(null);
                    stopSpeaking();
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white transition-all font-mono"
                >
                  Ruk Jao
                </button>
              </div>
            )}

            {/* Selected Media Preview Tray */}
            {selectedMedia && (
              <MediaPreviewTray
                media={selectedMedia}
                onRemove={() => setSelectedMedia(null)}
                onSelectPrompt={(promptText) => setInputPrompt(promptText)}
                uploadProgress={uploadProgress}
                isProcessing={isLoading}
              />
            )}

            {/* Media Error Notification */}
            {mediaError && (
              <div className="mx-2 mb-2 p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-between text-xs text-red-200 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{mediaError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaError(null)}
                  className="p-1 text-red-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Floating Plus (+) Menu */}
            {isPlusMenuOpen && (
              <div
                ref={plusMenuRef}
                className="absolute bottom-20 left-4 z-40 w-64 bg-[#0a1124] border border-cyan-500/40 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-1"
              >
                <div className="px-3 py-1.5 text-[10px] font-mono text-cyan-400 border-b border-slate-800 uppercase tracking-wider">
                  Shadow Plus Actions
                </div>

                {/* Upload Photo from Gallery */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    photoInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Upload Photo</p>
                    <p className="text-[10px] text-slate-400">From phone gallery</p>
                  </div>
                </button>

                {/* Take Photo with Camera */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsCameraModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-purple-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Take Photo</p>
                    <p className="text-[10px] text-slate-400">Camera viewfinder</p>
                  </div>
                </button>

                {/* Upload Video from Gallery */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    videoInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-amber-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Upload Video</p>
                    <p className="text-[10px] text-slate-400">From gallery</p>
                  </div>
                </button>

                {/* Attach File (Document, Code, PDF) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-emerald-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Attach File</p>
                    <p className="text-[10px] text-slate-400">PDF, TXT, CSV, Code</p>
                  </div>
                </button>

                {/* Create Image (AI Image Generator) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setImageWorkflowMode('create_image');
                    setIsImageWorkflowOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-pink-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Create Image</p>
                    <p className="text-[10px] text-slate-400">AI Image Generator</p>
                  </div>
                </button>

                {/* Live Screen Vision (Android MediaProjection) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsLiveScreenOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-800/70 flex items-center gap-2.5 text-xs text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Live Screen Vision</p>
                    <p className="text-[10px] text-slate-400">Android MediaProjection</p>
                  </div>
                </button>
              </div>
            )}

            {/* Feature 1: Persistent Live Screen Sharing Active Status Bar */}
            {screenVision.isSharing && (
              <div className="flex items-center justify-between px-3.5 py-1.5 mb-2 rounded-2xl bg-[#14060c]/90 border border-red-500/60 text-xs text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="font-mono font-bold text-[11px] text-red-300 flex items-center gap-1">
                    <span>LIVE SCREEN ACTIVE</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-red-950 border border-red-600/40 text-red-400 font-mono">REC</span>
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    • AI Can See Visible Apps & Text
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeScreen()}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Analyze Screen</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopScreenShare}
                    className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow"
                  >
                    <StopCircle className="w-3 h-3" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            )}

            {/* Feature 2: Floating Wake Word Detected Toast */}
            {wakeWordIndicator && (
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 mb-2 rounded-2xl bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.4)] text-cyan-200 font-bold text-xs animate-in fade-in slide-in-from-top-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span>{wakeWordIndicator}</span>
              </div>
            )}

            {/* Rounded Bottom Message Composer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-[#0c1326] border border-slate-700/80 focus-within:border-cyan-500/80 rounded-3xl p-1.5 shadow-lg transition-all"
            >
              {/* Plus (+) Button */}
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isPlusMenuOpen
                    ? 'bg-cyan-500 text-black rotate-45'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white'
                }`}
                title="Plus Actions: Photo, Camera, Video, File, Create Image"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              {/* Text Input with Placeholder "Ask Shadow AI..." */}
              <input
                type="text"
                placeholder={
                  selectedMedia
                    ? selectedMedia.type === 'video'
                      ? 'Ask question about this video (Hindi/English)...'
                      : selectedMedia.type === 'file'
                      ? 'Ask about this document...'
                      : 'Ask about this photo or say "Photo clear kar do"...'
                    : 'Ask Shadow AI...'
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-2 min-w-0"
              />

              {/* Voice Orb Assistant Mode Button */}
              <button
                type="button"
                onClick={() => {
                  setIsVoiceAssistantOpen(true);
                  handleStartContinuousConversation();
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-cyan-300 hover:text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] active:scale-95"
                title="Open Voice Assistant Orb Mode"
              >
                <Radio className="w-4 h-4 animate-pulse" />
              </button>

              {/* Microphone Button (Hindi & English Voice Input) */}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300'
                }`}
                title={isListening ? 'Stop Listening (या "Ruk jao" bolein)' : 'Start Voice Input (Hindi & English)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputPrompt.trim() && !selectedMedia) || isLoading}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  inputPrompt.trim() || selectedMedia
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-md active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>

          {/* Futuristic Android Navigation Bar: Chat, Camera, Screen, Voice, Settings */}
          <nav className="h-13 bg-[#030611] border-t border-slate-800/80 px-2 flex items-center justify-around z-20 select-none shrink-0">
            {/* 1. Chat */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Chat View"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-tight font-semibold">Chat</span>
            </button>

            {/* 2. Camera */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setIsCameraModalOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-slate-400 hover:text-purple-300 transition-colors"
              title="Camera Viewfinder"
            >
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-tight">Camera</span>
            </button>

            {/* 3. Screen */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setIsLiveScreenOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Screen Vision"
            >
              <Monitor className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-tight">Screen</span>
            </button>

            {/* 4. Voice */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setIsVoiceAssistantOpen(true);
                handleStartContinuousConversation();
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-slate-400 hover:text-amber-300 transition-colors"
              title="Live Voice Assistant"
            >
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-tight">Voice</span>
            </button>

            {/* 5. Settings */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setIsSettingsOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-slate-400 hover:text-white transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="text-[10px] font-mono tracking-tight">Settings</span>
            </button>
          </nav>
        </div>
      </main>

      {/* Floating Action Feedback Toast */}
      {actionToastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-purple-500/50 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{actionToastMessage}</span>
        </div>
      )}

      {/* Simulated Android Apps Modal (YouTube, Instagram, WhatsApp, Gallery, Chrome, Camera, Torch, Settings, Blocked Payment) */}
      <AndroidSimulatedApps
        activeApp={activeSimulatedApp}
        appParam={simulatedAppParam}
        onClose={() => {
          setActiveSimulatedApp(null);
          setSimulatedAppParam(null);
        }}
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Image Workflow Modal (AI Image Generation & Genuine Photo Enhancement) */}
      <ImageWorkflowModal
        isOpen={isImageWorkflowOpen}
        onClose={() => setIsImageWorkflowOpen(false)}
        mode={imageWorkflowMode}
        initialPrompt={workflowInitialPrompt}
        initialImage={workflowInitialImage}
        onInsertToChat={(item) => {
          if (item.type === 'generated_image') {
            setMessages((prev) => [
              ...prev,
              {
                id: 'gen-' + Date.now(),
                sender: 'shadow',
                text: `AI Image generated for prompt: "${item.prompt}"`,
                timestamp: Date.now(),
                generatedImage: {
                  url: item.url,
                  prompt: item.prompt || '',
                  createdAt: Date.now(),
                },
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: 'enh-' + Date.now(),
                sender: 'shadow',
                text: 'Photo clarity enhanced successfully! Original photo and enhanced version saved.',
                timestamp: Date.now(),
                enhancedImage: {
                  originalUrl: item.originalUrl || undefined,
                  enhancedUrl: item.url,
                  filtersApplied: ['Unsharp Mask', 'Adaptive Contrast', 'Luminance Balancing'],
                },
              },
            ]);
          }
        }}
      />

      {/* Lightbox Modal for Fullscreen Photo View */}
      {expandedMediaUrl && expandedMediaUrl.trim() !== '' && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setExpandedMediaUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setExpandedMediaUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white bg-slate-800 rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={expandedMediaUrl}
              alt="Expanded preview"
              className="max-h-[80vh] w-auto rounded-2xl object-contain border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onResetDefaults={() =>
          setSettings({
            language: 'hinglish',
            theme: 'cyber-purple',
            autoSpeak: true,
            speechRate: 1.0,
            speechPitch: 1.0,
            requireSensitiveConfirmation: true,
            hapticFeedback: true,
            backendUrl: '',
            blockedPackages: [],
            blockFinancialApps: true,
          })
        }
      />

      {/* Notes & Reminders Modal */}
      <NotesRemindersModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        onAddNote={(noteData) =>
          setNotes((prev) => [
            {
              ...noteData,
              id: 'note-' + Date.now(),
              createdAt: Date.now(),
            },
            ...prev,
          ])
        }
        onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
      />

      {/* Wake Word Info Modal */}
      <AndroidWakeWordInfoModal
        isOpen={isWakeWordModalOpen}
        onClose={() => setIsWakeWordModalOpen(false)}
      />

      {/* Confirmation Dialog for Sensitive Actions */}
      <ConfirmationDialog
        isOpen={confirmDialogState.isOpen}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        confirmLabel={confirmDialogState.confirmLabel}
        isDestructive={confirmDialogState.isDestructive}
        onConfirm={() => {
          confirmDialogState.action?.();
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialogState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Real-time Voice Assistant Orb Modal */}
      <VoiceAssistantOrbModal
        isOpen={isVoiceAssistantOpen}
        onClose={handleEndContinuousConversation}
        status={speechStatus}
        audioLevel={audioLevel}
        transcript={messages.map((m) => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        }))}
        currentInputText={inputPrompt}
        onStartListening={handleStartContinuousConversation}
        onStopListening={handlePauseListening}
        onInterrupt={handleInterrupt}
        onSendCommand={(cmd) => handleLiveVoiceCommand(cmd)}
        isMicMuted={isMicMuted}
        onToggleMicMute={handleToggleMicMute}
        attachedMedia={selectedMedia}
        language={settings.language}
        onOpenWakeWordModal={() => setIsWakeWordModalOpen(true)}
        isContinuousActive={isContinuousVoiceActive}
        errorMessage={speechError}
        onReconnect={handleReconnectMic}
        onOpenVoiceHistory={() => setIsVoiceHistoryOpen(true)}
        liveMode={liveMode}
        isLiveConnected={isLiveConnected}
        connectionState={liveConnectionStatus}
      />

      {/* Separately Stored Voice Sessions History Modal */}
      <VoiceSessionsHistoryModal
        isOpen={isVoiceHistoryOpen}
        onClose={() => setIsVoiceHistoryOpen(false)}
        sessions={voiceSessions}
        onDeleteSession={handleDeleteVoiceSession}
        onClearAllSessions={handleClearAllVoiceSessions}
        onSpeakText={speakText}
        onTriggerHaptic={triggerHaptic}
      />

      {/* Android Native Project Hub Modal */}
      <AndroidProjectHubModal
        isOpen={isProjectHubOpen}
        onClose={() => setIsProjectHubOpen(false)}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallPWA={handleInstallApp}
        isAppInstalled={isAppInstalled}
      />
    </div>
  );
}
