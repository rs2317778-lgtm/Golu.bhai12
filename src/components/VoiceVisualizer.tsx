import React, { useEffect, useState } from 'react';
import { Brain, Mic, Volume2, Square } from 'lucide-react';

interface VoiceVisualizerProps {
  mode: 'listening' | 'thinking' | 'speaking' | 'idle';
  audioLevel?: number; // 0 to 1
  label?: string;
  onCancel?: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  mode,
  audioLevel = 0.5,
  label,
  onCancel,
}) => {
  const [pulseBars, setPulseBars] = useState<number[]>([15, 25, 45, 60, 45, 25, 15]);

  useEffect(() => {
    if (mode === 'idle') {
      setPulseBars([15, 20, 25, 30, 25, 20, 15]);
      return;
    }

    const interval = setInterval(() => {
      if (mode === 'thinking') {
        // Smooth sine wave cycle for thinking neural pattern
        const time = Date.now() / 250;
        const newHeights = Array.from({ length: 9 }).map((_, i) => {
          const wave = Math.sin(time + i * 0.7) * 35 + 50;
          return Math.max(15, Math.min(95, wave));
        });
        setPulseBars(newHeights);
        return;
      }

      const multiplier = mode === 'listening' ? 1 : 0.8;
      const baseLevel = audioLevel > 0 ? audioLevel : 0.5;
      const newHeights = Array.from({ length: 9 }).map((_, i) => {
        const centerDistance = Math.abs(i - 4);
        const factor = Math.max(0.25, 1 - centerDistance * 0.18);
        const randomJitter = Math.random() * 35;
        return Math.min(100, Math.max(15, (baseLevel * 80 + randomJitter) * factor * multiplier));
      });
      setPulseBars(newHeights);
    }, 90);

    return () => clearInterval(interval);
  }, [mode, audioLevel]);

  if (mode === 'idle') return null;

  const isListening = mode === 'listening';
  const isThinking = mode === 'thinking';
  const isSpeaking = mode === 'speaking';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 shadow-xl backdrop-blur-md transition-all duration-300 border ${
        isThinking
          ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/80 to-cyan-950/60 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
          : isListening
          ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-blue-950/70 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
          : 'bg-gradient-to-r from-purple-950/70 via-slate-900/90 to-blue-950/70 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
      }`}
    >
      {/* Background neon sweep line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent ${
          isThinking
            ? 'via-amber-400'
            : isListening
            ? 'via-cyan-400'
            : 'via-purple-400'
        } to-transparent animate-pulse`}
      />

      <div className="flex items-center justify-between gap-3">
        {/* State indicator badge */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isThinking
                  ? 'bg-amber-400'
                  : isListening
                  ? 'bg-cyan-400'
                  : 'bg-purple-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 items-center justify-center ${
                isThinking
                  ? 'bg-amber-500'
                  : isListening
                  ? 'bg-cyan-500'
                  : 'bg-purple-600'
              }`}
            />
          </span>

          <div className="flex items-center gap-1.5">
            {isThinking ? (
              <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : isListening ? (
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            )}

            <span
              className={`text-xs font-semibold tracking-wider uppercase font-mono ${
                isThinking
                  ? 'text-amber-300'
                  : isListening
                  ? 'text-cyan-300'
                  : 'text-purple-300'
              }`}
            >
              {label ||
                (isThinking
                  ? 'Soch raha hai... (Thinking...)'
                  : isListening
                  ? 'Sun raha hoon... (Listening...)'
                  : 'Shadow AI Speaking...')}
            </span>
          </div>
        </div>

        {/* Right side controls: Equalizer bars + Stop/Cancel button */}
        <div className="flex items-center gap-2">
          {/* Audio Equalizer Wave Bars */}
          <div className="flex items-center gap-1 h-7 px-1.5">
            {pulseBars.map((height, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isThinking
                    ? 'bg-gradient-to-t from-amber-500 via-yellow-300 to-white shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : isListening
                    ? 'bg-gradient-to-t from-cyan-500 via-sky-300 to-white shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : 'bg-gradient-to-t from-purple-600 via-fuchsia-400 to-white shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          {/* Interrupt / Stop action */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white transition-all text-[10px] font-mono flex items-center gap-1 active:scale-95"
              title="Stop voice (Ruk jao)"
            >
              <Square className="w-3 h-3 fill-red-400" />
              <span className="hidden sm:inline">Ruk Jao</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
