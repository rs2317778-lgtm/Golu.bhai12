import React, { useState } from 'react';
import { AppSettings, Language, Theme } from '../types.ts';
import {
  Globe,
  Mic,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Volume2,
  X,
  Server,
  Lock,
  Plus,
  Trash2,
  Cpu,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [customPackage, setCustomPackage] = useState('');

  if (!isOpen) return null;

  const defaultBlocked = [
    'net.one97.paytm (Paytm)',
    'com.phonepe.app (PhonePe)',
    'com.google.android.apps.nbu.paisa.user (Google Pay)',
    'in.org.npci.upiapp (BHIM)',
    'com.dreamplug.androidapp (CRED)',
    'com.sbi.lotuszaap (YONO SBI)',
    'com.csam.icici.bank.imobile (ICICI)',
    'com.snapwork.hdfc (HDFC)',
  ];

  const handleAddCustomPackage = () => {
    if (!customPackage.trim()) return;
    const current = settings.blockedPackages || [];
    if (!current.includes(customPackage.trim())) {
      onUpdateSettings({ blockedPackages: [...current, customPackage.trim()] });
    }
    setCustomPackage('');
  };

  const handleRemoveCustomPackage = (pkg: string) => {
    const current = settings.blockedPackages || [];
    onUpdateSettings({ blockedPackages: current.filter((p) => p !== pkg) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#080d1a] border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-display">
                Shadow AI Settings
              </h2>
              <p className="text-xs text-slate-400">
                Voice, Banking Safety, Models, and Permissions
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Creator Identity Card */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Assistant & Creator Identity</span>
            </div>
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-cyan-950/50 border border-purple-500/40 space-y-2 text-xs shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">AI Assistant Name:</span>
                <span className="text-cyan-300 font-mono font-bold">Shadow AI</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Created By:</span>
                <span className="text-purple-300 font-mono font-bold">Golu ji</span>
              </div>
              <div className="pt-2 border-t border-purple-500/20 text-[11px] text-slate-300">
                <p>
                  <strong className="text-cyan-300">Role:</strong> Personal AI Assistant created by Golu ji. Designed for fast bilingual Hindi & English voice interaction, screen analysis, and Android automation.
                </p>
              </div>
            </div>
          </section>

          {/* AI Model Intelligence Architecture */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Gemini Model Intelligence & Overload Protection</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Primary Voice/Vision Model:</span>
                <span className="text-cyan-400 font-mono font-bold">gemini-3.8-flash</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">High Demand (503) Auto-Fallback:</span>
                <span className="text-purple-400 font-mono font-bold">gemini-3.1-flash-lite</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">AI Image Creation Engine:</span>
                <span className="text-amber-400 font-mono font-bold">gemini-3.1-flash-lite-image</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-emerald-400">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Exponential Backoff Retries Active</span>
                </span>
                <span className="text-slate-400">3 Attempts with Jitter</span>
              </div>
            </div>
          </section>

          {/* Payment & Banking App Restrictions (CRITICAL USER REQUIREMENT 9) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider font-mono">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Payment & Banking App Restrictions (वित्तीय सुरक्षा)</span>
            </div>

            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Block Financial, UPI & Banking Apps</p>
                  <p className="text-[11px] text-slate-400">
                    Never launch Paytm, PhonePe, Google Pay, BHIM, or Banking apps via voice/text
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.blockFinancialApps !== false}
                    onChange={(e) =>
                      onUpdateSettings({ blockFinancialApps: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Default Protected Package Badges */}
              <div>
                <p className="text-[11px] font-semibold text-slate-300 mb-1.5">
                  Default Protected Packages (Verified):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {defaultBlocked.map((pkg, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 font-mono"
                    >
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Blocked Packages Input */}
              <div className="pt-2 border-t border-red-900/40">
                <p className="text-[11px] font-semibold text-slate-300 mb-1.5">
                  Add Custom Package to Blocklist:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPackage}
                    onChange={(e) => setCustomPackage(e.target.value)}
                    placeholder="e.g. com.mybank.app"
                    className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPackage}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {settings.blockedPackages && settings.blockedPackages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {settings.blockedPackages.map((pkg) => (
                      <span
                        key={pkg}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1"
                      >
                        <span>{pkg}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomPackage(pkg)}
                          className="hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Language Selection */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Language (भाषा)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'hi-IN', label: 'हिन्दी (Hindi)', sub: 'Native Hindi Speech & OCR' },
                { code: 'hinglish', label: 'Hinglish (Recommended)', sub: 'Hindi + English mix' },
                { code: 'en-IN', label: 'English (India)', sub: 'Indian English Accent' },
                { code: 'en-US', label: 'English (US)', sub: 'Global English' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onUpdateSettings({ language: item.code as Language })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.language === item.code
                      ? 'bg-purple-950/60 border-purple-500 text-white shadow-sm ring-1 ring-purple-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Voice & Speech Controls */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Voice & Text-To-Speech</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Auto-Speak Replies (आवाज़ में उत्तर)</p>
                  <p className="text-[11px] text-slate-400">
                    Shadow AI reads out responses in Hindi/English
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Speech Rate (बोलने की गति):</span>
                  <span className="font-mono text-cyan-400">{settings.speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) =>
                    onUpdateSettings({ speechRate: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Feature 2: Wake Word Assistant ("Hey Shadow") */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Wake Word Assistant ("Hey Shadow")</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Wake Word Detection</p>
                  <p className="text-[11px] text-slate-400">
                    Activates Shadow AI when you say "{settings.wakeWordPhrase || 'Hey Shadow'}" while this tab is open
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.wakeWordEnabled !== false}
                    onChange={(e) => onUpdateSettings({ wakeWordEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {settings.wakeWordEnabled !== false && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Configurable Wake Phrase:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { phrase: 'Hey Shadow', desc: 'Standard (English / Hinglish)' },
                      { phrase: 'Shadow', desc: 'Quick single word' },
                      { phrase: 'Shadow AI', desc: 'Full assistant name' },
                      { phrase: 'Sun Shadow', desc: 'Hindi conversational ("सुन शैडो")' },
                    ].map((item) => (
                      <button
                        key={item.phrase}
                        type="button"
                        onClick={() => onUpdateSettings({ wakeWordPhrase: item.phrase })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          (settings.wakeWordPhrase || 'Hey Shadow') === item.phrase
                            ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold font-mono">"{item.phrase}"</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[10px] text-cyan-300/90 leading-relaxed mt-2">
                    <strong>Browser Execution Note:</strong> Wake word listening operates while this web tab is open and active. Browser security sandboxes do not permit background microphone access when the browser is completely closed or the phone screen is locked. Always-on lock-screen detection requires the native Android Foreground Service included in the APK export.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Privacy & Sensitive Confirmation */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Permissions & Consent</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Sensitive Action Confirmation</p>
                  <p className="text-[11px] text-slate-400">
                    Ask confirmation before phone dialer or external actions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireSensitiveConfirmation}
                    onChange={(e) =>
                      onUpdateSettings({ requireSensitiveConfirmation: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy & Security Guarantee:</strong> Shadow AI never accesses banking credentials, OTPs, or private financial records. All API communications go through our secured server proxy.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
