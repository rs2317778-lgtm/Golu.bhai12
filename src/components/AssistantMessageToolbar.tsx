import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Square,
  Share2,
  MoreHorizontal,
  Download,
  FileText,
} from 'lucide-react';
import { ChatMessage } from '../types.ts';

export interface AssistantMessageToolbarProps {
  message: ChatMessage;
  isSpeaking: boolean;
  onToggleSpeak: (msg: ChatMessage) => void;
  reaction?: 'like' | 'dislike' | null;
  onToggleReaction: (messageId: string, reaction: 'like' | 'dislike') => void;
  onShowFeedbackToast?: (text: string) => void;
}

/**
 * Extracts clean, human-readable text from raw AI response text by stripping markdown symbols.
 */
export function extractCleanText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Remove code block markers
    .replace(/```[^\n]*\n([\s\S]*?)\n```/g, '$1')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown link syntax [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold/italics markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove heading hashes
    .replace(/^#+\s+/gm, '')
    // Remove blockquote arrows
    .replace(/^>\s+/gm, '')
    // Remove bullet characters
    .replace(/^[-*+]\s+/gm, '')
    // Remove numbered lists
    .replace(/^\d+\.\s+/gm, '')
    // Trim extra surrounding whitespace
    .trim();
}

export const AssistantMessageToolbar: React.FC<AssistantMessageToolbarProps> = ({
  message,
  isSpeaking,
  onToggleSpeak,
  reaction,
  onToggleReaction,
  onShowFeedbackToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss copied confirmation after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Auto-dismiss shared confirmation after 2 seconds
  useEffect(() => {
    if (shared) {
      const timer = setTimeout(() => setShared(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [shared]);

  // Handle outside click and Escape key to close More dropdown menu
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Trigger brief mobile haptic feedback if enabled
  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // Ignored if haptic vibration is restricted
    }
  };

  // Button 1: Copy clean text to clipboard
  const handleCopy = async () => {
    triggerHaptic();
    const clean = extractCleanText(message.text);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clean);
      } else {
        // Fallback for older web views
        const textArea = document.createElement('textarea');
        textArea.value = clean;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      onShowFeedbackToast?.('Response copied to clipboard!');
    } catch (err) {
      console.warn('[Toolbar] Copy error:', err);
      onShowFeedbackToast?.('Failed to copy response');
    }
  };

  // Button 2: Like
  const handleLike = () => {
    triggerHaptic();
    onToggleReaction(message.id, 'like');
  };

  // Button 3: Dislike
  const handleDislike = () => {
    triggerHaptic();
    onToggleReaction(message.id, 'dislike');
  };

  // Button 4: Read Aloud toggle
  const handleReadAloud = () => {
    triggerHaptic();
    onToggleSpeak(message);
  };

  // Button 5: Share response
  const handleShare = async () => {
    triggerHaptic();
    const clean = extractCleanText(message.text);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Shadow AI Assistant Response',
          text: clean,
        });
        setShared(true);
        onShowFeedbackToast?.('Response shared successfully!');
        return;
      } catch (shareErr: any) {
        // User cancelling the share sheet throws AbortError; do not treat as error
        if (shareErr?.name === 'AbortError') return;
        console.warn('[Toolbar] Web Share error, falling back to copy:', shareErr);
      }
    }

    // Fallback: copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clean);
      }
      setShared(true);
      onShowFeedbackToast?.('Share unavailable — copied to clipboard!');
    } catch {
      onShowFeedbackToast?.('Could not share or copy response');
    }
  };

  // More Menu Action: Download response as a text file
  const handleDownloadFile = () => {
    triggerHaptic();
    setIsMenuOpen(false);
    try {
      const clean = extractCleanText(message.text);
      const blob = new Blob([clean], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadow-ai-response-${message.timestamp || Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowFeedbackToast?.('Response saved as .txt file!');
    } catch (e) {
      console.warn('[Toolbar] Download error:', e);
    }
  };

  return (
    <div className="relative mt-2 flex items-center gap-1 sm:gap-1.5 select-none pt-0.5">
      {/* 1. Copy Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy response'}
          title="Copy response"
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
            copied
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
          }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Small "Copied!" Inline Badge */}
        {copied && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-emerald-900 border border-emerald-500/60 text-[10px] text-emerald-200 font-medium whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 pointer-events-none z-30">
            Copied!
          </div>
        )}
      </div>

      {/* 2. Like Button */}
      <button
        type="button"
        onClick={handleLike}
        aria-label="Like response"
        aria-pressed={reaction === 'like'}
        title="Like response"
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
          reaction === 'like'
            ? 'bg-purple-950/70 border-purple-500/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
            : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
        }`}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 transition-transform ${
            reaction === 'like' ? 'fill-purple-400 scale-105' : ''
          }`}
        />
      </button>

      {/* 3. Dislike Button */}
      <button
        type="button"
        onClick={handleDislike}
        aria-label="Dislike response"
        aria-pressed={reaction === 'dislike'}
        title="Dislike response"
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
          reaction === 'dislike'
            ? 'bg-red-950/70 border-red-500/60 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.35)]'
            : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
        }`}
      >
        <ThumbsDown
          className={`w-3.5 h-3.5 transition-transform ${
            reaction === 'dislike' ? 'fill-red-400 scale-105' : ''
          }`}
        />
      </button>

      {/* 4. Read Aloud Button */}
      <button
        type="button"
        onClick={handleReadAloud}
        aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
        aria-pressed={isSpeaking}
        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
          isSpeaking
            ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse'
            : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
        }`}
      >
        {isSpeaking ? (
          <Square className="w-3 h-3 fill-cyan-400 text-cyan-400" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 5. Share Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleShare}
          aria-label={shared ? 'Shared' : 'Share response'}
          title="Share response"
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
            shared
              ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
          }`}
        >
          {shared ? (
            <Check className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Small "Shared!" Inline Badge */}
        {shared && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-indigo-900 border border-indigo-500/60 text-[10px] text-indigo-200 font-medium whitespace-nowrap shadow-lg animate-in fade-in zoom-in-95 pointer-events-none z-30">
            Shared!
          </div>
        )}
      </div>

      {/* 6. More Button & Dropdown Menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsMenuOpen((prev) => !prev);
          }}
          aria-label="More options"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          title="More options"
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-all duration-150 active:scale-95 ${
            isMenuOpen
              ? 'bg-slate-800 border-purple-500/60 text-purple-300'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Accessible Dropdown Popover */}
        {isMenuOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-48 rounded-xl bg-[#0b1222] border border-slate-700/80 shadow-2xl p-1 z-30 backdrop-blur-md animate-in fade-in zoom-in-95"
          >
            {/* Menu Item 1: Copy Response */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                handleCopy();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Copy response text</span>
            </button>

            {/* Menu Item 2: Read Aloud / Stop Reading */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                handleReadAloud();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5 text-cyan-400 shrink-0 fill-cyan-400" />
                  <span>Stop reading aloud</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Read aloud</span>
                </>
              )}
            </button>

            {/* Menu Item 3: Share Response */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                handleShare();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Share response</span>
            </button>

            <div className="h-px bg-slate-800 my-1" />

            {/* Menu Item 4: Download as .txt */}
            <button
              type="button"
              role="menuitem"
              onClick={handleDownloadFile}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Export as Text File (.txt)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
