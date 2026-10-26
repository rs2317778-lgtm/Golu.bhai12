import React, { useState } from 'react';
import {
  Mic,
  Calendar,
  Clock,
  Trash2,
  X,
  Volume2,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Search,
  Radio,
} from 'lucide-react';
import { VoiceSessionRecord, VoiceTranscriptItem } from '../types.ts';

interface VoiceSessionsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: VoiceSessionRecord[];
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
  onSpeakText?: (text: string) => void;
  onTriggerHaptic?: (pattern?: number | number[]) => void;
}

export const VoiceSessionsHistoryModal: React.FC<VoiceSessionsHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onDeleteSession,
  onClearAllSessions,
  onSpeakText,
  onTriggerHaptic,
}) => {
  const [selectedSession, setSelectedSession] = useState<VoiceSessionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const hasInSummary = s.summary?.toLowerCase().includes(q);
    const hasInTranscripts = s.transcripts.some((t) => t.text.toLowerCase().includes(q));
    return hasInSummary || hasInTranscripts;
  });

  const formatSessionDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Past Session';
    }
  };

  const formatSessionTime = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '< 1m';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#070b18] border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-purple-900/40 bg-purple-950/30">
          <div className="flex items-center gap-2.5">
            {selectedSession ? (
              <button
                onClick={() => {
                  onTriggerHaptic?.(15);
                  setSelectedSession(null);
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-purple-900/50 text-slate-300 hover:text-white transition-colors"
                title="Back to Sessions List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-display tracking-wider bg-gradient-to-r from-cyan-400 via-purple-300 to-white bg-clip-text text-transparent">
                  {selectedSession ? 'VOICE CONVERSATION DETAILS' : 'PAST VOICE SESSIONS'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
                  {sessions.length} {sessions.length === 1 ? 'RECORD' : 'RECORDS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedSession
                  ? `Recorded ${formatSessionDate(selectedSession.startedAt)} at ${formatSessionTime(selectedSession.startedAt)}`
                  : 'Separately stored voice-only conversation transcripts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!selectedSession && sessions.length > 0 && (
              <button
                onClick={() => {
                  onTriggerHaptic?.([30, 50, 30]);
                  if (window.confirm('Clear all stored voice sessions history?')) {
                    onClearAllSessions();
                  }
                }}
                className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5 transition-colors"
                title="Clear All Voice Sessions"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={() => {
                onTriggerHaptic?.(15);
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (Only shown on list view) */}
        {!selectedSession && sessions.length > 0 && (
          <div className="p-3 border-b border-purple-900/30 bg-[#080d20]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcripts by spoken words..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-purple-500/30 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {selectedSession ? (
            /* Detailed Transcript View */
            <div className="space-y-3">
              {/* Session Meta Card */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Duration: {formatDuration(selectedSession.durationSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>{selectedSession.transcripts.length} turns</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onTriggerHaptic?.(20);
                    onDeleteSession(selectedSession.id);
                    setSelectedSession(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Session</span>
                </button>
              </div>

              {/* Turn-by-turn Transcript */}
              <div className="space-y-2.5 pt-1">
                {selectedSession.transcripts.map((item: VoiceTranscriptItem, idx: number) => {
                  const isUser = item.sender === 'user';
                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-2xl text-xs transition-all ${
                        isUser
                          ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-100 ml-4 sm:ml-8'
                          : 'bg-[#0f172a] border border-purple-500/30 text-slate-200 mr-4 sm:mr-8 shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 opacity-80 text-[10px] font-mono">
                        <span className={isUser ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold'}>
                          {isUser ? '👤 You (Spoken Voice)' : '⚡ Shadow AI (Assistant Response)'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{formatSessionTime(item.timestamp)}</span>
                          {!isUser && onSpeakText && (
                            <button
                              onClick={() => {
                                onTriggerHaptic?.(15);
                                onSpeakText(item.text);
                              }}
                              className="p-1 rounded hover:bg-purple-900/60 text-purple-300 hover:text-white transition-colors"
                              title="Listen Aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : filteredSessions.length > 0 ? (
            /* List of Saved Voice Sessions */
            filteredSessions.map((session) => {
              const previewText =
                session.summary ||
                session.transcripts[0]?.text ||
                'Voice conversation';
              const turnCount = session.transcripts.length;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onTriggerHaptic?.(20);
                    setSelectedSession(session);
                  }}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/70 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-colors">
                      <Mic className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-semibold text-cyan-300">
                          {formatSessionDate(session.startedAt)}
                        </span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatSessionTime(session.startedAt)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-mono">
                          {turnCount} {turnCount === 1 ? 'turn' : 'turns'}
                        </span>
                        {session.durationSeconds && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            ({formatDuration(session.durationSeconds)})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 truncate font-sans group-hover:text-white transition-colors">
                        "{previewText}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerHaptic?.(20);
                        onDeleteSession(session.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete this session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State */
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 font-display">
                {searchQuery ? 'No matching voice sessions found' : 'No Voice Sessions Recorded Yet'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'Start a voice conversation using the "Voice Assistant" button. Your voice transcripts will automatically be saved separately here for review!'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-purple-900/40 bg-purple-950/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Voice transcripts are stored locally in your browser</span>
          </span>
          <button
            onClick={() => {
              onTriggerHaptic?.(15);
              onClose();
            }}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
