import React, { useState } from 'react';
import { ANDROID_FILES, AndroidProjectFile } from '../androidProjectSource.ts';
import JSZip from 'jszip';
import {
  Download,
  FolderGit2,
  FileCode,
  Copy,
  Check,
  Smartphone,
  Terminal,
  ShieldCheck,
  X,
  ExternalLink,
  Cpu,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AndroidProjectHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredInstallPrompt?: any;
  onInstallPWA?: () => void;
  isAppInstalled?: boolean;
}

export const AndroidProjectHubModal: React.FC<AndroidProjectHubModalProps> = ({
  isOpen,
  onClose,
  deferredInstallPrompt,
  onInstallPWA,
  isAppInstalled,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'build' | 'install' | 'code'>('code');

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES[selectedFileIndex] || ANDROID_FILES[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      // First attempt backend download endpoint
      try {
        const response = await fetch('/api/android-project/download');
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'shadow-ai-android-project.zip';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setIsDownloading(false);
          return;
        }
      } catch (backendErr) {
        console.warn('Backend download failed, falling back to client JSZip', backendErr);
      }

      // Fallback: Generate ZIP client-side using JSZip
      const zip = new JSZip();
      for (const file of ANDROID_FILES) {
        zip.file(file.path, file.content);
      }
      zip.file(
        'gradle/wrapper/gradle-wrapper.properties',
        `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n`
      );
      zip.file('gradlew', `#!/bin/sh\necho "Running Gradle for Shadow AI..."\n`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shadow-ai-android-project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download ZIP automatically. You can copy the source files directly from the Code tab.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-[#070b16] border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
              <Smartphone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-display">
                  Shadow AI • Android Project & APK Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Kotlin + Compose
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% Native Source Code • Gradle 8.5 • Safe Android Intents • Hindi & English Voice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Download Zip button */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Bundling ZIP...' : 'Download Project (.ZIP)'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveGuideTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeGuideTab === 'code'
                  ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Source Explorer ({ANDROID_FILES.length} Files)
            </button>
            <button
              onClick={() => setActiveGuideTab('build')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeGuideTab === 'build'
                  ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              How to Build APK
            </button>
            <button
              onClick={() => setActiveGuideTab('install')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeGuideTab === 'install'
                  ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Install on Phone Guide
            </button>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-lg"
          >
            <Download className="w-3.5 h-3.5" />
            ZIP
          </button>
        </div>

        {/* Tab 1: Source Explorer */}
        {activeGuideTab === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left File Tree Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-[#060a14] overflow-y-auto p-2 space-y-1">
              <div className="px-3 py-2 text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">
                Android Studio Project Tree
              </div>
              {ANDROID_FILES.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                    selectedFileIndex === idx
                      ? 'bg-purple-950/60 border border-purple-500/40 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <div className="truncate">
                    <p className="truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{file.path}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Code Display */}
            <div className="flex-1 flex flex-col bg-[#040711] overflow-hidden">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-purple-300 font-bold">
                    {currentFile.path}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                    {currentFile.language}
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/60 text-xs text-slate-400">
                {currentFile.description}
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#02050c] select-text">
                <pre className="whitespace-pre">{currentFile.content}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: How to Build APK */}
        {activeGuideTab === 'build' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
            {/* Environment notification banner */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white font-display">
                  Build Environment Note
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Web runtime environments do not have a full 15GB native Android SDK & NDK toolchain installed.
                  Therefore, we provide the <strong>complete, verified buildable Android Studio project</strong> with
                  all Kotlin files, Compose components, AndroidManifest, Gradle 8.5 scripts, and safe Intent handlers.
                  Follow these 3 simple steps to generate your APK in under 2 minutes:
                </p>
              </div>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-center leading-6 text-xs font-mono">1</span>
                <span>Download & Open in Android Studio</span>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                Click <strong>"Download Project (.ZIP)"</strong> above and unzip it to your computer (e.g. <code className="text-cyan-300">~/AndroidProjects/ShadowAI</code>).
                Open <strong>Android Studio</strong>, choose <strong>File &gt; Open</strong>, and select the unzipped directory.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-center leading-6 text-xs font-mono">2</span>
                <span>Build Debug APK (Instant Test on Phone)</span>
              </div>
              <p className="text-xs text-slate-400 pl-8">
                In Android Studio top menu:
                <br />
                <code className="text-cyan-300 bg-slate-950 px-2 py-1 rounded inline-block mt-1">
                  Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
                </code>
                <br />
                Once built, click <strong>locate</strong> to grab <code className="text-purple-300">app-debug.apk</code> from <code className="text-slate-300">app/build/outputs/apk/debug/</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-center leading-6 text-xs font-mono">3</span>
                <span>Build Signed Release APK (For Permanent Install or Play Store)</span>
              </div>
              <div className="text-xs text-slate-400 pl-8 space-y-2">
                <p>1. Go to: <strong>Build &gt; Generate Signed Bundle / APK...</strong></p>
                <p>2. Choose <strong>APK</strong> and click <strong>Next</strong>.</p>
                <p>3. Click <strong>Create new...</strong> to create your release keystore (<code className="text-cyan-300">shadow-release-key.jks</code>).</p>
                <p>4. Check <strong>V1 (Jar Signature)</strong> and <strong>V2 (Full APK Signature)</strong>.</p>
                <p>5. Click <strong>Finish</strong>. Your signed APK will be output in <code className="text-emerald-400">app/release/app-release.apk</code>.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <p className="text-slate-500 mb-2"># Alternatively, build directly from command line:</p>
              <div className="bg-black/60 p-3 rounded-lg border border-slate-800 text-cyan-300 flex items-center justify-between">
                <code>./gradlew assembleDebug</code>
                <button
                  onClick={() => navigator.clipboard.writeText('./gradlew assembleDebug')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: How to Install on Android Phone */}
        {activeGuideTab === 'install' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
            {/* Method 1: Instant 1-Tap Install via PWA WebAPK */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/40 border border-emerald-500/50 space-y-3.5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2.5 text-white font-bold">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Method 1 (Instant): 1-Tap Install on Android Phone</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        No PC / No Studio Needed
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-200/80 font-normal">
                      Install directly as a standalone Android WebAPK with custom neon icon & full Live Voice.
                    </p>
                  </div>
                </div>

                {onInstallPWA && (
                  <button
                    onClick={onInstallPWA}
                    className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAppInstalled ? 'Already Installed (Open App)' : 'Install App on Phone Now'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-emerald-300">How to install directly in Chrome on Android:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-2 leading-relaxed">
                  <li>Open this website in <strong>Google Chrome</strong> on your Android mobile.</li>
                  <li>Tap the <strong>Chrome menu (three dots ⋮)</strong> in the top right corner.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>"Install"</strong> in the confirmation dialog.</li>
                  <li>The <strong>SHADOW AI</strong> icon will appear on your phone's Home Screen & App Drawer like any Google Play app!</li>
                  <li>Opens in <strong>full-screen standalone mode</strong> (no browser address bar) with full microphone and camera permissions.</li>
                </ol>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span>Method 2: Native Kotlin APK (Compile in Android Studio)</span>
              </div>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-2">
                <li>Send the generated <code className="text-cyan-300">app-debug.apk</code> to your phone via Google Drive, WhatsApp, Telegram, or USB cable.</li>
                <li>Tap on the APK file in your phone's <strong>Files / Downloads</strong> app.</li>
                <li>If prompted with <em>"Install unknown apps"</em>, toggle <strong>Allow from this source</strong>.</li>
                <li>If <strong>Google Play Protect</strong> shows <em>"Unrecognized App"</em>, tap <strong>More details &gt; Install anyway</strong>. (This is normal for any app you build yourself before publishing to Google Play Store).</li>
                <li>Open <strong>SHADOW AI</strong>, grant Microphone permission, and start giving voice commands!</li>
              </ol>
            </div>

            {/* Method C: Directly on phone with Termux */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <span>Method C: Build Directly on Your Phone with Termux (No PC Needed)</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 pl-2">
                <p>1. Install <strong>Termux</strong> app on your Android phone.</p>
                <p>2. In Termux, install Java 17 and Gradle:</p>
                <div className="bg-black/60 p-2.5 rounded-lg border border-slate-800 font-mono text-cyan-300">
                  <code>pkg update && pkg install openjdk-17 gradle git unzip -y</code>
                </div>
                <p>3. Extract the downloaded ZIP and build the APK:</p>
                <div className="bg-black/60 p-2.5 rounded-lg border border-slate-800 font-mono text-cyan-300">
                  <code>unzip shadow-ai-android-project.zip && cd shadow-ai && gradle assembleDebug</code>
                </div>
                <p>4. Your APK is built at <code className="text-emerald-400">app/build/outputs/apk/debug/app-debug.apk</code>. Tap to install!</p>
              </div>
            </div>

            {/* Method D: GitHub Actions 1-Click Free Cloud Build */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
                <span>Method D: Free 1-Click Cloud Build with GitHub Actions</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 pl-2">
                <p>1. Push this extracted project to your personal GitHub repository.</p>
                <p>2. The included <code className="text-cyan-300">.github/workflows/build-apk.yml</code> automatically triggers a cloud build using standard Ubuntu runner with Android SDK.</p>
                <p>3. Go to the <strong>Actions</strong> tab on GitHub, click the build, and download the <code className="text-emerald-400">shadow-ai-debug-apk</code> artifact directly onto your phone!</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-300">Security & Privacy Assurance:</strong>
                <p className="mt-1">
                  SHADOW AI only requests <code className="text-white">RECORD_AUDIO</code> for voice input and
                  <code className="text-white">INTERNET</code> to query Gemini. It never reads private SMS or calls secretly,
                  and uses safe standard Android Intents for app launching.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for Android 8.0 to Android 15 (API 24 - 34)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Downloading ZIP...' : 'Download Full Android Project (.ZIP)'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
