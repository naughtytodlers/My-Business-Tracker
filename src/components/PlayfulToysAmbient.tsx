import React, { useEffect, useRef, useState } from 'react';

/**
 * Playful ambient animations for Naughty Toddlers:
 * - Autonomous Toy Airplane crawling in smooth random directions with clearly visible propeller fan and visible billowing smoke trail
 * - Mechanical wind-up clockwork gears & ticking key
 * - Spinning colorful pinwheel toy
 * - Rocking wooden toy horse
 * 
 * Styled with fixed/absolute positioning, pointer-events-none, and zero interference with forms, buttons, or text.
 */

interface TrailingSmokePuff {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const ToyAirplane: React.FC<{ className?: string }> = ({ className = '' }) => {
  const planeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep motion physics in refs for 60fps butter-smooth execution without React re-render lag
  const stateRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.15 : 120,
    y: typeof window !== 'undefined' ? Math.min(120, window.innerHeight * 0.2) : 120,
    angle: 0.1, // radians
    speed: 46,  // steady continuous cruise speed (px/s) - NEVER stops or halts!
    directionX: 1, // 1 cruising towards right, -1 cruising towards left
    swayTime: 0,
    lastTime: 0,
    lastPuffTime: 0,
    puffs: [] as Array<{
      x: number;
      y: number;
      radius: number;
      opacity: number;
      age: number;
      maxLife: number;
    }>,
  });

  useEffect(() => {
    let animId: number;

    // Helper to calculate the highest top edge of any visible train & railway track in the viewport
    const getTrainTrackTopBound = (): number => {
      if (typeof document === 'undefined') return Infinity;
      const trackEls = document.querySelectorAll('[data-train-track="true"]');
      let minTop = Infinity;
      trackEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > -20 && rect.top < window.innerHeight + 150) {
          if (rect.top < minTop) {
            minTop = rect.top;
          }
        }
      });
      return minTop;
    };

    // Safe flight altitude ceiling in the sky: strictly above train & track
    const getFlightAltitudeLimits = (h: number) => {
      const trainTop = getTrainTrackTopBound();
      // Keep at least 95px clearance above the highest visible train or railway track
      const trainAvoidanceCeiling = trainTop !== Infinity ? trainTop - 95 : h - 180;
      const minY = Math.max(38, h * 0.06);
      const maxSafeY = Math.max(minY + 40, Math.min(h * 0.50, trainAvoidanceCeiling, h - 170));
      return { minY, maxSafeY };
    };

    // Keep canvas dimensions synced with viewport
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const loop = (currentTime: number) => {
      const s = stateRef.current;
      if (!s.lastTime) {
        s.lastTime = currentTime;
        s.lastPuffTime = currentTime;
      }
      const dt = Math.min((currentTime - s.lastTime) / 1000, 0.05);
      s.lastTime = currentTime;
      s.swayTime += dt;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const { minY, maxSafeY } = getFlightAltitudeLimits(h);

      // --- SMOOTH CONTINUOUS FLIGHT NAVIGATION ACROSS THE ENTIRE PAGE ---
      const midSky = (minY + maxSafeY) / 2;
      const skyAmplitude = (maxSafeY - minY) * 0.32;
      // Gentle sinusoidal altitude curve across the sky
      const targetAltitude = midSky + Math.sin(s.swayTime * 0.35) * skyAmplitude;

      // Determine horizontal cruising direction across the full width of the page
      // Real driving / cruising: fly all the way across, then gracefully bank 180 degrees
      if (s.directionX === 1 && s.x > w - 110) {
        s.directionX = -1; // Smoothly begin turn towards left
      } else if (s.directionX === -1 && s.x < 90) {
        s.directionX = 1; // Smoothly begin turn towards right
      }

      // Calculate desired flight heading based on cruise corridor
      let desiredAngle: number;
      if (s.directionX === 1) {
        // Cruising towards the right side of the screen
        const targetX = w - 40;
        const dy = targetAltitude - s.y;
        desiredAngle = Math.atan2(dy, targetX - s.x);
        desiredAngle = Math.max(-0.45, Math.min(0.45, desiredAngle));
      } else {
        // Cruising towards the left side of the screen
        const targetX = 40;
        const dy = targetAltitude - s.y;
        desiredAngle = Math.atan2(dy, targetX - s.x);
        if (desiredAngle > 0) {
          desiredAngle = Math.max(Math.PI - 0.45, Math.min(Math.PI + 0.45, desiredAngle));
        } else {
          desiredAngle = Math.min(-Math.PI + 0.45, Math.max(-Math.PI - 0.45, desiredAngle));
        }
      }

      // Ground & Train Safety Repulsion:
      // If approaching lower altitude limit (near the train & track), smoothly steer upward
      const groundMargin = maxSafeY - s.y;
      if (groundMargin < 70) {
        const climbBlend = Math.max(0, Math.min(1, (70 - groundMargin) / 70));
        if (s.directionX === 1) {
          desiredAngle = desiredAngle * (1 - climbBlend) + (-0.45) * climbBlend;
        } else {
          const upwardLeft = -Math.PI + 0.45;
          desiredAngle = desiredAngle * (1 - climbBlend) + upwardLeft * climbBlend;
        }
      } else if (s.y - minY < 25) {
        const diveBlend = Math.max(0, Math.min(1, (25 - (s.y - minY)) / 25));
        if (s.directionX === 1) {
          desiredAngle = desiredAngle * (1 - diveBlend) + (0.35) * diveBlend;
        } else {
          const downwardLeft = Math.PI - 0.35;
          desiredAngle = desiredAngle * (1 - diveBlend) + downwardLeft * diveBlend;
        }
      }

      // Smooth Angular Rate (NO sudden jerks or snaps!)
      let angleDiff = desiredAngle - s.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      // Real vehicle steering: clamp maximum turn rate to 0.92 rad/s
      const maxTurn = 0.92 * dt;
      s.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn);

      // Continuous forward crawl: NEVER stops, NEVER halts!
      s.x += Math.cos(s.angle) * s.speed * dt;
      s.y += Math.sin(s.angle) * s.speed * dt;

      // Soft boundary cushioning
      s.x = Math.max(10, Math.min(w - 75, s.x));
      s.y = Math.max(minY, Math.min(maxSafeY, s.y));

      // Update plane position and rotation directly on DOM element for 60fps
      if (planeRef.current) {
        const deg = (s.angle * 180) / Math.PI;
        planeRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${deg}deg)`;
      }

      // --- ZERO-LAG HIGH-PERFORMANCE SMOKE PUFFS ON CANVAS ---
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Update and draw existing smoke puffs
          for (let i = s.puffs.length - 1; i >= 0; i--) {
            const p = s.puffs[i];
            p.age += dt;
            if (p.age >= p.maxLife) {
              s.puffs.splice(i, 1);
              continue;
            }
            const progress = p.age / p.maxLife;
            const currentRadius = p.radius + progress * 13;
            const currentOpacity = p.opacity * (1 - progress);

            // Gentle backward drift
            p.x -= Math.cos(s.angle) * 4 * dt;
            p.y -= 4 * dt;

            // Soft feathered radial cloud gradient
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.85})`);
            grad.addColorStop(0.5, `rgba(241, 245, 249, ${currentOpacity * 0.55})`);
            grad.addColorStop(0.85, `rgba(203, 213, 225, ${currentOpacity * 0.2})`);
            grad.addColorStop(1, 'rgba(203, 213, 225, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Spawn fresh smoke puff behind exhaust nozzle every 220ms
      if (currentTime - s.lastPuffTime > 220) {
        s.lastPuffTime = currentTime;
        const exhaustOffset = 21;
        const puffX = s.x + 35 - Math.cos(s.angle) * exhaustOffset;
        const puffY = s.y + 13 - Math.sin(s.angle) * exhaustOffset;

        // Keep puffs strictly in the sky above the train & track
        if (puffY < maxSafeY + 30) {
          s.puffs.push({
            x: puffX,
            y: puffY,
            radius: 4,
            opacity: 0.8,
            age: 0,
            maxLife: 2.2,
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen pointer-events-none select-none z-15 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* ======================================================== */}
      {/* 1. VISIBLE BILLOWING SMOKE PUFFS ON HARDWARE CANVAS      */}
      {/* ======================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ======================================================== */}
      {/* 2. AUTONOMOUS AIRPLANE (REDUCED COMPACT CUTE SIZE)       */}
      {/* ======================================================== */}
      <div
        ref={planeRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transformOrigin: '35px 13px' }}
      >
        <svg
          width="80"
          height="29"
          viewBox="0 0 132 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_4px_10px_rgba(244,63,94,0.22)]"
        >
          <defs>
            {/* Plane Fuselage Gradient */}
            <linearGradient id="plane-body-compact" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="45%" stopColor="#F43F5E" />
              <stop offset="85%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>

            {/* Wing Gold Gradient */}
            <linearGradient id="plane-wing-compact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="40%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Distinct Tail Smoke Gradient */}
            <radialGradient id="tail-smoke-grad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F1F5F9" />
              <stop offset="80%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </radialGradient>
          </defs>

          {/* ======================================================== */}
          {/* ATTACHED BILLOWING SMOKE CLOUDS (CLEARLY VISIBLE)        */}
          {/* ======================================================== */}
          <g id="attached-smoke-plume">
            {/* Smoke Puff 3 (Farthest attached) */}
            <g className="animate-smoke-3" style={{ transformOrigin: '22px 21px' }}>
              <circle cx="8" cy="21" r="7.5" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="4" cy="17" r="5" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="5" cy="25" r="5.5" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="8" cy="21" r="4.5" fill="#FFFFFF" opacity="0.85" />
            </g>

            {/* Smoke Puff 2 (Mid attached) */}
            <g className="animate-smoke-2" style={{ transformOrigin: '22px 21px' }}>
              <circle cx="16" cy="21" r="6" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="13" cy="18" r="4.2" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="14" cy="24" r="4.2" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
            </g>

            {/* Smoke Puff 1 (Fresh from exhaust) */}
            <g className="animate-smoke-1" style={{ transformOrigin: '22px 21px' }}>
              <circle cx="22" cy="21" r="4.5" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="20" cy="19" r="3.2" fill="url(#tail-smoke-grad)" stroke="#94A3B8" strokeWidth="0.8" />
            </g>
          </g>

          {/* ======================================================== */}
          {/* AIRCRAFT BODY & STRUCTURE                                */}
          {/* ======================================================== */}

          {/* Exhaust Pipe */}
          <rect x="24" y="19" width="6" height="5" rx="1.5" fill="#475569" stroke="#334155" strokeWidth="0.8" />
          <ellipse cx="25" cy="21.5" rx="1.5" ry="2" fill="#F97316" className="animate-afterburner" />

          {/* Tail Fin & Rudder */}
          <path
            d="M30 19L18 8C17 7 21 6 26 7L36 18Z"
            fill="#0EA5E9"
            stroke="#0284C7"
            strokeWidth="1"
          />
          <line x1="22" y1="9" x2="28" y2="16" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="25" y1="8" x2="31" y2="15" stroke="#FDE047" strokeWidth="1.2" strokeLinecap="round" />

          {/* Horizontal Tail Wing */}
          <path
            d="M29 23L18 29C17 30 20 31 24 30L34 24Z"
            fill="#0284C7"
            stroke="#0369A1"
            strokeWidth="0.8"
          />

          {/* Main Fuselage Body */}
          <path
            d="M28 21.5C28 16 44 12 76 12C98 12 110 16 116 21.5C110 27 98 31 76 31C44 31 28 27 28 21.5Z"
            fill="url(#plane-body-compact)"
            stroke="#BE123C"
            strokeWidth="1.2"
          />

          {/* Belly Racing Swoop */}
          <path
            d="M32 23.5C46 23.5 76 23.5 110 22C106 27 94 29.5 76 29.5C50 29.5 38 27 32 23.5Z"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Star Decal */}
          <polygon
            points="58,19 59.5,21.5 62.5,21.5 60,23 61,26 58,24.5 55,26 56,23 53.5,21.5 56.5,21.5"
            fill="#FDE047"
            stroke="#D97706"
            strokeWidth="0.6"
          />

          {/* Cockpit Canopy */}
          <ellipse cx="76" cy="15" rx="11" ry="6" fill="#FFFFFF" opacity="0.95" />
          <ellipse cx="78" cy="15" rx="7" ry="4" fill="#38BDF8" opacity="0.8" />

          {/* Aviator Toddler Pilot */}
          <circle cx="76" cy="14" r="3.2" fill="#FDE047" />
          <ellipse cx="78" cy="13.2" rx="1.8" ry="1.4" fill="#0F172A" />
          <ellipse cx="78.5" cy="13.2" rx="1" ry="0.8" fill="#38BDF8" />

          {/* Fluttering Scarf */}
          <path
            d="M72 16C66 16 62 18 56 16"
            stroke="#F59E0B"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="animate-train-bob"
          />

          {/* Top Wing */}
          <path
            d="M72 14L50 2C48 1 52 0 57 1L88 13Z"
            fill="url(#plane-wing-compact)"
            stroke="#D97706"
            strokeWidth="1"
          />

          {/* Bottom Wing */}
          <path
            d="M72 29L50 41C48 42 52 43 57 42L88 30Z"
            fill="url(#plane-wing-compact)"
            stroke="#D97706"
            strokeWidth="1"
          />

          {/* Flashing Navigation Beacons */}
          <circle cx="50" cy="2" r="2.2" fill="#EF4444" className="animate-beacon-red" />
          <circle cx="50" cy="41" r="2.2" fill="#10B981" className="animate-beacon-green" />

          {/* Sleek Streamlined Jet Nose Cone (Fan removed) */}
          <path
            d="M114 16.5C114 16.5 124 19 126 21.5C124 24 114 26.5 114 26.5Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1"
          />
          <ellipse cx="115" cy="21.5" rx="2" ry="5" fill="#EF4444" opacity="0.85" />
          <circle cx="125" cy="21.5" r="1.2" fill="#FEF08A" />
        </svg>
      </div>
    </div>
  );
};

export const MechanicalGearToy: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-2 rounded-2xl bg-white/90 backdrop-blur-xs border border-purple-200/80 shadow-xs select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Main Colorful Gear (Clockwise) */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-gear-cw filter drop-shadow-2xs text-purple-600"
        >
          <path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            fill="#8B5CF6"
          />
          <path
            d="M19.4 13C19.45 12.67 19.5 12.34 19.5 12C19.5 11.66 19.45 11.33 19.4 11L21.54 9.33C21.73 9.18 21.78 8.91 21.66 8.69L19.63 5.17C19.5 4.95 19.24 4.87 19.02 4.96L16.5 5.97C15.98 5.57 15.4 5.24 14.77 5L14.39 2.34C14.35 2.1 14.15 1.92 13.9 1.92H9.86C9.61 1.92 9.41 2.1 9.37 2.34L8.99 5C8.36 5.24 7.78 5.57 7.26 5.97L4.74 4.96C4.52 4.87 4.26 4.95 4.13 5.17L2.1 8.69C1.98 8.91 2.03 9.18 2.22 9.33L4.36 11C4.31 11.33 4.26 11.66 4.26 12C4.26 12.34 4.31 12.67 4.36 13L2.22 14.67C2.03 14.82 1.98 15.09 2.1 15.31L4.13 18.83C4.26 19.05 4.52 19.13 4.74 19.04L7.26 18.03C7.78 18.43 8.36 18.76 8.99 19L9.37 21.66C9.41 21.9 9.61 22.08 9.86 22.08H13.9C14.15 22.08 14.35 21.9 14.39 21.66L14.77 19C15.4 18.76 15.98 18.43 16.5 18.03L19.02 19.04C19.24 19.13 19.5 19.05 19.63 18.83L21.66 15.31C21.78 15.09 21.73 14.82 21.54 14.67L19.4 13Z"
            fill="#A78BFA"
            stroke="#7C3AED"
            strokeWidth="0.8"
          />
        </svg>

        {/* Small Interlocking Gear (Counter-Clockwise) */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -top-1 -right-1 animate-gear-ccw filter drop-shadow-2xs text-amber-500"
        >
          <path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            fill="#F59E0B"
          />
          <path
            d="M19.4 13C19.45 12.67 19.5 12.34 19.5 12C19.5 11.66 19.45 11.33 19.4 11L21.54 9.33C21.73 9.18 21.78 8.91 21.66 8.69L19.63 5.17C19.5 4.95 19.24 4.87 19.02 4.96L16.5 5.97C15.98 5.57 15.4 5.24 14.77 5L14.39 2.34C14.35 2.1 14.15 1.92 13.9 1.92H9.86C9.61 1.92 9.41 2.1 9.37 2.34L8.99 5C8.36 5.24 7.78 5.57 7.26 5.97L4.74 4.96C4.52 4.87 4.26 4.95 4.13 5.17L2.1 8.69C1.98 8.91 2.03 9.18 2.22 9.33L4.36 11C4.31 11.33 4.26 11.66 4.26 12C4.26 12.34 4.31 12.67 4.36 13L2.22 14.67C2.03 14.82 1.98 15.09 2.1 15.31L4.13 18.83C4.26 19.05 4.52 19.13 4.74 19.04L7.26 18.03C7.78 18.43 8.36 18.76 8.99 19L9.37 21.66C9.41 21.9 9.61 22.08 9.86 22.08H13.9C14.15 22.08 14.35 21.9 14.39 21.66L14.77 19C15.4 18.76 15.98 18.43 16.5 18.03L19.02 19.04C19.24 19.13 19.5 19.05 19.63 18.83L21.66 15.31C21.78 15.09 21.73 14.82 21.54 14.67L19.4 13Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      {/* Wind-up Clockwork Key */}
      <div className="flex flex-col items-center animate-windup">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="8" r="4.5" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.2" />
          <circle cx="17" cy="8" r="4.5" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.2" />
          <circle cx="7" cy="8" r="2" fill="#FFFFFF" />
          <circle cx="17" cy="8" r="2" fill="#FFFFFF" />
          <path d="M12 9V22M10 22H14" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

export const PinwheelToy: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-8 h-12 flex flex-col items-center pointer-events-none select-none ${className}`} aria-hidden="true">
      {/* Wooden Stick */}
      <div className="absolute top-4 w-1 h-8 bg-amber-700/60 rounded-full" />
      {/* Spinning Pinwheel Blades */}
      <div className="relative w-7 h-7 animate-pinwheel filter drop-shadow-2xs">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blade 1 (Pink) */}
          <path d="M14 14C14 7 7 7 7 14H14Z" fill="#F43F5E" />
          {/* Blade 2 (Blue) */}
          <path d="M14 14C21 14 21 7 14 7V14Z" fill="#0EA5E9" />
          {/* Blade 3 (Yellow) */}
          <path d="M14 14C14 21 21 21 21 14H14Z" fill="#F59E0B" />
          {/* Blade 4 (Green) */}
          <path d="M14 14C7 14 7 21 14 21V14Z" fill="#10B981" />
          {/* Center Pin Button */}
          <circle cx="14" cy="14" r="2.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
          <circle cx="14" cy="14" r="1.2" fill="#DC2626" />
        </svg>
      </div>
    </div>
  );
};

export const RockingHorseToy: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="animate-rocking-horse filter drop-shadow-2xs">
        <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rocker Base (Curved bottom runner) */}
          <path d="M3 31C12 35 30 35 39 31" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M7 29C14 32 28 32 35 29" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" />

          {/* Legs */}
          <line x1="12" y1="20" x2="8" y2="30" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="20" x2="32" y2="30" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />

          {/* Horse Body */}
          <rect x="11" y="15" width="20" height="7" rx="3.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />

          {/* Saddle */}
          <rect x="18" y="14" width="7" height="4" rx="1.5" fill="#F43F5E" />

          {/* Horse Neck & Head */}
          <path d="M27 16L32 9C33 7 35 7 36 9L38 12C37 13 34 16 31 18Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          {/* Mane */}
          <path d="M29 13C28 10 30 7 32 7" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          {/* Eye */}
          <circle cx="35" cy="10" r="1" fill="#0F172A" />

          {/* Handlebar */}
          <circle cx="32" cy="11" r="2" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />

          {/* Tail */}
          <path d="M11 18C8 17 7 20 8 23" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
