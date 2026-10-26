import React from 'react';
import { MediaAttachment } from '../types.ts';
import { X, Film, Image as ImageIcon, FileText, Sparkles, AlertTriangle, Play, HelpCircle, Wand2 } from 'lucide-react';

interface MediaPreviewTrayProps {
  media: MediaAttachment;
  onRemove: () => void;
  onSelectPrompt: (promptText: string) => void;
  uploadProgress?: number; // 0 - 100
  isProcessing?: boolean;
}

export function MediaPreviewTray({
  media,
  onRemove,
  onSelectPrompt,
  uploadProgress,
  isProcessing,
}: MediaPreviewTrayProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isVideo = media.type === 'video';
  const isFile = media.type === 'file';
  const isImage = media.type === 'image';
  const isLarge = media.size > (isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024);

  const quickPrompts = isVideo
    ? [
        { labelHi: 'Is video me kya ho raha hai?', labelEn: 'What is happening in this video?' },
        { labelHi: 'Key events aur summary batayein', labelEn: 'Summarize key events in this clip' },
        { labelHi: 'Objects aur log pehchano', labelEn: 'Identify people, vehicles and objects' },
      ]
    : isFile
    ? [
        { labelHi: 'Is document ka summary batayein', labelEn: 'Summarize this document' },
        { labelHi: 'Key points samjhao Hindi me', labelEn: 'Explain key points in Hindi' },
        { labelHi: 'Is file me kya important hai?', labelEn: 'What are the main takeaways?' },
      ]
    : [
        { labelHi: 'Photo clear kar do', labelEn: 'Enhance this photo clarity' },
        { labelHi: 'Is photo me kya-kya hai?', labelEn: 'What is in this photo?' },
        { labelHi: 'Photo ka text padh kar samjhao (OCR)', labelEn: 'Read and translate any text in image' },
      ];

  return (
    <div className="mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-[#0a1224] border border-cyan-500/30 shadow-xl backdrop-blur-md animate-fadeIn">
      {/* Top Details & Remove Button */}
      <div className="flex items-start gap-3">
        {/* Media Thumbnail / Preview */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black/60 border border-slate-700 shrink-0 flex items-center justify-center">
          {isVideo ? (
            media.previewUrl && media.previewUrl.trim() !== '' ? (
              <video
                src={media.previewUrl}
                className="w-full h-full object-cover"
                controls={false}
                muted
                playsInline
              />
            ) : (
              <Film className="w-8 h-8 text-amber-400" />
            )
          ) : isImage ? (
            media.previewUrl && media.previewUrl.trim() !== '' ? (
              <img
                src={media.previewUrl}
                alt={media.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-cyan-400" />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-cyan-400">
              <FileText className="w-8 h-8 mb-1 text-cyan-400" />
              <span className="text-[9px] font-mono uppercase text-slate-300 truncate max-w-[70px]">
                {media.name.split('.').pop() || 'DOC'}
              </span>
            </div>
          )}

          {/* Badge Overlay */}
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-black/70 backdrop-blur-sm text-cyan-300 border border-cyan-500/40">
            {isVideo ? (
              <Film className="w-2.5 h-2.5 text-amber-400" />
            ) : isImage ? (
              <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
            ) : (
              <FileText className="w-2.5 h-2.5 text-purple-400" />
            )}
            <span>{isVideo ? 'VIDEO' : isImage ? 'PHOTO' : 'FILE'}</span>
          </div>

          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 rounded-full bg-black/60 border border-white/50 flex items-center justify-center text-white">
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Info & Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-white truncate" title={media.name}>
              {media.name}
            </h4>
            <button
              type="button"
              onClick={onRemove}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-400 flex items-center justify-center transition-colors shrink-0"
              title="Remove media"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
            <span>{formatSize(media.size)}</span>
            <span>•</span>
            <span className="truncate">{media.mimeType}</span>
          </div>

          {/* Large file notice */}
          {isLarge && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Large media • Shadow AI will optimize for stream analysis</span>
            </div>
          )}

          {/* Upload / Analysis Progress Bar */}
          {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2 w-full">
              <div className="flex justify-between text-[10px] text-cyan-300 mb-1">
                <span>Uploading to Shadow Vision...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-300 animate-pulse font-mono">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Shadow Vision AI is analyzing media in Hindi/English...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Question Chips for Hindi / English */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Quick question suggestions (Tap to ask):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(p.labelHi)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/70 text-slate-300 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-500/50 transition-all flex items-center gap-1"
            >
              {p.labelHi.includes('clear') && <Wand2 className="w-2.5 h-2.5 text-purple-400" />}
              <span>{p.labelHi}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
