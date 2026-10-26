import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  Download,
  RotateCcw,
  Send,
  Sliders,
  Check,
  Eye,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';

interface ImageWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create_image' | 'enhance_photo';
  initialPrompt?: string;
  initialImage?: string; // base64 or preview url
  onInsertToChat: (item: {
    type: 'generated_image' | 'enhanced_image';
    url: string;
    prompt?: string;
    originalUrl?: string;
  }) => void;
}

export const ImageWorkflowModal: React.FC<ImageWorkflowModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialPrompt = '',
  initialImage,
  onInsertToChat,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(initialImage || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharpnessLevel, setSharpnessLevel] = useState(65);
  const [contrastLevel, setContrastLevel] = useState(120);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Handle AI Image Generation
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();

      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        setErrorMessage(
          data.error ||
            'AI Image Servers busy hain ya quota limit reach hui hai. Kripya punah prayas karein.'
        );
      }
    } catch (err: any) {
      setErrorMessage('Network connection error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Genuine Canvas Image Enhancement Workflow ("Photo clear kar do")
  const applyCanvasEnhancement = (imgSrc: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Apply CSS filter for brightness, contrast, and saturation
      ctx.filter = `contrast(${contrastLevel}%) saturate(115%) brightness(105%)`;
      ctx.drawImage(img, 0, 0);

      // Perform genuine pixel-level unsharp masking / sharpness enhancement
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const factor = sharpnessLevel / 100;

        // Laplacian kernel for edge sharpening
        // [  0, -1,  0 ]
        // [ -1,  5, -1 ]
        // [  0, -1,  0 ]
        const copy = new Uint8ClampedArray(data);
        const w = canvas.width;
        const h = canvas.height;

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const center = copy[idx + c];
              const up = copy[((y - 1) * w + x) * 4 + c];
              const down = copy[((y + 1) * w + x) * 4 + c];
              const left = copy[(y * w + (x - 1)) * 4 + c];
              const right = copy[(y * w + (x + 1)) * 4 + c];

              const sharp = 5 * center - up - down - left - right;
              data[idx + c] = Math.min(255, Math.max(0, center * (1 - factor) + sharp * factor));
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        console.warn('Canvas pixel manipulation fallback applied:', e);
      }

      const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setEnhancedImageUrl(enhancedDataUrl);
    };
    img.src = imgSrc;
  };

  const handleDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-lg bg-[#080d1a] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0c1428] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400">
              {mode === 'create_image' ? <Sparkles className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'create_image' ? 'Shadow AI Image Generator' : 'Photo Clear & Clarity Enhancer'}
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono">
                {mode === 'create_image' ? 'Model: gemini-3.1-flash-lite-image' : 'Adaptive Unsharp Mask & Dynamic Contrast'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {mode === 'create_image' ? (
            /* --- Create Image UI --- */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Image Prompt (Hindi or English):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Cyberpunk supercar racing in futuristic Delhi at night..."
                    className="flex-1 bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample prompt chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Neon cyber tiger in digital jungle',
                  'Futuristic Indian city with flying drones',
                  'Astronaut meditating on Mars with purple nebula',
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(s)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Generated Image Result */}
              {generatedImageUrl && generatedImageUrl.trim() !== '' && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="relative rounded-2xl overflow-hidden border border-cyan-500/50 shadow-2xl bg-black">
                    <img
                      src={generatedImageUrl}
                      alt={prompt}
                      className="w-full h-auto object-cover max-h-80 mx-auto"
                    />
                    <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/80 backdrop-blur-md rounded-xl text-[10px] text-slate-300">
                      <span className="font-semibold text-cyan-300">Prompt:</span> {prompt}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(generatedImageUrl, `shadow-ai-${Date.now()}.png`)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save Image</span>
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>
                    <button
                      onClick={() => {
                        onInsertToChat({
                          type: 'generated_image',
                          url: generatedImageUrl,
                          prompt,
                        });
                        onClose();
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Chat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* --- Enhance Photo ("Photo clear kar do") UI --- */
            <div className="space-y-4">
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-xs text-purple-200">
                <span className="font-bold">Original Image Preserved:</span> Both the original photo and the enhanced version are kept separate. Real pixel-level unsharp masking and contrast boost are applied.
              </div>

              {!originalImage ? (
                /* Select photo input if none provided */
                <div className="p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                  <ImageIcon className="w-10 h-10 text-slate-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Select a photo to enhance</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG, WEBP up to 20MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const src = ev.target?.result as string;
                          setOriginalImage(src);
                          applyCanvasEnhancement(src);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Before & After Comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>मूल फोटो (Original)</span>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-black border border-slate-800">
                        {originalImage && originalImage.trim() !== '' ? (
                          <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                            No Photo Selected
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                        <span>एन्हांस्ड (Enhanced)</span>
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 rounded border border-cyan-500/40">Clean</span>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-black border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        {enhancedImageUrl && enhancedImageUrl.trim() !== '' ? (
                          <img src={enhancedImageUrl} alt="Enhanced" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                            Processing...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhancement Sliders */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Clarity / Sharpness:</span>
                      </span>
                      <span className="font-mono text-cyan-400">{sharpnessLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={sharpnessLevel}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSharpnessLevel(val);
                        if (originalImage) applyCanvasEnhancement(originalImage);
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Dynamic Contrast Boost:</span>
                      </span>
                      <span className="font-mono text-purple-400">{contrastLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="160"
                      value={contrastLevel}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setContrastLevel(val);
                        if (originalImage) applyCanvasEnhancement(originalImage);
                      }}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {enhancedImageUrl && (
                      <button
                        onClick={() => handleDownload(enhancedImageUrl, `shadow-enhanced-${Date.now()}.jpg`)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Enhanced</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (enhancedImageUrl && originalImage) {
                          onInsertToChat({
                            type: 'enhanced_image',
                            url: enhancedImageUrl,
                            originalUrl: originalImage,
                          });
                          onClose();
                        }
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Insert in Chat</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
