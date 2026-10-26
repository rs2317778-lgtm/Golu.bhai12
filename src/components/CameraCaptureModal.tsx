import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Shield, Check, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, file: File) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setErrorMessage(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment. Use direct file capture.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionState('granted');
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser or device settings.');
      } else {
        setErrorMessage(err.message || 'Could not start camera stream.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `shadow_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          onCapture(dataUrl, file);
          onClose();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopCamera();
        onCapture(reader.result, file);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#070d1e] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20 bg-[#091228] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Shadow Vision Camera</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Capture photo for instant AI analysis in Hindi/English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black min-h-[300px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          {flashEffect && <div className="absolute inset-0 bg-white z-30 animate-flash" />}

          {errorMessage ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Camera Access Issue</h4>
              <p className="text-xs text-slate-400 mb-4">{errorMessage}</p>

              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-medium text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo with Device Camera</span>
                </button>
                <input
                  ref={fileFallbackRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFallbackFileSelect}
                />
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[500px]"
              />

              {/* Viewfinder crosshairs & sci-fi overlays */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-60 sm:h-60 border-2 border-dashed border-cyan-400/50 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-cyan-300 rounded-full" />
                </div>
              </div>

              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-black/80 transition-all z-20"
                title="Switch Camera (Front/Back)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Privacy Badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-300 z-20">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Zero-Retention Camera</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#050915] border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400">
            <span className="block font-medium text-slate-200">Point & Click</span>
            <span className="text-[10px] text-slate-500">Tap shutter to capture photo</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={Boolean(errorMessage) || isInitializing}
              onClick={handleCapture}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:opacity-95 text-black font-bold text-xs shadow-lg shadow-cyan-900/40 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-40"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span>Capture Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
