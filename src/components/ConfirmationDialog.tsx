import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-[#0e172a] to-[#050914] border border-purple-500/30 p-6 shadow-2xl">
        {/* Glow corner */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl border ${
              isDestructive
                ? 'bg-red-950/50 border-red-500/40 text-red-400'
                : 'bg-purple-950/50 border-purple-500/40 text-purple-400'
            }`}
          >
            {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white tracking-wide font-display">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-lg ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-900/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
