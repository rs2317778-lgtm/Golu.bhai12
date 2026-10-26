import React, { useState } from 'react';
import { NoteItem } from '../types.ts';
import { Bell, Check, Clock, Plus, Search, Trash2, X, Calendar, FileText } from 'lucide-react';

interface NotesRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesRemindersModal: React.FC<NotesRemindersModalProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'reminders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isReminder, setIsReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  if (!isOpen) return null;

  const filteredNotes = notes.filter((n) => {
    if (activeTab === 'notes' && n.isReminder) return false;
    if (activeTab === 'reminders' && !n.isReminder) return false;
    if (!searchQuery) return true;
    return (
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    onAddNote({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      isReminder,
      reminderDate: isReminder ? reminderDate : undefined,
      reminderTime: isReminder ? reminderTime : undefined,
    });

    setTitle('');
    setContent('');
    setIsReminder(false);
    setReminderDate('');
    setReminderTime('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#080d1a] border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-display">
                Notes & Reminders
              </h2>
              <p className="text-xs text-slate-400">
                Created via voice command or keyboard
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

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes or reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'notes'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes ({notes.filter((n) => !n.isReminder).length})
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'reminders'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reminders ({notes.filter((n) => n.isReminder).length})
            </button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            New Item
          </button>
        </div>

        {/* Create Form Drawer */}
        {isCreating && (
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-purple-950/20 border-b border-purple-500/30 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase font-mono">
                Create Note / Reminder
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="Title (e.g. Call Client, Grocery List)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />

            <textarea
              placeholder="Note details / description..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isReminder}
                  onChange={(e) => setIsReminder(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                />
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                  Set as Reminder
                </span>
              </label>

              {isReminder && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow transition-all ml-auto"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 stroke-[1.2] text-slate-600 mb-2" />
              <p className="text-sm font-medium">No notes or reminders found</p>
              <p className="text-xs text-slate-600 mt-1">
                Say "Note banao [topic]" or click 'New Item' above
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {note.isReminder ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                        <Clock className="w-2.5 h-2.5" />
                        Reminder
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                        <FileText className="w-2.5 h-2.5" />
                        Note
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {note.title}
                    </h4>
                  </div>

                  {note.content && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span>
                      {new Date(note.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {note.isReminder && (note.reminderDate || note.reminderTime) && (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {note.reminderDate || ''} {note.reminderTime || ''}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="opacity-60 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
