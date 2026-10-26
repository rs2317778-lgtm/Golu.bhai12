import React from 'react';
import {
  ShieldAlert,
  Mic,
  Bell,
  Cpu,
  Lock,
  CheckCircle2,
  XCircle,
  X,
  FileCode,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface AndroidWakeWordInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSourceCode?: () => void;
}

export const AndroidWakeWordInfoModal: React.FC<AndroidWakeWordInfoModalProps> = ({
  isOpen,
  onClose,
  onViewSourceCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#070b16] border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-display">
                Android Wake-Word & Permission Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Official Android OS Security Guidelines & Foreground Service Requirements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Android Background Microphone Restriction */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Mic className="w-4 h-4" />
              <span>Continuous Listening When App Is Closed (Android Restriction)</span>
            </div>
            <p className="text-xs text-slate-300">
              Starting from <strong>Android 9.0 (Pie) up to Android 15</strong>, Google strictly restricts background audio recording.
              A normal closed Android app <strong>cannot secretly or continuously record from the microphone</strong> without user awareness.
            </p>
            <p className="text-xs text-slate-400">
              To listen for a custom wake phrase (like <em>"Shadow AI kholo"</em>) when the app is in the background, Android <strong>mandates</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-purple-200 pl-2">
              <li>An explicit <strong>Foreground Service</strong> running with <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">FOREGROUND_SERVICE_MICROPHONE</code>.</li>
              <li>A persistent, user-visible <strong>ongoing notification</strong> indicating the microphone is active.</li>
              <li>Explicit user permission grant for <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">RECORD_AUDIO</code> and <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">POST_NOTIFICATIONS</code>.</li>
            </ul>
          </div>

          {/* Section 2: What Shadow AI CAN and CANNOT control (Zero False Claims) */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
              Transparent Capability Matrix (No Misleading Claims)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Supported */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Real Supported Android APIs</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>• <strong>Torch/Flashlight:</strong> Safe hardware control via <code className="font-mono text-cyan-300">CameraManager.setTorchMode()</code></li>
                  <li>• <strong>Speech Recognition:</strong> Native <code className="font-mono text-cyan-300">SpeechRecognizer</code> in Hindi & English</li>
                  <li>• <strong>TextToSpeech:</strong> Spoken replies via <code className="font-mono text-cyan-300">TextToSpeech</code></li>
                  <li>• <strong>App Launchers:</strong> Chrome, Maps, Dialer via safe <code className="font-mono text-cyan-300">Intent.ACTION_VIEW / DIAL</code></li>
                  <li>• <strong>Settings:</strong> Open Wi-Fi, Bluetooth, Apps via <code className="font-mono text-cyan-300">Settings.ACTION_*</code></li>
                  <li>• <strong>Notes & Reminders:</strong> Voice-saved local reminders</li>
                </ul>
              </div>

              {/* Restricted */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-red-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>OS-Restricted Actions (Honest Notice)</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li>• <strong>Airplane Mode:</strong> Restricted by Android (cannot toggle without root/system signature). Shadow AI directs to Settings instead.</li>
                  <li>• <strong>Auto-calling:</strong> Phone dialer is opened safely with user confirmation (<code className="font-mono">ACTION_DIAL</code>, never auto-dials).</li>
                  <li>• <strong>Background SMS/Calls:</strong> Strictly prohibited (Zero-snoop).</li>
                  <li>• <strong>System Power Off:</strong> Not allowed by non-root apps.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Native Service Implementation */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Implemented: ShadowWakeWordService.kt</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                Included in Android Studio Project
              </span>
            </div>
            <p className="text-xs text-slate-400">
              The project source includes the complete Foreground Service class configured with notification channel
              and audio recognizer listener for background readiness.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Snoop Privacy Guarantee</span>
          </span>
          <div className="flex items-center gap-2">
            {onViewSourceCode && (
              <button
                onClick={() => {
                  onClose();
                  onViewSourceCode();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-all"
              >
                View Android Code
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
