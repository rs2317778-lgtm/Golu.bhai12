import React from 'react';

interface ShadowLogoProps {
  size?: number; // size in pixels
  className?: string;
  glow?: boolean;
}

export const ShadowLogo: React.FC<ShadowLogoProps> = ({
  size = 48,
  className = '',
  glow = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none rounded-full ${
        glow ? 'shadow-neon-purple' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Rotating Gradient Border Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-cyan-400 to-indigo-600 p-[2px] animate-spin [animation-duration:9s]">
        <div className="w-full h-full rounded-full bg-[#030712]" />
      </div>

      {/* Ambient Radial Core */}
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-purple-950/90 via-[#070d1e] to-black flex items-center justify-center overflow-hidden border border-purple-500/20">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Custom Futuristic 'S' Glyph with Cyber Cutouts */}
        <svg
          viewBox="0 0 100 100"
          className="relative z-10 w-[64%] h-[64%] drop-shadow-[0_0_8px_rgba(192,132,252,0.85)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="neonFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a855f7" />
            </filter>
          </defs>

          {/* Upper arch */}
          <path
            d="M 75 22 C 60 14, 34 14, 25 28 C 17 40, 24 53, 48 57 L 55 58 C 76 62, 84 72, 76 84 C 67 96, 36 96, 22 86"
            stroke="url(#sGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonFilter)"
          />

          {/* Cyber Accent Dots */}
          <circle cx="76" cy="22" r="3.5" fill="#38bdf8" />
          <circle cx="22" cy="86" r="3.5" fill="#c084fc" />
          <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
};
