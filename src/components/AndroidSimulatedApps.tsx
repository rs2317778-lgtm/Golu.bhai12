import React, { useState } from 'react';
import {
  X,
  Search,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Compass,
  Layers,
  Phone,
  PhoneCall,
  Delete,
  Wifi,
  Bluetooth,
  Sliders,
  Volume2,
  Camera,
  RotateCcw,
  Check,
  Shield,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  Flashlight,
  Zap,
  Play,
  Youtube,
  Instagram,
  MessageCircle,
  Image as ImageIcon,
  Send,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export type SimulatedAppType =
  | 'chrome'
  | 'maps'
  | 'settings'
  | 'dialer'
  | 'camera'
  | 'torch'
  | 'youtube'
  | 'instagram'
  | 'whatsapp'
  | 'gallery'
  | 'blocked_payment'
  | null;

interface AndroidSimulatedAppsProps {
  activeApp: SimulatedAppType;
  appParam?: string | null;
  onClose: () => void;
}

export const AndroidSimulatedApps: React.FC<AndroidSimulatedAppsProps> = ({
  activeApp,
  appParam,
  onClose,
}) => {
  if (!activeApp) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top simulated Android app title bar */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activeApp === 'blocked_payment' ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'
            }`}
          />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Android Intent: {activeApp}
          </span>
          {appParam && (
            <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
              ({appParam})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close simulated app"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* App Body */}
      <div className="flex-1 overflow-hidden relative">
        {activeApp === 'chrome' && <ChromeApp query={appParam} />}
        {activeApp === 'maps' && <MapsApp query={appParam} />}
        {activeApp === 'settings' && <SettingsApp subSetting={appParam} />}
        {activeApp === 'dialer' && <DialerApp initialNumber={appParam} />}
        {activeApp === 'camera' && <CameraApp />}
        {activeApp === 'torch' && <TorchApp initialState={appParam !== 'off'} />}
        {activeApp === 'youtube' && <YouTubeApp query={appParam} />}
        {activeApp === 'instagram' && <InstagramApp />}
        {activeApp === 'whatsapp' && <WhatsAppApp query={appParam} />}
        {activeApp === 'gallery' && <GalleryApp />}
        {activeApp === 'blocked_payment' && <BlockedPaymentApp targetApp={appParam} />}
      </div>
    </div>
  );
};

/* --- YouTube App Simulator --- */
const YouTubeApp: React.FC<{ query?: string | null }> = ({ query }) => {
  const [searchTerm, setSearchTerm] = useState(query || '');
  const deepLinkUrl = searchTerm
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`
    : 'https://www.youtube.com';

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] text-white overflow-y-auto">
      {/* Header */}
      <div className="p-3 bg-[#0f0f0f] border-b border-zinc-800 flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-1.5 text-red-500 font-bold text-base tracking-tight">
          <Youtube className="w-6 h-6 fill-red-600 text-red-600" />
          <span className="text-white text-sm font-display tracking-tight">YouTube</span>
        </div>
        <div className="flex-1 max-w-xs relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search YouTube..."
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-full text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
        <button
          onClick={() => window.open(deepLinkUrl, '_blank')}
          className="p-1.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-md"
          title="Open in YouTube"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Video Content Feed */}
      <div className="p-4 space-y-4">
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-300">Android Launch Intent Executed</p>
            <p className="text-[11px] text-zinc-400">Package: <code className="text-white font-mono">com.google.android.youtube</code></p>
          </div>
          <button
            onClick={() => window.open(deepLinkUrl, '_blank')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch YouTube</span>
          </button>
        </div>

        {/* Video Cards */}
        <div className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800">
          <div className="h-44 bg-gradient-to-tr from-purple-900 via-indigo-950 to-zinc-900 relative flex items-center justify-center">
            <Play className="w-12 h-12 text-white/80 fill-white/80" />
            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-[10px] rounded font-mono">14:28</span>
          </div>
          <div className="p-3">
            <h4 className="text-sm font-semibold line-clamp-2">
              {searchTerm ? `Top search results for "${searchTerm}"` : 'Shadow AI Android Assistant Architecture & Voice Demo'}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1">Tech Pulse • 420K views • 2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Instagram App Simulator --- */
const InstagramApp: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-black text-white overflow-y-auto">
      {/* Instagram Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-black z-10">
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-500" />
          <span className="font-serif italic font-bold text-lg">Instagram</span>
        </div>
        <button
          onClick={() => window.open('https://www.instagram.com', '_blank')}
          className="text-xs text-pink-400 hover:text-white flex items-center gap-1"
        >
          <span>Open App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="p-3 bg-pink-950/40 border border-pink-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-pink-300">Instagram Intent Launched</p>
            <p className="text-[11px] text-zinc-400">Package: <code className="text-white font-mono">com.instagram.android</code></p>
          </div>
          <button
            onClick={() => window.open('https://www.instagram.com', '_blank')}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-xl shadow"
          >
            Launch Instagram
          </button>
        </div>

        {/* Stories bar */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {['ShadowAI', 'AndroidDev', 'CyberFuture', 'TechDaily'].map((user, i) => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600">
                <div className="w-full h-full rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center font-bold text-xs text-pink-400">
                  {user[0]}
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 truncate max-w-[60px]">{user}</span>
            </div>
          ))}
        </div>

        {/* Post Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">S</div>
            <span className="text-xs font-semibold">shadow_assistant_official</span>
          </div>
          <div className="h-48 bg-gradient-to-br from-indigo-950 to-purple-900 rounded-xl flex items-center justify-center text-cyan-300 font-mono text-xs">
            [Instagram Photo Post View]
          </div>
          <p className="text-xs text-zinc-300 mt-2">
            Voice command "Instagram kholo" successfully executed via safe intent!
          </p>
        </div>
      </div>
    </div>
  );
};

/* --- WhatsApp App Simulator --- */
const WhatsAppApp: React.FC<{ query?: string | null }> = ({ query }) => {
  const [msg, setMsg] = useState(query || '');

  return (
    <div className="h-full flex flex-col bg-[#0b141a] text-white">
      {/* Header */}
      <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-emerald-950">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-400 fill-emerald-500" />
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">WhatsApp</h4>
            <p className="text-[10px] text-emerald-400">Online • Intent Ready</p>
          </div>
        </div>
        <button
          onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg || 'Hello from Shadow AI')}`, '_blank')}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow"
        >
          <span>Open WhatsApp</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 flex-1 space-y-3 overflow-y-auto">
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
          <p className="text-xs font-bold text-emerald-300">WhatsApp Intent Active</p>
          <p className="text-[11px] text-zinc-400">Package: <code className="text-white font-mono">com.whatsapp</code></p>
          <p className="text-xs text-zinc-300 mt-1">
            Command "WhatsApp kholo" registered. Tapping below will open your native WhatsApp app or chat with predefined text.
          </p>
        </div>

        <div className="p-3 bg-[#111b21] rounded-2xl border border-zinc-800 space-y-2">
          <label className="text-xs text-emerald-400 font-semibold">Pre-fill Message to Send:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type message for WhatsApp..."
              className="flex-1 bg-[#202c33] border border-zinc-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg || 'Hello from Shadow AI')}`, '_blank')}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Photos & Gallery App Simulator --- */
const GalleryApp: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-[#121212] text-white overflow-y-auto">
      <div className="p-3 bg-[#1e1e1e] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm">Photos & Gallery</span>
        </div>
        <span className="text-[11px] text-cyan-400 font-mono">MediaStore Intent</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl">
          <p className="text-xs font-bold text-cyan-300">Android Gallery Opened</p>
          <p className="text-[11px] text-zinc-400">Intent: <code className="text-white font-mono">Intent.ACTION_VIEW (image/*)</code></p>
          <p className="text-xs text-zinc-300 mt-1">
            "Gallery kholo" command executed. You can browse, select, or upload images directly to Shadow AI for vision analysis.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            'bg-gradient-to-tr from-cyan-900 to-blue-900',
            'bg-gradient-to-tr from-purple-900 to-indigo-900',
            'bg-gradient-to-tr from-emerald-900 to-teal-900',
            'bg-gradient-to-tr from-amber-900 to-orange-900',
            'bg-gradient-to-tr from-pink-900 to-rose-900',
            'bg-gradient-to-tr from-violet-900 to-fuchsia-900',
          ].map((grad, i) => (
            <div key={i} className={`aspect-square ${grad} rounded-xl border border-zinc-700/60 flex items-center justify-center p-2 text-center`}>
              <span className="text-[10px] text-white/80 font-mono">Photo #{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* --- Blocked Payment & Banking App Screen --- */
const BlockedPaymentApp: React.FC<{ targetApp?: string | null }> = ({ targetApp }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-red-950/80 via-black to-slate-950 text-white text-center">
      <div className="w-20 h-20 rounded-full bg-red-900/40 border-2 border-red-500 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse">
        <ShieldAlert className="w-10 h-10 text-red-400" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono font-bold mb-3 uppercase tracking-wider">
        <Lock className="w-3.5 h-3.5" />
        <span>ACCESS RESTRICTED • FINANCIAL PROTECTION</span>
      </div>

      <h3 className="text-xl font-bold font-display text-white mb-2">
        Payment & Banking App Blocked
      </h3>

      <div className="max-w-md bg-red-950/40 border border-red-500/40 rounded-2xl p-4 text-left space-y-2 mb-4">
        <p className="text-xs text-red-200 leading-relaxed font-semibold">
          सुरक्षा नीति (Mandatory Financial Safeguard):
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          Shadow AI किसी भी UPI, पेमेंट या बैंकिंग ऐप (<span className="text-red-400 font-semibold">{targetApp || 'Paytm / PhonePe / GPay / BHIM'}</span>) को voice या text command से खोलने या ऑटोमेट करने से रोकता है।
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          यह प्रतिबंध आपके बैंक खातों, UPI पिन, पासवर्ड, और OTPs को किसी भी दुर्भावनापूर्ण या दुर्घटनावश पहुँच से 100% सुरक्षित रखने के लिए बनाया गया है।
        </p>
      </div>

      <div className="p-3 bg-black/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 max-w-md w-full">
        <div className="flex justify-between items-center text-slate-400 mb-1">
          <span>Target Requested:</span>
          <span className="text-red-400 font-mono font-bold">{targetApp || 'UPI / Banking Application'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <span>Security Action:</span>
          <span className="text-emerald-400 font-mono font-bold">Strict Intent Rejection</span>
        </div>
      </div>
    </div>
  );
};

/* --- Chrome Browser Simulator --- */
const ChromeApp: React.FC<{ query?: string | null }> = ({ query }) => {
  const [url] = useState(
    query
      ? query.startsWith('http')
        ? query
        : `https://www.google.com/search?q=${encodeURIComponent(query)}`
      : 'https://www.google.com'
  );

  return (
    <div className="h-full flex flex-col bg-[#1f1f23] text-white">
      <div className="p-2.5 bg-[#2b2a33] flex items-center gap-2 border-b border-slate-700">
        <button className="text-slate-400 hover:text-white p-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button className="text-slate-400 hover:text-white p-1">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 bg-[#1c1b22] px-3 py-1.5 rounded-full text-xs text-slate-300 flex items-center justify-between truncate border border-slate-700">
          <span className="truncate">{url}</span>
          <ExternalLink
            className="w-3.5 h-3.5 text-cyan-400 cursor-pointer shrink-0 ml-1"
            onClick={() => window.open(url, '_blank')}
          />
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-[#121214]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-500 via-yellow-400 to-green-500 p-0.5 mb-4 shadow-lg flex items-center justify-center">
          <div className="w-full h-full bg-[#121214] rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold font-display text-white">G</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Google Chrome (Intent Executed)</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Safe Android Intent executed: <code className="text-cyan-400">android.intent.action.VIEW (Chrome)</code>.
          {query && ` Query: "${query}"`}
        </p>
        <button
          onClick={() => window.open(url, '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open Real Webpage in Browser
        </button>
      </div>
    </div>
  );
};

/* --- Google Maps Simulator --- */
const MapsApp: React.FC<{ query?: string | null }> = ({ query }) => {
  const destination = query || 'Connaught Place, New Delhi';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

  return (
    <div className="h-full flex flex-col bg-[#1a233a] text-white relative">
      <div className="absolute top-4 left-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-xl">
        <MapPin className="w-5 h-5 text-red-500 shrink-0" />
        <div className="flex-1 truncate">
          <p className="text-xs font-bold text-white truncate">{destination}</p>
          <p className="text-[10px] text-cyan-400">Google Maps GPS Intent Active</p>
        </div>
        <button
          onClick={() => window.open(mapsUrl, '_blank')}
          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="w-72 h-72 rounded-full border border-cyan-500/20 flex items-center justify-center animate-pulse">
          <div className="w-48 h-48 rounded-full border border-purple-500/30 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-cyan-400/50 flex items-center justify-center bg-cyan-950/40">
              <MapPin className="w-8 h-8 text-red-500 animate-bounce" />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-300 font-mono mt-4 text-center px-4">
          GPS Coordinates • Intent: <code className="text-cyan-400">geo:0,0?q={encodeURIComponent(destination)}</code>
        </p>
      </div>
    </div>
  );
};

/* --- System Settings Simulator --- */
const SettingsApp: React.FC<{ subSetting?: string | null }> = ({ subSetting }) => {
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(false);

  return (
    <div className="h-full flex flex-col bg-[#121214] text-white p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-xl font-bold font-display text-white">Android System Settings</h3>
        <p className="text-xs text-slate-400 font-mono">
          Action: {subSetting ? `android.settings.${subSetting.toUpperCase()}_SETTINGS` : 'android.settings.SETTINGS'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Wi-Fi</p>
              <p className="text-xs text-slate-400">{wifiOn ? 'Connected to 5GHz CyberNet' : 'Disconnected'}</p>
            </div>
          </div>
          <button
            onClick={() => setWifiOn(!wifiOn)}
            className={`w-12 h-6 rounded-full transition-colors relative ${wifiOn ? 'bg-cyan-500' : 'bg-slate-700'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${wifiOn ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Bluetooth</p>
              <p className="text-xs text-slate-400">{bluetoothOn ? 'Paired (Shadow Audio)' : 'Off'}</p>
            </div>
          </div>
          <button
            onClick={() => setBluetoothOn(!bluetoothOn)}
            className={`w-12 h-6 rounded-full transition-colors relative ${bluetoothOn ? 'bg-purple-500' : 'bg-slate-700'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${bluetoothOn ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Dialer Simulator --- */
const DialerApp: React.FC<{ initialNumber?: string | null }> = ({ initialNumber }) => {
  const [phoneNumber, setPhoneNumber] = useState(initialNumber || '');

  return (
    <div className="h-full flex flex-col justify-between bg-[#111] text-white p-6">
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 font-mono mb-1">Android Action: ACTION_DIAL</p>
        <div className="h-12 flex items-center justify-center">
          <span className="text-2xl font-mono font-bold text-white tracking-widest">
            {phoneNumber || 'Enter Number'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full my-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
          <button
            key={digit}
            onClick={() => setPhoneNumber((prev) => prev + digit)}
            className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-white flex items-center justify-center active:scale-95 transition-transform"
          >
            {digit}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 pb-4">
        {phoneNumber && (
          <button
            onClick={() => setPhoneNumber((prev) => prev.slice(0, -1))}
            className="w-12 h-12 rounded-full text-slate-400 hover:text-white flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => window.open(`tel:${phoneNumber}`, '_self')}
          className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <PhoneCall className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};

/* --- Camera Simulator --- */
const CameraApp: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between bg-black text-white relative">
      <div className="p-4 flex items-center justify-between z-10 bg-black/40 backdrop-blur-sm">
        <span className="text-xs font-mono text-cyan-400">CAMERA • 4K 60FPS</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-6 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-md">
          <Camera className="w-16 h-16 text-cyan-400 mx-auto mb-3 animate-pulse" />
          <h4 className="text-base font-bold text-white">Camera Viewfinder Active</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            "Camera kholo" triggered Android MediaStore Capture Intent.
          </p>
        </div>
      </div>
    </div>
  );
};

/* --- Torch / Flashlight Simulator --- */
const TorchApp: React.FC<{ initialState?: boolean }> = ({ initialState = true }) => {
  const [isTorchOn, setIsTorchOn] = useState(initialState);

  return (
    <div
      className={`h-full flex flex-col justify-between p-6 transition-all duration-300 ${
        isTorchOn
          ? 'bg-gradient-to-b from-amber-950/40 via-slate-950 to-black'
          : 'bg-[#050811]'
      }`}
    >
      <div className="text-center pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300 mb-2">
          <Zap
            className={`w-3.5 h-3.5 ${
              isTorchOn ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'
            }`}
          />
          <span>CameraManager.setTorchMode({isTorchOn ? 'true' : 'false'})</span>
        </div>
        <h3 className="text-xl font-bold font-display text-white">
          Shadow Torch Controller
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Hardware Flashlight API • Android 6.0+ (API 23+)
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {isTorchOn && (
          <div className="absolute w-72 h-72 rounded-full bg-amber-400/20 blur-3xl pointer-events-none animate-pulse" />
        )}

        <button
          onClick={() => setIsTorchOn(!isTorchOn)}
          className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 border-4 ${
            isTorchOn
              ? 'bg-amber-400 text-black border-white shadow-[0_0_60px_rgba(251,191,36,0.7)] scale-105'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
          }`}
          title="Toggle Torch"
        >
          <Flashlight
            className={`w-12 h-12 stroke-[2.2] mb-1 ${isTorchOn ? 'animate-bounce' : ''}`}
          />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">
            {isTorchOn ? 'TORCH ON' : 'TORCH OFF'}
          </span>
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
        <div className="flex items-center justify-between text-slate-400">
          <span>Android Permission:</span>
          <span className="text-emerald-400 font-bold font-mono">
            android.permission.FLASHLIGHT
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Supported Command:</span>
          <span className="text-cyan-300 font-mono">
            "Torch chalao" / "Torch band karo"
          </span>
        </div>
      </div>
    </div>
  );
};
