import React from 'react';

interface CuteToyTrainProps {
  className?: string;
  speed?: 'normal' | 'fast';
  compact?: boolean;
}

export const CuteToyTrain: React.FC<CuteToyTrainProps> = ({
  className = '',
  speed = 'normal',
  compact = false,
}) => {
  const speedClass = speed === 'fast' ? 'animate-train-move-fast' : 'animate-train-move';
  const scaleClass = compact ? 'scale-75 origin-bottom' : 'scale-90 sm:scale-100 origin-bottom';

  return (
    <div
      data-train-track="true"
      id="cute-toy-train-track"
      className={`w-full overflow-hidden pointer-events-none select-none relative h-20 sm:h-22 flex flex-col justify-end ${className}`}
      aria-hidden="true"
    >
      {/* Moving Train Wrapper */}
      <div className={`absolute bottom-2.5 left-0 will-change-transform ${speedClass}`}>
        <div className={`animate-train-bob ${scaleClass}`}>
          <svg
            width="340"
            height="86"
            viewBox="0 -30 340 86"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_4px_8px_rgba(124,58,237,0.15)] overflow-visible"
          >
            <defs>
              {/* Locomotive Body Gradient (Berry Pink / Magenta) */}
              <linearGradient id="train-pink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF659F" />
                <stop offset="100%" stopColor="#E60067" />
              </linearGradient>

              {/* Engine Turbine Gradient (Metallic Cyan / Steel Blue) */}
              <linearGradient id="train-turbine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0369A1" />
              </linearGradient>

              {/* Real & Simple Soft Feathered Smoke Gradient */}
              <radialGradient id="real-smoke-puff" cx="45%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#F8FAFC" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#E2E8F0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
              </radialGradient>

              {/* Cab / Roof Gradient (Royal Purple) */}
              <linearGradient id="train-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>

              {/* Carriage 1 (Cyan / Turquoise) */}
              <linearGradient id="train-cyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>

              {/* Carriage 2 (Sunny Yellow / Orange) */}
              <linearGradient id="train-yellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Wheel Gradient */}
              <linearGradient id="train-wheel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* ============================================================ */}
            {/* REAL AND SIMPLE TRAIN SMOKE FROM FIRST MAIN TURBINE          */}
            {/* ============================================================ */}
            <g id="first-main-turbine-smoke" className="pointer-events-none">
              {/* Puff 1: Fresh small cloudlet emerging from main turbine mouth */}
              <g className="animate-real-smoke-1" style={{ transformOrigin: '275px 10px' }}>
                <circle cx="275" cy="7" r="3.6" fill="url(#real-smoke-puff)" />
                <circle cx="273.5" cy="6.2" r="2.2" fill="#FFFFFF" opacity="0.6" />
              </g>

              {/* Puff 2: Softly expanding puff floating up & backward */}
              <g className="animate-real-smoke-2" style={{ transformOrigin: '275px 10px' }}>
                <circle cx="270" cy="1" r="5.2" fill="url(#real-smoke-puff)" />
                <circle cx="268" cy="0" r="3.2" fill="#FFFFFF" opacity="0.5" />
              </g>

              {/* Puff 3: Gentle billowing cloudlet trailing above the cab */}
              <g className="animate-real-smoke-3" style={{ transformOrigin: '275px 10px' }}>
                <circle cx="262" cy="-6" r="7.2" fill="url(#real-smoke-puff)" />
                <circle cx="259.5" cy="-7.2" r="4.5" fill="#FFFFFF" opacity="0.4" />
              </g>

              {/* Puff 4: Soft dissipating wisp fading gracefully into the air */}
              <g className="animate-real-smoke-4" style={{ transformOrigin: '275px 10px' }}>
                <circle cx="251" cy="-14" r="9.5" fill="url(#real-smoke-puff)" />
              </g>
            </g>

            {/* ============================================================ */}
            {/* CARRIAGE 2: CABOOSE WITH FLAG (Left Car, x = 10 to 80)       */}
            {/* ============================================================ */}
            <g id="caboose">
              {/* Hitch connector */}
              <rect x="76" y="36" width="14" height="3.5" rx="1.5" fill="#64748B" />

              {/* Carriage Body */}
              <rect x="12" y="20" width="66" height="22" rx="6" fill="url(#train-yellow)" stroke="#D97706" strokeWidth="1" />
              
              {/* Roof Trim */}
              <path d="M10 20C10 18 14 16 45 16C76 16 80 18 80 20Z" fill="#F97316" />

              {/* Cheerful little flag */}
              <path d="M16 16V6M16 6L28 10L16 14Z" fill="#EF4444" stroke="#DC2626" strokeWidth="0.8" />
              <line x1="16" y1="16" x2="16" y2="5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

              {/* Windows */}
              <rect x="22" y="24" width="12" height="10" rx="3" fill="#FFFFFF" opacity="0.9" />
              <rect x="42" y="24" width="12" height="10" rx="3" fill="#FFFFFF" opacity="0.9" />
              <rect x="60" y="24" width="10" height="10" rx="3" fill="#FFFFFF" opacity="0.9" />

              {/* Caboose Wheels */}
              <g className="animate-wheel" style={{ transformOrigin: '28px 43px' }}>
                <circle cx="28" cy="43" r="7" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.2" />
                <circle cx="28" cy="43" r="2.5" fill="#92400E" />
                <line x1="28" y1="36" x2="28" y2="50" stroke="#92400E" strokeWidth="1" />
                <line x1="21" y1="43" x2="35" y2="43" stroke="#92400E" strokeWidth="1" />
              </g>
              <g className="animate-wheel" style={{ transformOrigin: '64px 43px' }}>
                <circle cx="64" cy="43" r="7" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.2" />
                <circle cx="64" cy="43" r="2.5" fill="#92400E" />
                <line x1="64" y1="36" x2="64" y2="50" stroke="#92400E" strokeWidth="1" />
                <line x1="57" y1="43" x2="71" y2="43" stroke="#92400E" strokeWidth="1" />
              </g>
            </g>

            {/* ============================================================ */}
            {/* CARRIAGE 1: TOY CARGO (Middle Car, x = 90 to 160)            */}
            {/* ============================================================ */}
            <g id="cargo">
              {/* Hitch connector */}
              <rect x="156" y="36" width="14" height="3.5" rx="1.5" fill="#64748B" />

              {/* Toy Building Blocks stacked in the wagon */}
              {/* Block 1 (Pink Block 'N') */}
              <rect x="98" y="13" width="16" height="16" rx="3.5" fill="#EC4899" stroke="#BE185D" strokeWidth="0.8" />
              <text x="106" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">N</text>
              
              {/* Block 2 (Purple Block 'T') */}
              <rect x="116" y="11" width="16" height="16" rx="3.5" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="0.8" />
              <text x="124" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">T</text>

              {/* Star on top */}
              <polygon points="144,12 146,17 151,17 147,20 149,25 144,22 139,25 141,20 137,17 142,17" fill="#FBBF24" stroke="#D97706" strokeWidth="0.6" />

              {/* Carriage Body */}
              <rect x="90" y="23" width="68" height="19" rx="5" fill="url(#train-cyan)" stroke="#0369A1" strokeWidth="1" />
              
              {/* Side Stripes */}
              <line x1="94" y1="28" x2="154" y2="28" stroke="#E0F2FE" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Cargo Wheels */}
              <g className="animate-wheel" style={{ transformOrigin: '106px 43px' }}>
                <circle cx="106" cy="43" r="7" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.2" />
                <circle cx="106" cy="43" r="2.5" fill="#92400E" />
                <line x1="106" y1="36" x2="106" y2="50" stroke="#92400E" strokeWidth="1" />
                <line x1="99" y1="43" x2="113" y2="43" stroke="#92400E" strokeWidth="1" />
              </g>
              <g className="animate-wheel" style={{ transformOrigin: '142px 43px' }}>
                <circle cx="142" cy="43" r="7" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.2" />
                <circle cx="142" cy="43" r="2.5" fill="#92400E" />
                <line x1="142" y1="36" x2="142" y2="50" stroke="#92400E" strokeWidth="1" />
                <line x1="135" y1="43" x2="149" y2="43" stroke="#92400E" strokeWidth="1" />
              </g>
            </g>

            {/* ============================================================ */}
            {/* LOCOMOTIVE ENGINE (Right, x = 170 to 305)                     */}
            {/* ============================================================ */}
            <g id="locomotive">
              {/* Engine Boiler Tank */}
              <rect x="220" y="22" width="70" height="20" rx="8" fill="url(#train-pink)" stroke="#BE123C" strokeWidth="1" />
              
              {/* Front Cowcatcher / Bumper */}
              <polygon points="290,32 305,42 290,42" fill="#E11D48" stroke="#9F1239" strokeWidth="0.8" />
              <line x1="293" y1="35" x2="300" y2="42" stroke="#FDA4AF" strokeWidth="1" />
              <line x1="297" y1="35" x2="304" y2="42" stroke="#FDA4AF" strokeWidth="1" />

              {/* Front Headlight (Glowing Gold) */}
              <rect x="290" y="24" width="6" height="8" rx="2" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />
              <circle cx="294" cy="28" r="2" fill="#FEF08A" />

              {/* FIRST MAIN TURBINE (Leading at the front of the locomotive engine, x = 275) */}
              <g id="first-main-turbine">
                {/* Turbine Mounting Collar on Boiler */}
                <rect x="270" y="20" width="10" height="3" rx="1" fill="#475569" stroke="#334155" strokeWidth="0.6" />
                
                {/* Main Turbine Stack Body */}
                <path d="M271 20L270 12H280L279 20Z" fill="url(#train-turbine)" stroke="#0369A1" strokeWidth="0.8" />
                
                {/* Polished Turbine Rim Collar */}
                <ellipse cx="275" cy="12" rx="5.5" ry="1.8" fill="#38BDF8" stroke="#0284C7" strokeWidth="0.6" />
                
                {/* Turbine Flue Exhaust Opening */}
                <ellipse cx="275" cy="12" rx="3.5" ry="1.2" fill="#0F172A" />
                
                {/* High-Speed Spinning Turbine Rotor Inside Vent */}
                <g className="animate-turbine-spin" style={{ transformOrigin: '275px 12px' }}>
                  <line x1="275" y1="10.8" x2="275" y2="13.2" stroke="#FEF08A" strokeWidth="1" strokeLinecap="round" />
                  <line x1="272.8" y1="12" x2="277.2" y2="12" stroke="#FEF08A" strokeWidth="1" strokeLinecap="round" />
                  <circle cx="275" cy="12" r="0.9" fill="#F59E0B" />
                </g>
              </g>

              {/* Boiler Trim Bands */}
              <line x1="236" y1="22" x2="236" y2="42" stroke="#FEF08A" strokeWidth="1.2" opacity="0.7" />
              <line x1="262" y1="22" x2="262" y2="42" stroke="#FEF08A" strokeWidth="1.2" opacity="0.7" />

              {/* Golden Steam Dome on Boiler */}
              <ellipse cx="248" cy="21" rx="5" ry="3.5" fill="#FBBF24" stroke="#D97706" strokeWidth="0.6" />
              <rect x="245" y="21" width="6" height="3" rx="0.5" fill="#D97706" />

              {/* Driver Cab */}
              <rect x="172" y="12" width="50" height="30" rx="6" fill="url(#train-purple)" stroke="#5B21B6" strokeWidth="1" />
              
              {/* Curved Cab Roof */}
              <path d="M168 14C168 10 178 9 197 9C216 9 226 10 226 14Z" fill="#FF5C9D" stroke="#BE123C" strokeWidth="0.8" />

              {/* Cab Window */}
              <rect x="180" y="16" width="16" height="13" rx="3.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="188" cy="22" r="3" fill="#F43F5E" opacity="0.8" />

              {/* Locomotive Wheels */}
              {/* Small Front Wheels */}
              <g className="animate-wheel" style={{ transformOrigin: '276px 44px' }}>
                <circle cx="276" cy="44" r="6" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1" />
                <circle cx="276" cy="44" r="2" fill="#92400E" />
                <line x1="276" y1="38" x2="276" y2="50" stroke="#92400E" strokeWidth="0.8" />
                <line x1="270" y1="44" x2="282" y2="44" stroke="#92400E" strokeWidth="0.8" />
              </g>

              {/* Middle Wheel */}
              <g className="animate-wheel" style={{ transformOrigin: '242px 42px' }}>
                <circle cx="242" cy="42" r="8" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.2" />
                <circle cx="242" cy="42" r="2.5" fill="#92400E" />
                <line x1="242" y1="34" x2="242" y2="50" stroke="#92400E" strokeWidth="1" />
                <line x1="234" y1="42" x2="250" y2="42" stroke="#92400E" strokeWidth="1" />
              </g>

              {/* Big Driving Wheel under Cab */}
              <g className="animate-wheel" style={{ transformOrigin: '196px 40px' }}>
                <circle cx="196" cy="40" r="10.5" fill="url(#train-wheel)" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="196" cy="40" r="3" fill="#92400E" />
                <line x1="196" y1="30" x2="196" y2="50" stroke="#92400E" strokeWidth="1.2" />
                <line x1="186" y1="40" x2="206" y2="40" stroke="#92400E" strokeWidth="1.2" />
                <line x1="189" y1="33" x2="203" y2="47" stroke="#92400E" strokeWidth="1" />
                <line x1="189" y1="47" x2="203" y2="33" stroke="#92400E" strokeWidth="1" />
              </g>

              {/* Piston drive rod */}
              <line x1="196" y1="41" x2="242" y2="42" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>

      {/* RAILWAY TRACK (Dotted rails with sleepers along the bottom) */}
      <div className="w-full relative h-2.5 flex items-center bg-slate-200/30">
        {/* Top Rail */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-300 via-pink-400 to-sky-300 opacity-90" />
        
        {/* Bottom Rail */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-300 via-amber-400 to-sky-300 opacity-90" />

        {/* Railway Wooden Ties (Repeated pattern) */}
        <div
          className="w-full h-full opacity-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #64748b 0, #64748b 2px, transparent 2px, transparent 14px)',
          }}
        />
      </div>
    </div>
  );
};
