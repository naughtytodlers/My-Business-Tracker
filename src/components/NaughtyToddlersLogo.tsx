import React from 'react';

interface NaughtyToddlersLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const NaughtyToddlersLogo: React.FC<NaughtyToddlersLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const defaultHeight =
    size === 'sm'
      ? 'h-6 sm:h-7'
      : size === 'md'
      ? 'h-6.5 sm:h-7.5 md:h-8.5'
      : size === 'lg'
      ? 'h-9 sm:h-10'
      : 'h-11 sm:h-13';

  const appliedClass = className.includes('h-') ? className : `${defaultHeight} w-auto ${className}`;

  return (
    <div className={`inline-flex items-center justify-center select-none ${appliedClass}`}>
      <svg
        viewBox="0 0 760 92"
        className="h-full w-auto drop-shadow-xs max-w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft 3D drop shadow */}
          <filter id="nt-bubble-shadow-exact" x="-10%" y="-10%" width="125%" height="135%">
            <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.16" />
          </filter>

          {/* Exact Gradients from image.png */}
          <linearGradient id="nt-gp1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5C9D" />
            <stop offset="50%" stopColor="#FA1F7C" />
            <stop offset="100%" stopColor="#D90E63" />
          </linearGradient>

          <linearGradient id="nt-go" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFA63D" />
            <stop offset="50%" stopColor="#FF7300" />
            <stop offset="100%" stopColor="#E05B00" />
          </linearGradient>

          <linearGradient id="nt-gy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE454" />
            <stop offset="50%" stopColor="#FFC000" />
            <stop offset="100%" stopColor="#E6A100" />
          </linearGradient>

          <linearGradient id="nt-gg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4AE361" />
            <stop offset="50%" stopColor="#16C92E" />
            <stop offset="100%" stopColor="#0EA822" />
          </linearGradient>

          <linearGradient id="nt-gcy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#42C6FF" />
            <stop offset="50%" stopColor="#00A7FF" />
            <stop offset="100%" stopColor="#008BE0" />
          </linearGradient>

          <linearGradient id="nt-gpr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#7C28C9" />
            <stop offset="100%" stopColor="#6317A6" />
          </linearGradient>

          <linearGradient id="nt-gbl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BEFF" />
            <stop offset="50%" stopColor="#0099FF" />
            <stop offset="100%" stopColor="#007CD1" />
          </linearGradient>

          <linearGradient id="nt-gvi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#791BB8" />
          </linearGradient>

          <linearGradient id="nt-gp2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF66A9" />
            <stop offset="50%" stopColor="#FF2A85" />
            <stop offset="100%" stopColor="#DE116A" />
          </linearGradient>
        </defs>

        {/* Bubbly Single-Line "Naughty Toddlers" Typography - Exactly Same to Same */}
        <g
          filter="url(#nt-bubble-shadow-exact)"
          fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
          fontWeight="900"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          paintOrder="stroke fill"
          strokeLinejoin="round"
          transform="translate(15, 66)"
        >
          {/* WORD 1: "Naughty" */}
          <text x="0" y="0" fontSize="68" fill="url(#nt-gp1)" letterSpacing="-2">N</text>
          <text x="54" y="-3" fontSize="62" fill="url(#nt-go)">a</text>
          <text x="98" y="-4" fontSize="62" fill="url(#nt-gy)">u</text>
          <text x="146" y="-3" fontSize="64" fill="url(#nt-gg)">g</text>
          <text x="198" y="-4" fontSize="66" fill="url(#nt-gcy)">h</text>
          <text x="250" y="-3" fontSize="64" fill="url(#nt-gpr)">t</text>
          <text x="286" y="-3" fontSize="64" fill="url(#nt-gp2)">y</text>

          {/* WORD 2: "Toddlers" beside Naughty on the same line with capital 'T' */}
          <text x="350" y="0" fontSize="68" fill="url(#nt-gbl)">T</text>
          <text x="398" y="-2" fontSize="64" fill="url(#nt-gg)">o</text>
          <text x="450" y="-2" fontSize="66" fill="url(#nt-gpr)">d</text>
          <text x="506" y="-2" fontSize="66" fill="url(#nt-gcy)">d</text>
          <text x="562" y="-2" fontSize="66" fill="url(#nt-go)">l</text>
          <text x="598" y="-4" fontSize="62" fill="url(#nt-gvi)">e</text>
          <text x="647" y="-4" fontSize="62" fill="url(#nt-gy)">r</text>
          <text x="688" y="-4" fontSize="62" fill="url(#nt-gp1)">s</text>
        </g>
      </svg>
    </div>
  );
};
