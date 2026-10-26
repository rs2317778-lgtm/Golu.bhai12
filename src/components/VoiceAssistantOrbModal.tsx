import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Radio,
  Send,
  MessageSquare,
  Compass,
  AlertTriangle,
  Flame,
  Shield,
  HelpCircle,
  Monitor,
  History,
} from 'lucide-react';
import { MediaAttachment } from '../types.ts';

interface VoiceAssistantOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  transcript: { sender: 'user' | 'shadow'; text: string; timestamp: number }[];
  currentInputText?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onInterrupt: () => void;
  onSendCommand: (command: string) => void;
  isMicMuted?: boolean;
  onToggleMicMute?: () => void;
  attachedMedia?: MediaAttachment | null;
  language: string;
  onOpenWakeWordModal?: () => void;
  isContinuousActive?: boolean;
  errorMessage?: string | null;
  onReconnect?: () => void;
  onOpenLiveScreen?: () => void;
  isScreenSharingActive?: boolean;
  onOpenVoiceHistory?: () => void;
  liveMode?: 'gemini-3.8-live' | 'fast-stream';
  isLiveConnected?: boolean;
  connectionState?: 'connecting' | 'connected' | 'error' | 'disconnected';
}

export const VoiceAssistantOrbModal: React.FC<VoiceAssistantOrbModalProps> = ({
  isOpen,
  onClose,
  status,
  audioLevel = 0.5,
  transcript,
  currentInputText = '',
  onStartListening,
  onStopListening,
  onInterrupt,
  onSendCommand,
  isMicMuted = false,
  onToggleMicMute,
  attachedMedia,
  language,
  onOpenWakeWordModal,
  isContinuousActive = false,
  errorMessage = null,
  onReconnect,
  onOpenLiveScreen,
  isScreenSharingActive = false,
  onOpenVoiceHistory,
  liveMode = 'gemini-3.8-live',
  isLiveConnected = true,
  connectionState = 'connected',
}) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript when new replies come in
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, currentInputText]);

  if (!isOpen) return null;

  const isListening = status === 'listening';
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking';
  const isIdle = status === 'idle';

  // Sample voice command chips requested by user
  const quickVoiceCommands = [
    { label: 'Tumko kisne banaya?', prompt: 'Tumko kisne banaya hai?' },
    { label: 'Screen par kya hai?', prompt: 'Meri live screen par kya dikh raha hai? Vistaar se samjhao.' },
    { label: 'Shadow, meri baat suno.', prompt: 'Shadow, meri baat suno.' },
    { label: 'Aaj ka mausam batao.', prompt: 'Aaj ka mausam batao.' },
    { label: 'Mujhe ek kahani sunao.', prompt: 'Mujhe ek kahani sunao.' },
    { label: 'YouTube kholo.', prompt: 'YouTube kholo.' },
    { label: 'Camera kholo.', prompt: 'Camera kholo.' },
    { label: 'Mere sawal ka jawab do.', prompt: 'Mere sawal ka jawab do.' },
  ];

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    onSendCommand(typedMessage.trim());
    setTypedMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05030d]/95 backdrop-blur-2xl text-slate-100 overflow-hidden animate-in fade-in duration-300">
      {/* Background cyber ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-purple-900/30 via-indigo-900/20 to-cyan-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-fuchsia-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-900/30 bg-purple-950/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isThinking
                  ? 'bg-amber-400'
                  : isListening
                  ? 'bg-cyan-400'
                  : isSpeaking
                  ? 'bg-fuchsia-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isThinking
                  ? 'bg-amber-500'
                  : isListening
                  ? 'bg-cyan-500'
                  : isSpeaking
                  ? 'bg-fuchsia-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-wider bg-gradient-to-r from-cyan-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent font-display">
                SHADOW LIVE VOICE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ⚡ FAST RESPONSE: {liveMode === 'gemini-3.8-live' ? 'GEMINI 3.8 LIVE' : 'STREAMING'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Personal AI Assistant by Golu ji • Hindi & English Voice
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2">
          {onOpenLiveScreen && (
            <button
              onClick={onOpenLiveScreen}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                isScreenSharingActive
                  ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'bg-purple-950/60 hover:bg-purple-900/80 border-purple-500/40 text-purple-300 hover:text-white'
              }`}
              title="Open Live Screen Vision"
            >
              <Monitor className={`w-3.5 h-3.5 ${isScreenSharingActive ? 'text-red-400' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline font-mono">
                {isScreenSharingActive ? 'Screen Active' : 'Live Screen'}
              </span>
            </button>
          )}

          {onOpenWakeWordModal && (
            <button
              onClick={onOpenWakeWordModal}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Wake-Word & Android Mic Permission Info"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline font-mono">Hey Shadow Info</span>
            </button>
          )}

          {onOpenVoiceHistory && (
            <button
              onClick={onOpenVoiceHistory}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Review Past Voice Sessions"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono">Voice History</span>
            </button>
          )}

          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className={`p-2 rounded-xl border transition-all ${
              showTextInput
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-400 hover:text-white'
            }`}
            title="Text Chat Fallback"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-all"
            title="Close Voice Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden">
        {/* Attached Context Banner if image/video/screen loaded */}
        {attachedMedia && (
          <div className={`w-full max-w-md mx-auto mb-2 px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            attachedMedia.isLiveScreen || attachedMedia.type === 'screen'
              ? 'bg-red-950/50 border-red-500/50 text-red-300'
              : 'bg-purple-950/40 border-cyan-500/40 text-cyan-300'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {attachedMedia.isLiveScreen || attachedMedia.type === 'screen' ? (
                <Monitor className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              )}
              <span className="truncate">
                {attachedMedia.isLiveScreen ? 'Live Screen Frame Attached' : `Media Context: ${attachedMedia.name} (${attachedMedia.type.toUpperCase()})`}
              </span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              attachedMedia.isLiveScreen
                ? 'bg-red-900/60 text-red-200'
                : 'bg-cyan-900/60 text-cyan-200'
            }`}>
              {attachedMedia.isLiveScreen ? 'SCREEN VISION' : 'Attached to Voice'}
            </span>
          </div>
        )}

        {/* Central Animated Voice Orb Area */}
        <div className="flex-1 flex flex-col items-center justify-center my-2 sm:my-4 w-full max-w-md">
          {/* Status Label Banner */}
          <div className="mb-3 sm:mb-5 text-center">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-medium tracking-wide shadow-lg transition-all duration-300 ${
                isMicMuted
                  ? 'bg-red-950/70 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : isThinking
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : isListening
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse'
                  : isSpeaking
                  ? 'bg-fuchsia-950/70 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                  : isContinuousActive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-purple-950/60 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              }`}
            >
              {isMicMuted ? (
                <>
                  <MicOff className="w-4 h-4 text-red-400" />
                  <span>Microphone Muted (Unmute par tap karein)</span>
                </>
              ) : isThinking ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Soch raha hoon... (Fast Mode Processing...)</span>
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-4 h-4 text-cyan-400 animate-bounce" />
                  <span>
                    Sun raha hoon... {isLiveConnected ? '(Live Audio Stream)' : '(Listening...)'}
                  </span>
                </>
              ) : isSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                  <span>
                    Shadow AI bol raha hai... {liveMode === 'gemini-3.8-live' ? '(Live Audio Output)' : ''}
                  </span>
                </>
              ) : isContinuousActive ? (
                <>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Live Voice Active • Ready for speech</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Ready • "Start Conversation" dabayein</span>
                </>
              )}
            </div>
          </div>

          {/* Error Message with Reconnect Action */}
          {errorMessage && (
            <div className="mb-3 px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200 flex items-center justify-between gap-2 max-w-sm w-full animate-in fade-in">
              <div className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              {onReconnect && (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="px-2 py-0.5 rounded-lg bg-red-900 hover:bg-red-800 text-white font-mono text-[10px] shrink-0 border border-red-400/40"
                >
                  Reconnect
                </button>
              )}
            </div>
          )}

          {/* THE GIANT ANIMATED VOICE ORB */}
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-72 sm:h-72 select-none">
            {/* Outer pulsating energy rings */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'border-2 border-cyan-500/40 animate-ping opacity-60 scale-110'
                  : isSpeaking
                  ? 'border-2 border-fuchsia-500/40 animate-ping opacity-60 scale-125'
                  : isThinking
                  ? 'border border-amber-500/40 animate-spin opacity-40'
                  : 'border border-purple-500/20 opacity-30'
              }`}
              style={{ animationDuration: isThinking ? '4s' : '2s' }}
            />

            {/* Middle Cyber Ring with Audio Reactive Glow */}
            <div
              className={`absolute -inset-4 rounded-full filter blur-xl transition-all duration-300 ${
                isThinking
                  ? 'bg-gradient-to-r from-amber-500/30 via-purple-600/30 to-cyan-500/30 opacity-70 scale-105'
                  : isListening
                  ? 'bg-gradient-to-r from-cyan-500/40 via-blue-600/40 to-indigo-500/40 opacity-80 scale-110'
                  : isSpeaking
                  ? 'bg-gradient-to-r from-fuchsia-500/50 via-purple-600/50 to-pink-500/50 opacity-90 scale-115'
                  : 'bg-gradient-to-r from-purple-800/30 via-indigo-900/30 to-cyan-900/30 opacity-40'
              }`}
            />

            {/* Glowing Orb Spherical Core */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  onInterrupt();
                } else if (isListening) {
                  onStopListening();
                } else if (isThinking) {
                  onInterrupt();
                } else {
                  onStartListening();
                }
              }}
              className={`relative z-20 w-40 h-40 sm:w-52 sm:h-52 rounded-full cursor-pointer flex flex-col items-center justify-center p-4 transition-all duration-300 focus:outline-none transform active:scale-95 ${
                isThinking
                  ? 'bg-gradient-to-tr from-[#1b0b2e] via-[#3d1a45] to-[#78350f] shadow-[0_0_60px_rgba(245,158,11,0.5),inset_0_0_30px_rgba(251,191,36,0.4)] border-2 border-amber-400/70'
                  : isListening
                  ? 'bg-gradient-to-tr from-[#06182c] via-[#0f2e4a] to-[#083344] shadow-[0_0_70px_rgba(6,182,212,0.6),inset_0_0_30px_rgba(34,211,238,0.5)] border-2 border-cyan-400/80 scale-105'
                  : isSpeaking
                  ? 'bg-gradient-to-tr from-[#240838] via-[#4a0e4e] to-[#701a75] shadow-[0_0_75px_rgba(217,70,239,0.6),inset_0_0_35px_rgba(244,114,182,0.5)] border-2 border-fuchsia-400/80 scale-105'
                  : 'bg-gradient-to-tr from-[#0f0728] via-[#1c0f3d] to-[#1e1b4b] shadow-[0_0_40px_rgba(147,51,234,0.3),inset_0_0_20px_rgba(168,85,247,0.3)] border border-purple-500/40 hover:border-cyan-400/60'
              }`}
              title={
                isSpeaking
                  ? 'Click to Interrupt (Ruk Jao)'
                  : isListening
                  ? 'Listening... Click to stop'
                  : isThinking
                  ? 'Thinking... Click to cancel'
                  : 'Click to start voice conversation'
              }
            >
              {/* Inner animated neural mesh */}
              <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)] pointer-events-none" />

              {/* Central Icon inside Orb */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {isSpeaking ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Square className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-fuchsia-300 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-fuchsia-200 font-bold">
                      Tap To Stop
                    </span>
                  </div>
                ) : isThinking ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 animate-spin" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-200 font-bold">
                      Processing
                    </span>
                  </div>
                ) : isListening ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-200 animate-bounce" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-200 font-bold">
                      Tap When Done
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300 group-hover:text-cyan-300 transition-colors" />
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-200 font-bold">
                      Tap To Talk
                    </span>
                  </div>
                )}
              </div>

              {/* Orbiting particles */}
              <div className="absolute w-full h-full rounded-full animate-spin [animation-duration:8s] pointer-events-none">
                <span className="absolute top-1 left-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />
                <span className="absolute bottom-1 left-1/2 w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_magenta]" />
              </div>
            </button>
          </div>

          {/* Live Transcript / Speech Subtitle */}
          <div className="w-full mt-4 sm:mt-6 px-3 py-2.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 backdrop-blur-md max-h-36 sm:max-h-44 overflow-y-auto">
            {currentInputText ? (
              <div className="text-xs sm:text-sm text-cyan-300 animate-pulse font-mono">
                <span className="text-slate-400 uppercase text-[10px] block mb-0.5">Hearing you:</span>
                "{currentInputText}"
              </div>
            ) : transcript.length > 0 ? (
              <div className="space-y-2 text-xs sm:text-sm">
                {transcript.slice(-3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl ${
                      item.sender === 'user'
                        ? 'bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 ml-4'
                        : 'bg-purple-950/50 border border-purple-800/50 text-slate-200 mr-4'
                    }`}
                  >
                    <span className="text-[10px] block font-mono uppercase text-slate-400 mb-0.5">
                      {item.sender === 'user' ? 'Aap (You):' : 'Shadow AI:'}
                    </span>
                    <p className="leading-snug">{item.text}</p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400 italic">
                Aap boleinge to live transcript yahan dikhega. (Speak to start conversation)
              </div>
            )}
          </div>
        </div>

        {/* Quick Voice Command Chips */}
        <div className="w-full max-w-md my-2">
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Quick Voice Commands:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {quickVoiceCommands.map((cmd, i) => (
              <button
                key={i}
                onClick={() => onSendCommand(cmd.prompt)}
                className="px-2.5 py-1 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/30 hover:border-cyan-400/50 text-[11px] sm:text-xs text-slate-300 hover:text-white transition-all active:scale-95"
              >
                "{cmd.label}"
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Text-Chat Fallback input */}
        {showTextInput && (
          <form
            onSubmit={handleSendTyped}
            className="w-full max-w-md my-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Voice unavailable? Type Hindi / English command here..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-black font-bold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Bottom Primary Controls (Touch Optimized for Mobile) */}
        <div className="w-full max-w-md pt-2 flex items-center justify-around gap-3 border-t border-purple-900/30">
          {/* Mute / Unmute Button */}
          <button
            onClick={onToggleMicMute}
            className={`flex flex-col items-center gap-1 p-2 sm:px-4 sm:py-2 rounded-2xl border transition-all active:scale-95 ${
              isMicMuted
                ? 'bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan-400" />}
            <span className="text-[10px] font-mono">{isMicMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Primary Action Button (Start / Pause / Interrupt) */}
          {isSpeaking ? (
            <button
              onClick={onInterrupt}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Ruk Jao (Interrupt)</span>
            </button>
          ) : isListening ? (
            <button
              onClick={onStopListening}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all active:scale-95"
            >
              <Square className="w-4 h-4" />
              <span>Pause Listening</span>
            </button>
          ) : isContinuousActive ? (
            <button
              onClick={onStartListening}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 animate-pulse"
            >
              <Mic className="w-4 h-4 text-emerald-200 animate-bounce" />
              <span>Resume Listening</span>
            </button>
          ) : (
            <button
              onClick={onStartListening}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all active:scale-95 animate-pulse"
            >
              <Mic className="w-4 h-4 animate-bounce" />
              <span>Start Conversation</span>
            </button>
          )}

          {/* End Conversation Button */}
          <button
            onClick={onClose}
            className="flex flex-col items-center gap-1 p-2 sm:px-4 sm:py-2 rounded-2xl bg-slate-900/70 border border-slate-700/60 text-slate-300 hover:text-red-400 hover:border-red-500/40 transition-all active:scale-95"
            title="End Conversation (Stop Microphone & Audio completely)"
          >
            <X className="w-5 h-5 text-red-400" />
            <span className="text-[10px] font-mono text-red-300">End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
