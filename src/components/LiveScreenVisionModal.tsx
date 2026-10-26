import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  MonitorOff,
  ScreenShare,
  StopCircle,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Radio,
  ArrowRight,
  Maximize2,
  Minimize2,
  Shield,
  Smartphone
} from 'lucide-react';
import { ScreenVisionState } from '../types.ts';

interface LiveScreenVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenVision: ScreenVisionState;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => void;
  onAnalyzeScreen: (customPrompt?: string) => void;
  onOpenAndroidHub?: () => void;
  language: string;
}

export const LiveScreenVisionModal: React.FC<LiveScreenVisionModalProps> = ({
  isOpen,
  onClose,
  screenVision,
  onStartScreenShare,
  onStopScreenShare,
  onAnalyzeScreen,
  onOpenAndroidHub,
  language,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [permissionInfoOpen, setPermissionInfoOpen] = useState(false);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);

  // Bind video element to the live MediaStream when active
  useEffect(() => {
    if (videoRef.current && screenVision.stream) {
      videoRef.current.srcObject = screenVision.stream;
      videoRef.current.play().catch((err) => {
        console.warn('[Live Screen] Video play warning:', err);
      });
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [screenVision.stream, isOpen]);

  if (!isOpen) return null;

  const isHindi = language === 'hi-IN';

  const quickScreenQuestions = [
    {
      label: isHindi ? 'इस स्क्रीन पर क्या दिख रहा है?' : 'What is visible on my screen?',
      prompt: isHindi ? 'What is visible on my screen? Is screen par kya dikh raha hai vistaar se samjhao.' : 'What is visible on my screen? Analyze and explain what you see in detail.'
    },
    {
      label: isHindi ? 'यह एरर समझाओ' : 'Explain this error',
      prompt: isHindi ? 'Explain this error. Screen par jo error, alert ya samasya dikh rahi hai use samjhao aur samadhan batao.' : 'Explain this error. What is causing it and how do I fix it?'
    },
    {
      label: isHindi ? 'इस इमेज का वर्णन करो' : 'Describe this image',
      prompt: isHindi ? 'Describe this image. Screen par dikh rahi image, visual graphics ya elements ka vistaar se varnan karein.' : 'Describe this image and the visual elements currently visible.'
    },
    {
      label: isHindi ? 'जो दिख रहा है उसे समझने में मदद करो' : 'Help me understand what I am looking at',
      prompt: isHindi ? 'Help me understand what I am looking at. Is screen ke context aur jankari ko aasan shabdo me samjhao.' : 'Help me understand what I am looking at. Provide clear context and instructions.'
    },
    {
      label: isHindi ? 'टेक्स्ट पढ़ कर समझाओ' : 'Read & summarize text',
      prompt: isHindi ? 'Screen par jo text aur jankari likhi hai, use padh kar samjhao.' : 'Read and summarize the visible text, titles, and numbers on this screen.'
    },
    {
      label: isHindi ? 'आगे कहाँ क्लिक या टैप करूँ?' : 'Where should I tap next?',
      prompt: isHindi ? 'Is screen par mujhe agla step lene ke liye kahan tap ya click karna chahiye? Buttons aur options batayein.' : 'Guide me on what buttons, links, or options are visible and what I should tap next.'
    }
  ];

  const handleCaptureAndAnalyze = (promptText?: string) => {
    setIsCapturingSnapshot(true);
    onAnalyzeScreen(promptText);
    setTimeout(() => setIsCapturingSnapshot(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className={`w-full bg-[#070b19] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'h-[96vh] max-w-5xl' : 'max-h-[92vh] max-w-2xl'
        }`}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-purple-900/40 bg-purple-950/20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Monitor className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-wide text-white font-display">
                  SHADOW LIVE SCREEN VISION
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono">
                  MEDIAPROJECTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isHindi
                  ? 'रियल-टाइम एंड्रॉइड स्क्रीन कैप्चर एवं विज़न विश्लेषण'
                  : 'Real-time Android Screen Vision & Multimodal UI Understanding'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all hidden sm:flex"
              title={isFullScreen ? 'Minimize View' : 'Maximize View'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title="Close Live Screen Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Active Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    screenVision.isSharing ? 'bg-red-400' : 'bg-slate-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    screenVision.isSharing ? 'bg-red-500' : 'bg-slate-600'
                  }`}
                />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {screenVision.isSharing ? (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <span>LIVE SCREEN SHARING ACTIVE</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/40 text-red-300">
                        REC
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">SCREEN SHARING INACTIVE</span>
                  )}
                </span>
                <p className="text-[11px] text-slate-400">
                  {screenVision.isSharing
                    ? isHindi
                      ? 'स्क्रीन फ्रेम्स सुरक्षित रूप से AI विज़न के लिए उपलब्ध हैं'
                      : 'Screen frames are securely streamable to Gemini Vision'
                    : isHindi
                    ? 'स्क्रीन देखने के लिए "Start Sharing" पर टैप करें'
                    : 'Tap "Start Sharing" to grant Android MediaProjection permission'}
                </p>
              </div>
            </div>

            {/* Sharing Controls Button */}
            <div>
              {screenVision.isSharing ? (
                <button
                  onClick={onStopScreenShare}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop Sharing (स्क्रीन बंद करें)</span>
                </button>
              ) : (
                <button
                  onClick={onStartScreenShare}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 animate-pulse"
                >
                  <ScreenShare className="w-4 h-4" />
                  <span>Start Sharing (स्क्रीन शेयर करें)</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message if permission denied or unsupported */}
          {screenVision.error && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{screenVision.error}</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">
                  Android Chrome / mobile browsers requires you to tap "Allow" on the system prompt. For standalone background capture, the native APK uses Android MediaProjection Foreground Service.
                </p>
              </div>
              {onOpenAndroidHub && (
                <button
                  onClick={onOpenAndroidHub}
                  className="px-2 py-1 rounded bg-red-900/80 hover:bg-red-800 text-[10px] text-white font-mono shrink-0"
                >
                  APK Info
                </button>
              )}
            </div>
          )}

          {/* Main Viewport: Live Screen Feed or Placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-slate-800 min-h-[220px] sm:min-h-[280px] flex items-center justify-center">
            {screenVision.isSharing ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[380px] sm:max-h-[460px] object-contain rounded-xl bg-black"
                />

                {/* Cyber HUD Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none border border-cyan-500/30 rounded-2xl">
                  {/* Top HUD Tag */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>GEMINI 3.8 VISION STREAM</span>
                  </div>

                  {/* Corner Targets */}
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>
            ) : (
              <div className="p-6 text-center max-w-md space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
                  <MonitorOff className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isHindi ? 'स्क्रीन शेयरिंग बंद है' : 'Screen Sharing is Currently Inactive'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {isHindi
                      ? 'शैडो एआई केवल आपकी अनुमति के बाद ही स्क्रीन देख सकता है। बिना शेयरिंग के एआई स्क्रीन देखने का दावा नहीं करता।'
                      : 'Shadow AI only observes screen content after you grant official Android permission. When inactive, the AI never pretends to see the screen.'}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={onStartScreenShare}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-lg active:scale-95 transition-all"
                  >
                    <ScreenShare className="w-4 h-4" />
                    <span>Grant Permission & Start Sharing</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar when Screen is Active: Analyze Now & Quick Questions */}
          {screenVision.isSharing && (
            <div className="space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Ask Shadow AI about your screen:</span>
                </span>

                <button
                  onClick={() => handleCaptureAndAnalyze()}
                  disabled={isCapturingSnapshot}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95 disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isCapturingSnapshot ? 'Analyzing...' : 'Analyze Full Screen'}</span>
                </button>
              </div>

              {/* Quick Screen Question Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickScreenQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCaptureAndAnalyze(q.prompt)}
                    className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-cyan-400/50 text-left transition-all group active:scale-98 flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-200 group-hover:text-white font-medium">
                      "{q.label}"
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-cyan-400 transition-colors shrink-0 ml-1.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Android Permissions & MediaProjection Security Accordion */}
          <div className="pt-2 border-t border-purple-900/30">
            <button
              onClick={() => setPermissionInfoOpen(!permissionInfoOpen)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 py-1 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Android MediaProjection & Privacy Architecture</span>
              </span>
              <span className="text-[10px] font-mono text-purple-400">
                {permissionInfoOpen ? 'Hide Info' : 'Show Details'}
              </span>
            </button>

            {permissionInfoOpen && (
              <div className="mt-2.5 p-3 rounded-2xl bg-purple-950/20 border border-purple-800/40 text-[11px] text-slate-300 space-y-2 animate-in fade-in leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Explicit User Consent:</strong> Screen frames are captured strictly through Android OS permission prompts. Shadow AI never records silently in the background.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Multimodal Gemini Vision:</strong> Frames are analyzed using Gemini 3.8 Flash to interpret visible apps, buttons, text, and notifications.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Immediate Revocation:</strong> You can stop sharing at any second using "Stop Sharing" or the Android system status bar icon.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Native APK MediaProjection:</strong> The exported Android Studio project implements <code className="text-cyan-300">MediaProjectionManager</code> with <code className="text-cyan-300">FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION</code> for OS-level background service execution.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-purple-900/30 bg-[#050814] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>AI Screen Vision • Multimodal Vision Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
